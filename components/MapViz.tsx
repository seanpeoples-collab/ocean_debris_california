// Ocean Debris Sonification Project - MapViz.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { DebrisLocation, DebrisLevel } from '../types';
import { LOCATIONS } from '../constants';
import { ChevronUp, ChevronDown, Map as MapIcon } from 'lucide-react';

interface MapVizProps {
  activeLocationId: string | null;
  onLocationSelect: (location: DebrisLocation) => void;
  stateFips: string; // '06' = CA, '48' = TX, '15' = HI, etc.
}

// Debris Particle Definition
interface DebrisParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  type: 'plastic' | 'glass' | 'metal' | 'fishingGear' | 'other';
  path: string;
  color: string;
}

const MapViz: React.FC<MapVizProps> = ({ activeLocationId, onLocationSelect, stateFips }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [countyData, setCountyData] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  
  // Floating Debris State
  const [debrisParticles, setDebrisParticles] = useState<DebrisParticle[]>([]);

  // 1. Generate Particles when active location changes
  useEffect(() => {
    if (!activeLocationId) {
        setDebrisParticles([]);
        return;
    }

    const location = LOCATIONS.find(l => l.id === activeLocationId);
    if (!location) return;

    // Determine particle count based on density (Logarithmic scale for visual sanity)
    // 15 density -> ~5 particles
    // 1000 density -> ~40 particles
    const count = Math.max(5, Math.min(50, Math.floor(Math.log(location.density) * 6)));
    
    const newParticles: DebrisParticle[] = [];
    
    // Determine material distribution
    const materials = Object.entries(location.composition);
    
    for (let i = 0; i < count; i++) {
        // Weighted random choice for material
        let rand = Math.random() * 100;
        let selectedType = 'other';
        let cumulative = 0;
        
        for (const [mat, pct] of materials) {
            cumulative += pct;
            if (rand <= cumulative) {
                selectedType = mat;
                break;
            }
        }
        
        // Generate shape path based on type
        let path = "";
        let color = "";
        
        // Random spread around center (approx 0.05 degrees lat/long spread)
        // This is in "Geo Space" offsets, not pixels
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.04; // Spread radius
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        switch(selectedType) {
            case 'plastic':
                // Jagged polygon
                path = "M -2 -2 L 1 -3 L 3 0 L 1 3 L -3 2 Z";
                color = "#3b82f6"; // Blue-500 (Vibrant Plastic)
                break;
            case 'glass':
                // Sharp triangle/shard
                path = "M 0 -4 L 2 3 L -2 3 Z";
                color = "#059669"; // Emerald-600 (Dark Sea glass)
                break;
            case 'metal':
                // Round/Square
                path = "M -2 -2 L 2 -2 L 2 2 L -2 2 Z";
                color = "#475569"; // Slate-600 (Dark Metal)
                break;
            case 'fishingGear':
                // Curved line
                path = "M -3 0 Q 0 -3 3 0 T 3 3";
                color = "#dc2626"; // Red-600 (High vis nets)
                break;
            default:
                path = "M 0 0 L 2 2";
                color = "#7c3aed"; // Violet-600
        }

        newParticles.push({
            id: i,
            x: location.coordinates[0] + dx, // Longitude
            y: location.coordinates[1] + dy, // Latitude
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            type: selectedType as any,
            path,
            color
        });
    }
    
    setDebrisParticles(newParticles);

  }, [activeLocationId]);

  // Load US topology and filter by stateFips prop
  useEffect(() => {
    fetch('https://unpkg.com/us-atlas@3.0.0/counties-10m.json')
      .then(response => response.json())
      .then(data => {
        const states = feature(data, data.objects.states) as any;
        const counties = feature(data, data.objects.counties) as any;
        
        // Dynamic Filter based on FIPS code
        const stateFeature = states.features.find((f: any) => f.id === stateFips);
        
        const stateCounties = counties.features.filter((f: any) => {
            if (typeof f.id === 'string') return f.id.startsWith(stateFips);
            if (typeof f.id === 'number') return Math.floor(f.id / 1000) === parseInt(stateFips);
            return false;
        });

        setGeoData(stateFeature);
        setCountyData(stateCounties);
      });
  }, [stateFips]);

  // Robust Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
            setDimensions({ width, height });
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Zoom Behavior
  useEffect(() => {
    if (!svgRef.current) return;
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 100]) // Increased zoom depth significantly for better mobile interaction
      .translateExtent([[-100, -100], [dimensions.width + 100, dimensions.height + 100]]) // Allow some panning freedom
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    d3.select(svgRef.current)
      .call(zoom)
      .on("dblclick.zoom", null); // Disable double-click zoom to prevent accidental jumps

  }, [dimensions]); // Re-run when dimensions change to update translateExtent

  // Draw Map & Debris
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 
    
    // --- DEFINITIONS ---
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "land-shadow").attr("height", "130%");
    filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 3).attr("result", "blur");
    filter.append("feOffset").attr("in", "blur").attr("dx", 2).attr("dy", 3).attr("result", "offsetBlur");
    const componentTransfer = filter.append("feComponentTransfer");
    componentTransfer.append("feFuncA").attr("type", "linear").attr("slope", 0.2);
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "offsetBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const pattern = defs.append("pattern")
        .attr("id", "topo-hatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8 / transform.k)
        .attr("height", 8 / transform.k)
        .attr("patternTransform", "rotate(45)");
    
    pattern.append("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 8 / transform.k)
        .attr("stroke", "#cbd5e1").attr("stroke-width", 1 / transform.k).attr("opacity", 0.3);

    // --- DRAWING LAYERS ---
    svg.append("rect").attr("width", "100%").attr("height", "100%").attr("fill", "#f0f9ff");

    const g = svg.append("g");
    g.attr("transform", transform.toString());

    // Adjust projection based on zoom to keep things centered/stable
    // Auto-fit Logic: This will automatically center on whatever stateFips we load!
    const padding = 50;
    const projection = d3.geoMercator()
      .fitExtent([[padding, padding], [dimensions.width - padding, dimensions.height - padding]], geoData);
    const path = d3.geoPath().projection(projection);

    const graticule = d3.geoGraticule().step([1, 1]); 
    g.append("path").datum(graticule).attr("d", path as any).attr("fill", "none")
      .attr("stroke", "#bae6fd").attr("stroke-width", 0.5 / transform.k)
      .attr("stroke-dasharray", "4,4").style("pointer-events", "none");

    g.append("path").datum(geoData).attr("d", path as any).attr("fill", "#ffffff")
      .attr("stroke", "none").style("filter", "url(#land-shadow)");

    if (countyData.length > 0) {
        g.selectAll(".county").data(countyData).enter().append("path")
            .attr("d", path as any).attr("fill", "url(#topo-hatch)")
            .attr("fill-opacity", 0.5).attr("stroke", "#94a3b8")
            .attr("stroke-width", 0.5 / transform.k).attr("stroke-opacity", 0.2);
    }

    g.append("path").datum(geoData).attr("d", path as any).attr("fill", "none")
      .attr("stroke", "#334155").attr("stroke-width", 1.5 / transform.k).attr("stroke-linejoin", "round");

    // --- DEBRIS PARTICLES LAYER ---
    if (debrisParticles.length > 0) {
        const debrisGroup = g.append("g").attr("class", "debris-layer");
        
        debrisParticles.forEach(particle => {
            const coords = projection([particle.x, particle.y]);
            if (!coords) return;
            
            debrisGroup.append("path")
                .attr("d", particle.path)
                .attr("fill", particle.type === 'fishingGear' ? 'none' : particle.color)
                .attr("stroke", particle.type === 'fishingGear' ? particle.color : 'none')
                .attr("stroke-width", 1.5 / transform.k) 
                .attr("transform", `translate(${coords[0]}, ${coords[1]}) rotate(${particle.rotation}) scale(${particle.scale / Math.sqrt(transform.k)})`) 
                .attr("opacity", 0.3)
                .style("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.1))");
        });
    }

    // --- LOCATIONS ---
    LOCATIONS.forEach(loc => {
      const [long, lat] = loc.coordinates;
      const coords = projection([long, lat]);
      // If the location is outside the current projection/state view, don't draw it
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

      if (isSelected) {
         group.append("circle").attr("r", 24 / transform.k).attr("fill", "none").attr("stroke", color)
           .attr("stroke-width", 1.5 / transform.k).attr("stroke-dasharray", `${10/transform.k}, ${15/transform.k}`)
           .attr("opacity", 0.7).append("animateTransform").attr("attributeName", "transform").attr("type", "rotate")
           .attr("from", "0 0 0").attr("to", "360 0 0").attr("dur", "4s").attr("repeatCount", "indefinite");
         
         group.append("circle").attr("r", 14 / transform.k).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1 / transform.k);
         
         group.append("circle").attr("r", 6 / transform.k).attr("fill", "none").attr("stroke", color)
           .attr("stroke-width", 1 / transform.k).attr("opacity", 0.8).append("animate").attr("attributeName", "r")
           .attr("values", `${6/transform.k}; ${35/transform.k}`).attr("dur", "2s").attr("repeatCount", "indefinite")
           .select(function() { return this.parentNode as Element; }).append("animate").attr("attributeName", "opacity")
           .attr("values", "0.8; 0").attr("dur", "2s").attr("repeatCount", "indefinite");
      } else if (loc.level === DebrisLevel.CRITICAL) {
         group.append("circle").attr("r", 10 / transform.k).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1 / transform.k)
          .append("animate").attr("attributeName", "r").attr("from", 5 / transform.k).attr("to", 15 / transform.k).attr("dur", "2s").attr("repeatCount", "indefinite");
         group.append("animate").attr("attributeName", "opacity").attr("values", "1;0.5;1").attr("dur", "2s").attr("repeatCount", "indefinite");
      }

      group.append("circle").attr("r", (isSelected ? 5 : 4) / transform.k).attr("fill", color).attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5 / transform.k).style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"); 
        
      if (isSelected) {
          group.append("line").attr("x1", 16 / transform.k).attr("y1", -16 / transform.k).attr("x2", 40 / transform.k).attr("y2", -40 / transform.k)
            .attr("stroke", "#1e293b").attr("stroke-width", 1 / transform.k);
          
          const labelText = loc.name.toUpperCase();
          const fontSize = 12 / transform.k;
          const boxWidth = (labelText.length * fontSize * 0.7) + 10;
          
          group.append("rect").attr("x", 45 / transform.k).attr("y", (-40 / transform.k) - (fontSize/2) - 2)
            .attr("width", boxWidth).attr("height", fontSize + 4).attr("fill", "#1e293b").attr("rx", 2 / transform.k);

          group.append("text").attr("x", 50 / transform.k).attr("y", -40 / transform.k).text(labelText).attr("alignment-baseline", "middle")
              .attr("fill", "#ffffff").attr("font-family", "monospace").attr("font-size", `${fontSize}px`).attr("font-weight", "bold").style("pointer-events", "none");
      }
    });

  }, [geoData, countyData, dimensions, activeLocationId, onLocationSelect, transform, debrisParticles]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white touch-none">
      
      {/* Legend Container - Interactive */}
      <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
        {/* Toggle Button */}
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="pointer-events-auto flex items-center space-x-2 bg-white/90 backdrop-blur border border-ink-300 px-3 py-1.5 shadow-sm rounded-sm text-ink-900 hover:bg-ink-50 transition-colors"
        >
           <MapIcon size={12} className="text-ink-500" />
           <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
             {isLegendOpen ? 'HIDE KEY' : 'MAP KEY'}
           </span>
           {isLegendOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Collapsible Content */}
        {isLegendOpen && (
            <div className="pointer-events-auto border border-ink-300 bg-white/90 p-3 backdrop-blur shadow-sm rounded-sm max-w-[200px]">
                <h2 className="text-ink-900 text-xs tracking-widest uppercase font-mono font-bold mb-2">Sector: {stateFips === '06' ? 'CA' : stateFips === '48' ? 'TX' : stateFips === '15' ? 'HI' : 'US'} Coast</h2>
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
                
                {/* Debris Key */}
                <h2 className="text-ink-900 text-xs tracking-widest uppercase font-mono font-bold mb-2 mt-4">Particles</h2>
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 opacity-30"></div>
                        <span className="text-[10px] font-mono text-ink-600">PLASTIC</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-600 opacity-30"></div>
                        <span className="text-[10px] font-mono text-ink-600">GLASS</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-600 opacity-30"></div>
                        <span className="text-[10px] font-mono text-ink-600">METAL</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 border border-red-600 opacity-30"></div>
                        <span className="text-[10px] font-mono text-ink-600">ENTANGLEMENTS</span>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* SATELLITE HUD VIEWFINDER OVERLAY */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-ink-900 opacity-20"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-ink-900 opacity-20"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-ink-900 opacity-20"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-ink-900 opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
              <div className="relative w-8 h-8 flex items-center justify-center">
                  <div className="absolute w-8 h-[1px] bg-ink-900"></div>
                  <div className="absolute h-8 w-[1px] bg-ink-900"></div>
                  <div className="w-4 h-4 border border-ink-900 rounded-full"></div>
              </div>
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col space-y-4 px-1 opacity-20">
              {[...Array(6)].map((_, i) => <div key={`vl-${i}`} className="w-2 h-[1px] bg-ink-900"></div>)}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex space-x-8 py-1 opacity-20">
              {[...Array(6)].map((_, i) => <div key={`hb-${i}`} className="h-2 w-[1px] bg-ink-900"></div>)}
          </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 pointer-events-none text-[10px] font-mono text-ink-400 bg-white/80 p-1 rounded">
         ZOOM: {transform.k.toFixed(2)}x <br/>
         FIPS: {stateFips} <br/>
         LAT/LNG: {geoData ? 'TRACKING' : '--'}
      </div>

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
};

export default MapViz;