import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { DebrisLocation, DebrisLevel } from '../types';
import { LOCATIONS } from '../constants';
import { Crosshair } from 'lucide-react';

interface MapVizProps {
  activeLocationId: string | null;
  onLocationSelect: (location: DebrisLocation) => void;
}

const MapViz: React.FC<MapVizProps> = ({ activeLocationId, onLocationSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [countyData, setCountyData] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);

  // Load US topology for better CA resolution
  useEffect(() => {
    // Switch to counties-10m to get internal structure (counties act as "sectors")
    fetch('https://unpkg.com/us-atlas@3.0.0/counties-10m.json')
      .then(response => response.json())
      .then(data => {
        const states = feature(data, data.objects.states) as any;
        const counties = feature(data, data.objects.counties) as any;
        
        const caFeature = states.features.find((f: any) => f.properties.name === "California");
        
        // Filter for CA counties (FIPS code starts with "06" or matches numeric pattern)
        const caCounties = counties.features.filter((f: any) => {
            // Check for string ID "06xxx" or number ID 6xxx
            if (typeof f.id === 'string') return f.id.startsWith('06');
            if (typeof f.id === 'number') return Math.floor(f.id / 1000) === 6;
            return false;
        });

        setGeoData(caFeature);
        setCountyData(caCounties);
      });
  }, []);

  // Robust Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if dimensions actually changed and are valid
        if (width > 0 && height > 0) {
            setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Zoom Behavior
  useEffect(() => {
    if (!svgRef.current) return;
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8]) // Max zoom 8x
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    d3.select(svgRef.current).call(zoom);
  }, []);

  // Draw Map
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear everything including defs
    
    // --- DEFINITIONS ---
    const defs = svg.append("defs");

    // 1. Drop Shadow Filter for Land
    const filter = defs.append("filter")
        .attr("id", "land-shadow")
        .attr("height", "130%");
    
    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 3)
        .attr("result", "blur");
        
    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 3) // slightly downwards
        .attr("result", "offsetBlur");

    // Adjust shadow opacity
    const componentTransfer = filter.append("feComponentTransfer");
    componentTransfer.append("feFuncA")
        .attr("type", "linear")
        .attr("slope", 0.2); // 20% opacity shadow

    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "offsetBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // 2. Hatch Pattern for Topography (subtle texture)
    const pattern = defs.append("pattern")
        .attr("id", "topo-hatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8 / transform.k) // Scale pattern with zoom
        .attr("height", 8 / transform.k)
        .attr("patternTransform", "rotate(45)");
    
    pattern.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 8 / transform.k)
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1 / transform.k)
        .attr("opacity", 0.3);

    // --- DRAWING LAYERS ---

    // 0. Ocean Background (Fill the entire SVG)
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#f0f9ff"); // Sky-50 (Very light blue)

    // Create a group for the map content that responds to zoom
    const g = svg.append("g");
    g.attr("transform", transform.toString());

    // Fit projection to California with padding so it's centered nicely
    const padding = 50;
    const projection = d3.geoMercator()
      .fitExtent(
          [[padding, padding], [dimensions.width - padding, dimensions.height - padding]], 
          geoData
      );

    const path = d3.geoPath().projection(projection);

    // 0.5 Ocean Graticule (Nautical Chart lines)
    // Drawn behind land, but on top of ocean background
    const graticule = d3.geoGraticule().step([1, 1]); 
    g.append("path")
      .datum(graticule)
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "#bae6fd") // Sky-200
      .attr("stroke-width", 0.5 / transform.k)
      .attr("stroke-dasharray", "4,4")
      .style("pointer-events", "none");

    // 1. California Land Base (White with Shadow)
    g.append("path")
      .datum(geoData)
      .attr("d", path as any)
      .attr("fill", "#ffffff")
      .attr("stroke", "none")
      .style("filter", "url(#land-shadow)");

    // 2. Topographical / County Sectors Overlay
    // Provides the internal structure/transparency asked for previously
    if (countyData.length > 0) {
        g.selectAll(".county")
            .data(countyData)
            .enter()
            .append("path")
            .attr("d", path as any)
            .attr("fill", "url(#topo-hatch)") // Use the pattern for texture
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#94a3b8") // Slate-400
            .attr("stroke-width", 0.5 / transform.k)
            .attr("stroke-opacity", 0.2);
    }

    // 3. Main State Border (Distinct outline)
    g.append("path")
      .datum(geoData)
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "#334155") // Slate-700
      .attr("stroke-width", 1.5 / transform.k)
      .attr("stroke-linejoin", "round");

    // 4. Locations
    LOCATIONS.forEach(loc => {
      const [long, lat] = loc.coordinates;
      const coords = projection([long, lat]);
      
      if (!coords) return;

      const isSelected = activeLocationId === loc.id;
      
      let color = '#10b981';
      if (loc.level === DebrisLevel.MODERATE) color = '#f59e0b';
      if (loc.level === DebrisLevel.HIGH) color = '#ef4444';
      if (loc.level === DebrisLevel.CRITICAL) color = '#7f1d1d';

      const group = g.append("g")
        .attr("transform", `translate(${coords[0]}, ${coords[1]})`)
        .style("cursor", "pointer")
        .on("click", (e) => {
            e.stopPropagation();
            onLocationSelect(loc);
        });

      // Active Selection: RADAR SCAN ANIMATION
      if (isSelected) {
         // Rotating dashed outer ring (Radar)
         group.append("circle")
           .attr("r", 24 / transform.k)
           .attr("fill", "none")
           .attr("stroke", color)
           .attr("stroke-width", 1.5 / transform.k)
           .attr("stroke-dasharray", `${10/transform.k}, ${15/transform.k}`)
           .attr("opacity", 0.7)
           .append("animateTransform")
           .attr("attributeName", "transform")
           .attr("type", "rotate")
           .attr("from", "0 0 0")
           .attr("to", "360 0 0")
           .attr("dur", "4s")
           .attr("repeatCount", "indefinite");

         // Inner solid targeting ring
         group.append("circle")
           .attr("r", 14 / transform.k)
           .attr("fill", "none")
           .attr("stroke", color)
           .attr("stroke-width", 1 / transform.k);
         
         // Expanding pulse (Ping)
         group.append("circle")
           .attr("r", 6 / transform.k)
           .attr("fill", "none")
           .attr("stroke", color)
           .attr("stroke-width", 1 / transform.k)
           .attr("opacity", 0.8)
           .append("animate")
           .attr("attributeName", "r")
           .attr("values", `${6/transform.k}; ${35/transform.k}`)
           .attr("dur", "2s")
           .attr("repeatCount", "indefinite")
           .select(function() { return this.parentNode; }) // go back to animate parent
           .append("animate")
           .attr("attributeName", "opacity")
           .attr("values", "0.8; 0")
           .attr("dur", "2s")
           .attr("repeatCount", "indefinite");
      }
      // Critical Alert Pulse (Simpler)
      else if (loc.level === DebrisLevel.CRITICAL) {
         group.append("circle")
          .attr("r", 10 / transform.k)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1 / transform.k)
          .append("animate")
          .attr("attributeName", "r")
          .attr("from", 5 / transform.k)
          .attr("to", 15 / transform.k)
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");
         
         group.append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "1;0.5;1")
            .attr("dur", "2s")
            .attr("repeatCount", "indefinite");
      }

      // Main Point
      group.append("circle")
        .attr("r", (isSelected ? 5 : 4) / transform.k)
        .attr("fill", color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5 / transform.k)
        .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"); 
        
      // Technical Label
      if (isSelected) {
          // Connecting line
          group.append("line")
            .attr("x1", 16 / transform.k)
            .attr("y1", -16 / transform.k)
            .attr("x2", 40 / transform.k)
            .attr("y2", -40 / transform.k)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 1 / transform.k);
          
          // Background box for text readability
          const labelText = loc.name.toUpperCase();
          const fontSize = 12 / transform.k;
          // Approximate width (char width ~0.6em)
          const boxWidth = (labelText.length * fontSize * 0.7) + 10;
          
          group.append("rect")
            .attr("x", 45 / transform.k)
            .attr("y", (-40 / transform.k) - (fontSize/2) - 2)
            .attr("width", boxWidth)
            .attr("height", fontSize + 4)
            .attr("fill", "#1e293b") // Dark background
            .attr("rx", 2 / transform.k);

          group.append("text")
              .attr("x", 50 / transform.k)
              .attr("y", -40 / transform.k)
              .text(labelText)
              .attr("alignment-baseline", "middle")
              .attr("fill", "#ffffff") // White text
              .attr("font-family", "monospace")
              .attr("font-size", `${fontSize}px`)
              .attr("font-weight", "bold")
              .style("pointer-events", "none");
      }
    });

  }, [geoData, countyData, dimensions, activeLocationId, onLocationSelect, transform]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white">
      {/* Legend / Status Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none border border-ink-300 bg-white/90 p-3 backdrop-blur shadow-sm rounded-sm">
          <h2 className="text-ink-900 text-xs tracking-widest uppercase font-mono font-bold mb-2">Sector: California Coast</h2>
          <div className="flex flex-col space-y-1">
             <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-mono text-ink-600">LOW DENSITY</span>
             </div>
             <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 <span className="text-[10px] font-mono text-ink-600">MODERATE</span>
             </div>
             <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <span className="text-[10px] font-mono text-ink-600">HIGH IMPACT</span>
             </div>
          </div>
      </div>
      
      {/* SATELLITE HUD VIEWFINDER OVERLAY */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Corner Brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-ink-900 opacity-20"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-ink-900 opacity-20"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-ink-900 opacity-20"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-ink-900 opacity-20"></div>

          {/* Center Crosshair (Fixed) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
              <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-8 h-[1px] bg-ink-900"></div>
                  <div className="absolute h-8 w-[1px] bg-ink-900"></div>
                  <div className="w-4 h-4 border border-ink-900 rounded-full"></div>
              </div>
          </div>

          {/* Coordinate Ticks - Vertical Left */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col space-y-4 px-1 opacity-20">
              {[...Array(6)].map((_, i) => <div key={`vl-${i}`} className="w-2 h-[1px] bg-ink-900"></div>)}
          </div>
          {/* Coordinate Ticks - Horizontal Bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex space-x-8 py-1 opacity-20">
              {[...Array(6)].map((_, i) => <div key={`hb-${i}`} className="h-2 w-[1px] bg-ink-900"></div>)}
          </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 pointer-events-none text-[10px] font-mono text-ink-400 bg-white/80 p-1 rounded">
         ZOOM: {transform.k.toFixed(2)}x <br/>
         LAT: {geoData ? '36.77 N' : '--'} <br/>
         LNG: {geoData ? '119.41 W' : '--'}
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
};

export default MapViz;