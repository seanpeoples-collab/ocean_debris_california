// Ocean Debris Sonification Project - types.ts
export enum DebrisLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface DebrisLocation {
  id: string;
  name: string;
  region: string;
  coordinates: [number, number]; // [longitude, latitude]
  density: number; // items per km2
  composition: {
    plastic: number;
    metal: number;
    glass: number;
    fishingGear: number;
    other: number;
  };
  level: DebrisLevel;
  historicalData?: {
    year: number;
    density: number;
  }[];
}

export interface NarrativeData {
  sonicAnalysis: string;
  ecologicalReality: string;
  advocacyNote: string;
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
  activeLocationId: string | null;
}