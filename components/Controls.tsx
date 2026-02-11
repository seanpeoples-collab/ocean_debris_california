import React from 'react';
import { Play, Square, Volume2, Locate, Sliders } from 'lucide-react';
import { DebrisLocation } from '../types';

interface ControlsProps {
    activeLocation: DebrisLocation | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    volume: number;
    onVolumeChange: (vol: number) => void;
    // New optimization props
    filterValue: number;
    onFilterChange: (val: number) => void;
    dissonanceValue: number;
    onDissonanceChange: (val: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
    activeLocation, 
    isPlaying, 
    onTogglePlay, 
    volume, 
    onVolumeChange,
    filterValue,
    onFilterChange,
    dissonanceValue,
    onDissonanceChange
}) => {
    if (!activeLocation) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-ink-400 italic">
                <Locate size={32} className="mb-3 opacity-50" />
                <p>Select target vector on map.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-ink-300 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-ink-900 font-mono tracking-tighter">{activeLocation.name}</h2>
                    <p className="text-ink-500 text-xs font-mono uppercase tracking-widest">{activeLocation.region}</p>
                </div>
                <div className={`px-3 py-1 text-xs font-bold border-2 font-mono ${
                    activeLocation.level === 'CRITICAL' ? 'border-red-700 text-red-700 bg-red-50' :
                    activeLocation.level === 'HIGH' ? 'border-red-500 text-red-500 bg-red-50' :
                    'border-emerald-600 text-emerald-600 bg-emerald-50'
                }`}>
                    STATUS: {activeLocation.level}
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm font-mono text-ink-600">
                <div className="bg-ink-100 p-3 border border-ink-300">
                    <span className="block text-ink-400 text-[10px] uppercase mb-1">Concentration</span>
                    <span className="text-lg font-bold text-ink-900">{activeLocation.density}</span> 
                    <span className="text-[10px] ml-1">items/km²</span>
                </div>
                <div className="bg-ink-100 p-3 border border-ink-300">
                    <span className="block text-ink-400 text-[10px] uppercase mb-1">Dominant Material</span>
                    <span className="text-lg font-bold text-ink-900">
                        {Object.entries(activeLocation.composition).reduce((a, b) => a[1] > b[1] ? a : b)[0].toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Main Transport */}
            <div className="flex items-center space-x-4 bg-white p-4 border-2 border-ink-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <button 
                    onClick={onTogglePlay}
                    className={`p-3 border-2 transition-all duration-100 active:translate-y-1 active:translate-x-1 active:shadow-none ${
                        isPlaying 
                        ? 'border-red-600 text-red-600 hover:bg-red-50' 
                        : 'border-ink-900 text-ink-900 hover:bg-ink-100'
                    }`}
                >
                    {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                
                <div className="flex-1 flex items-center space-x-3">
                    <Volume2 size={18} className="text-ink-400" />
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-ink-200 rounded-none appearance-none cursor-pointer accent-ink-900"
                    />
                </div>
            </div>

            {/* Optimization Tools (Signal Processing) */}
            <div className="border-t border-ink-200 pt-4 mt-2">
                <div className="flex items-center space-x-2 mb-4 text-ink-900">
                    <Sliders size={16} />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Signal Processing</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="max-w-[80%]">
                                <span className="block text-[10px] font-mono text-ink-900 uppercase font-bold">Spectral Filter</span>
                                <span className="block text-[10px] text-ink-500 leading-tight mt-0.5">
                                    Simulates underwater acoustics. Lower values absorb high frequencies, creating a submerged effect.
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-ink-900 bg-ink-100 px-1 border border-ink-200">{Math.round(filterValue * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={filterValue}
                            onChange={(e) => onFilterChange(parseFloat(e.target.value))}
                            className="w-full h-1 bg-ink-200 rounded-none appearance-none cursor-pointer accent-highlight"
                        />
                    </div>
                    
                    <div className="space-y-2">
                         <div className="flex justify-between items-start">
                            <div className="max-w-[80%]">
                                <span className="block text-[10px] font-mono text-ink-900 uppercase font-bold">Harmonic Divergence</span>
                                <span className="block text-[10px] text-ink-500 leading-tight mt-0.5">
                                    Controls audio tension. Higher values increase oscillator detuning, representing ecological stress.
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-ink-900 bg-ink-100 px-1 border border-ink-200">{dissonanceValue.toFixed(1)}x</span>
                        </div>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2.5" 
                            step="0.1" 
                            value={dissonanceValue}
                            onChange={(e) => onDissonanceChange(parseFloat(e.target.value))}
                            className="w-full h-1 bg-ink-200 rounded-none appearance-none cursor-pointer accent-highlight"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;