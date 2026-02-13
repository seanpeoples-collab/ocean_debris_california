// Ocean Debris Sonification Project - App.tsx
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
          <div className="h-[100dvh] w-screen bg-[#f8fafc] flex items-center justify-center relative overflow-hidden font-mono">
              <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
              
              <div className="z-10 text-center max-w-md p-6 md:p-10 bg-white border-2 border-ink-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] m-4">
                  <div className="flex justify-center mb-6 text-ink-900">
                      <Waves size={48} strokeWidth={1.5} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-ink-900 mb-2 tracking-tighter uppercase">
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
                    className="w-full py-4 bg-ink-900 text-white font-bold tracking-widest hover:bg-ink-800 transition-colors flex items-center justify-center space-x-2 active:scale-[0.98]"
                  >
                      <span>INITIALIZE SYSTEM</span>
                      <Radio size={16} className="animate-pulse"/>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-[100dvh] w-screen bg-paper flex flex-col md:flex-row overflow-hidden text-ink-900">
      {/* Panel 1: Map (Top on Mobile, Left on Desktop) */}
      <div className="relative w-full basis-[45%] md:basis-auto md:flex-1 border-b md:border-b-0 md:border-r border-ink-200 order-1">
         <MapViz 
            activeLocationId={activeLocation?.id || null} 
            onLocationSelect={handleLocationSelect} 
            stateFips="06" // 06 = California. Change this to 48 for Texas, 15 for Hawaii.
         />
         
         {/* Floating Visualizer Overlay - Compact on Mobile, Full on Desktop */}
         <div className="absolute top-3 right-3 w-28 h-12 md:top-auto md:bottom-6 md:right-6 md:w-80 md:h-40 pointer-events-none bg-white/90 border border-ink-300 backdrop-blur shadow-sm z-20 transition-all duration-300">
             <div className="hidden md:block absolute top-0 left-0 bg-ink-100 px-2 py-0.5 text-[8px] font-mono text-ink-500 uppercase border-b border-r border-ink-200">
                 Audio Spectrum Viz
             </div>
             <div className="w-full h-full p-1 md:p-2">
                 <SonicVisualizer 
                    level={activeLocation?.level || DebrisLevel.LOW} 
                    isPlaying={isPlaying} 
                 />
             </div>
         </div>
      </div>

      {/* Panel 2: Controls & Narrative (Bottom on Mobile, Right on Desktop) */}
      <div className="w-full flex-1 md:flex-none md:w-[450px] bg-white flex flex-col order-2 z-30 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] md:shadow-xl relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-8">
              <header className="mb-6 md:mb-8 flex items-center space-x-3 border-b border-ink-900 pb-3 md:pb-4 select-none">
                  <FileText size={20} className="text-ink-900" />
                  <h1 className="text-ink-900 font-bold tracking-wider text-xs font-mono uppercase truncate">
                      Debris Sonification Unit <span className="text-ink-400 hidden sm:inline">// ver. 3.0_CA</span>
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

              <div className="mt-6 md:mt-8 pt-4">
                  <NarrativeCard 
                    data={narrative} 
                    isLoading={isLoadingNarrative}
                    locationName={activeLocation?.name || "Unknown"}
                  />
              </div>
          </div>
          
          <div className="p-3 bg-ink-100 text-center text-[9px] md:text-[10px] font-mono text-ink-500 border-t border-ink-200 shrink-0 select-none flex flex-col gap-1.5">
              <span>CA COASTAL COMMISSION DATA SIMULATION // GOOGLE GEMINI BACKEND</span>
              <span className="opacity-75">
                  CONCEPT & DESIGN BY{' '}
                  <a 
                    href="https://seanpeoples.me" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-ink-900 font-bold underline decoration-ink-300 hover:decoration-ink-900 transition-all cursor-pointer pointer-events-auto"
                  >
                      SEAN PEOPLES
                  </a>
              </span>
          </div>
      </div>
    </div>
  );
}

export default App;