import React, { useState, useEffect } from 'react';
import MapViz from './components/MapViz';
import SonicVisualizer from './components/SonicVisualizer';
import NarrativeCard from './components/NarrativeCard';
import Controls from './components/Controls';
import { DebrisLocation, DebrisLevel, NarrativeData } from './types';
import { audioService } from './services/audioService';
import { generateNarrative } from './services/geminiService';
import { FileText, Waves, Radio } from 'lucide-react';

function App() {
  const [activeLocation, setActiveLocation] = useState<DebrisLocation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Optimization State
  const [filterValue, setFilterValue] = useState(1.0); // 1.0 = Fully open
  const [dissonanceValue, setDissonanceValue] = useState(1.0); // 1.0 = Default

  // Narrative State - Now structured object
  const [narrative, setNarrative] = useState<NarrativeData | null>(null);
  const [isLoadingNarrative, setIsLoadingNarrative] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize audio on first user interaction
  const handleStart = async () => {
    await audioService.initialize();
    setHasInteracted(true);
  };

  const handleLocationSelect = async (location: DebrisLocation) => {
    setActiveLocation(location);
    setIsPlaying(true);
    
    // Audio
    if (hasInteracted) {
        // Reset or keep optimization? Let's keep user preference
        audioService.setFilterFrequency(filterValue);
        audioService.setDissonance(dissonanceValue);
        audioService.playData(location);
        audioService.setVolume(volume);
    }

    // Narrative
    setIsLoadingNarrative(true);
    setNarrative(null); // Clear previous
    const data = await generateNarrative(location);
    setNarrative(data);
    setIsLoadingNarrative(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
        audioService.stopAll();
    } else if (activeLocation) {
        audioService.playData(activeLocation);
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (vol: number) => {
      setVolume(vol);
      audioService.setVolume(vol);
  };

  const handleFilterChange = (val: number) => {
      setFilterValue(val);
      audioService.setFilterFrequency(val);
  };

  const handleDissonanceChange = (val: number) => {
      setDissonanceValue(val);
      audioService.setDissonance(val);
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          audioService.stopAll();
      };
  }, []);

  if (!hasInteracted) {
      return (
          <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center relative overflow-hidden font-mono">
              <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
              
              <div className="z-10 text-center max-w-md p-10 bg-white border-2 border-ink-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex justify-center mb-6 text-ink-900">
                      <Waves size={48} strokeWidth={1.5} />
                  </div>
                  <h1 className="text-3xl font-bold text-ink-900 mb-2 tracking-tighter uppercase">
                      CA Coastal Monitor
                  </h1>
                  <div className="w-16 h-1 bg-ink-900 mx-auto mb-6"></div>
                  
                  <p className="text-ink-600 mb-8 text-sm leading-relaxed font-sans">
                      <strong className="text-ink-900">PROJECT:</strong> Sonification of coastal debris density in California.<br/>
                      <strong className="text-ink-900">METHOD:</strong> Generative audio synthesis & Gemini linguistic interpretation.<br/>
                      <strong className="text-ink-900">STATUS:</strong> Awaiting operator input.
                  </p>
                  
                  <button 
                    onClick={handleStart}
                    className="w-full py-4 bg-ink-900 text-white font-bold tracking-widest hover:bg-ink-800 transition-colors flex items-center justify-center space-x-2"
                  >
                      <span>INITIALIZE SYSTEM</span>
                      <Radio size={16} className="animate-pulse"/>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-screen w-screen bg-paper flex flex-col md:flex-row overflow-hidden text-ink-900">
      {/* Left Panel: Map */}
      <div className="flex-1 relative order-2 md:order-1 h-[50vh] md:h-full border-r border-ink-200">
         <MapViz 
            activeLocationId={activeLocation?.id || null} 
            onLocationSelect={handleLocationSelect} 
         />
         
         {/* Floating Visualizer Overlay - Reverted to compact technical size */}
         <div className="absolute bottom-6 right-6 w-80 h-40 pointer-events-none bg-white/90 border border-ink-300 backdrop-blur shadow-sm">
             <div className="absolute top-0 left-0 bg-ink-100 px-2 py-0.5 text-[8px] font-mono text-ink-500 uppercase border-b border-r border-ink-200">
                 Audio Spectrum Viz
             </div>
             <div className="w-full h-full p-2">
                 <SonicVisualizer 
                    level={activeLocation?.level || DebrisLevel.LOW} 
                    isPlaying={isPlaying} 
                 />
             </div>
         </div>
      </div>

      {/* Right Panel: Controls & Narrative */}
      <div className="w-full md:w-[450px] bg-white flex flex-col order-1 md:order-2 z-20 shadow-xl">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <header className="mb-8 flex items-center space-x-3 border-b border-ink-900 pb-4">
                  <FileText size={20} className="text-ink-900" />
                  <h1 className="text-ink-900 font-bold tracking-wider text-xs font-mono uppercase">
                      Debris Sonification Unit <span className="text-ink-400">// ver. 3.0_CA</span>
                  </h1>
              </header>

              <Controls 
                activeLocation={activeLocation}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                // New props
                filterValue={filterValue}
                onFilterChange={handleFilterChange}
                dissonanceValue={dissonanceValue}
                onDissonanceChange={handleDissonanceChange}
              />

              <div className="mt-8 pt-4">
                  <NarrativeCard 
                    data={narrative} 
                    isLoading={isLoadingNarrative}
                    locationName={activeLocation?.name || "Unknown"}
                  />
              </div>
          </div>
          
          <div className="p-3 bg-ink-100 text-center text-[10px] font-mono text-ink-500 border-t border-ink-200">
              CA COASTAL COMMISSION DATA SIMULATION // GOOGLE GEMINI BACKEND
          </div>
      </div>
    </div>
  );
}

export default App;