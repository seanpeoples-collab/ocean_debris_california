// Ocean Debris Sonification Project - NarrativeCard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NarrativeData } from '../types';
import { Activity, Leaf, Megaphone } from 'lucide-react';

interface NarrativeCardProps {
  data: NarrativeData | null;
  isLoading: boolean;
  locationName: string;
}

const NarrativeCard: React.FC<NarrativeCardProps> = ({ data, isLoading, locationName }) => {
  return (
    <div className="bg-white border border-ink-300 p-4 md:p-6 relative min-h-[180px] md:min-h-[220px] flex flex-col justify-center shadow-sm">
        <div className="absolute top-0 left-0 bg-ink-900 text-white px-2 py-1 text-[10px] font-mono tracking-widest">
            ANALYSIS // {locationName.toUpperCase()}
        </div>
        
        <AnimatePresence mode="wait">
            {isLoading ? (
                 <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col space-y-3 pt-4"
                 >
                    <div className="flex space-x-2 items-center text-ink-400">
                        <span className="w-2 h-2 bg-ink-400 animate-pulse"></span>
                        <span className="text-sm font-mono">Calibrating acoustic sensors...</span>
                    </div>
                    <div className="flex space-x-2 items-center text-ink-400">
                        <span className="w-2 h-2 bg-ink-400 animate-pulse delay-75"></span>
                        <span className="text-sm font-mono">Analyzing debris density...</span>
                    </div>
                    <div className="flex space-x-2 items-center text-ink-400">
                        <span className="w-2 h-2 bg-ink-400 animate-pulse delay-150"></span>
                        <span className="text-sm font-mono">Generating ecological report...</span>
                    </div>
                 </motion.div>
            ) : data ? (
                <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="pt-4 flex flex-col space-y-4"
                >
                    {/* Sonic Analysis */}
                    <div className="border-l-2 border-highlight pl-3">
                         <h4 className="flex items-center text-[10px] font-mono font-bold text-ink-500 uppercase mb-1">
                            <Activity size={10} className="mr-1" /> Sonic Signature
                         </h4>
                         <p className="text-sm text-ink-800 leading-snug font-sans">
                             {data.sonicAnalysis}
                         </p>
                    </div>

                    {/* Ecological Reality */}
                    <div className="border-l-2 border-debris-med pl-3">
                         <h4 className="flex items-center text-[10px] font-mono font-bold text-ink-500 uppercase mb-1">
                            <Leaf size={10} className="mr-1" /> Ecological Reality
                         </h4>
                         <p className="text-sm text-ink-800 leading-snug font-sans">
                             {data.ecologicalReality}
                         </p>
                    </div>

                    {/* Intervention (Advocacy Note) */}
                    <div className="bg-ink-100 p-2 rounded-sm border border-ink-200">
                         <h4 className="flex items-center text-[10px] font-mono font-bold text-ink-900 uppercase mb-1">
                            <Megaphone size={10} className="mr-1" /> Intervention
                         </h4>
                         <p className="text-sm text-ink-700 italic font-serif">
                             "{data.advocacyNote}"
                         </p>
                    </div>

                </motion.div>
            ) : (
                <div className="flex items-center justify-center h-full text-ink-400 text-sm font-mono">
                    AWAITING TARGET SELECTION...
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default NarrativeCard;