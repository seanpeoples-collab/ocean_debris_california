// Ocean Debris Sonification Project - geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { DebrisLocation, NarrativeData, DebrisLevel } from '../types';
import { SYSTEM_PROMPT, STATIC_NARRATIVES } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Simple in-memory cache to store narratives during the session
// This prevents re-fetching data we've already generated, saving tokens.
const narrativeCache: Record<string, NarrativeData> = {};

export const generateNarrative = async (location: DebrisLocation): Promise<NarrativeData> => {
  // 1. Check Cache First
  if (narrativeCache[location.id]) {
    console.log("Serving narrative from cache:", location.name);
    return narrativeCache[location.id];
  }

  // 2. Check "Baked-in" Static Narratives
  // This satisfies the request to keep the tool standalone and token-efficient
  if (STATIC_NARRATIVES[location.id]) {
    console.log("Serving baked-in narrative:", location.name);
    narrativeCache[location.id] = STATIC_NARRATIVES[location.id];
    return STATIC_NARRATIVES[location.id];
  }

  // 3. If no API key is present, use the Enhanced Local Engine directly.
  if (!process.env.API_KEY) {
    const localData = generateLocalNarrative(location);
    narrativeCache[location.id] = localData;
    return localData;
  }

  try {
    const musicalContext = getMusicalContext(location);
    
    const prompt = `
      Target Location: ${location.name}, ${location.region}
      Data Density: ${location.density} items/km²
      Material Composition: ${JSON.stringify(location.composition)}
      Debris Level: ${location.level}
      Generated Sound Context: ${musicalContext}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.6, 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sonicAnalysis: { type: Type.STRING },
                ecologicalReality: { type: Type.STRING },
                advocacyNote: { type: Type.STRING },
            },
            required: ["sonicAnalysis", "ecologicalReality", "advocacyNote"]
        }
      }
    });

    const jsonText = response.text;
    if (jsonText) {
        const data = JSON.parse(jsonText) as NarrativeData;
        // Cache the successful result
        narrativeCache[location.id] = data;
        return data;
    }
    
    throw new Error("Empty response");

  } catch (error: any) {
    // Determine the nature of the error
    const errorCode = error.status || error.response?.status || error.error?.code;
    const errorBody = JSON.stringify(error, Object.getOwnPropertyNames(error)).toLowerCase();
    
    let isQuotaError = false;
    
    if (
        errorCode == 429 || 
        errorBody.includes("429") || 
        errorBody.includes("quota") || 
        errorBody.includes("exhausted")
    ) {
        isQuotaError = true;
        console.warn("Gemini API Quota Exceeded. Switching to local engine.");
    } else {
        console.warn("Gemini API Connection Issue. Switching to local engine.");
    }

    // Fallback to Local Engine
    const localData = generateLocalNarrative(location, isQuotaError ? "Offline Mode (Quota)" : "Signal Interrupted");
    narrativeCache[location.id] = localData; // Cache the fallback too so UI is stable
    return localData;
  }
};

const getMusicalContext = (location: DebrisLocation): string => {
  const { density } = location;
  if (density < 50) {
    return "harmonic, spacious, gentle sine waves, slow tempo, consonant intervals";
  } else if (density < 200) {
    return "textured, slight dissonance, irregular rhythm, metallic timbres introduced";
  } else if (density < 500) {
    return "dissonant, polyrhythmic, scraping textures, dense chords, feeling of weight";
  } else {
    return "chaotic, atonal, harsh noise bursts, overwhelming saturation, fast tempo, urgent";
  }
};

// --- ENHANCED LOCAL ENGINE (Standalone Mode) ---
// This generates varied, high-quality narratives without needing the API.
const generateLocalNarrative = (location: DebrisLocation, prefix: string = ""): NarrativeData => {
  
  // 1. Analyze Composition
  const entries = Object.entries(location.composition);
  const dominant = entries.sort((a, b) => b[1] - a[1])[0];
  const materialType = dominant ? dominant[0] : "general";
  
  // 2. Select Templates based on Level & Material
  let sonic = "";
  let reality = "";
  let advocacy = "";

  // Sonic Templates
  if (location.level === DebrisLevel.LOW) {
      sonic = "Harmonics are stable. The audio reflects a relatively undisturbed seabed, though faint irregularities suggest the presence of micro-pollutants.";
  } else if (location.level === DebrisLevel.MODERATE) {
      sonic = "Rhythmic fractures are audible. The soundscape is texturizing, mirroring the way debris interrupts the natural flow of the tide.";
  } else if (location.level === DebrisLevel.HIGH) {
      sonic = "High dissonance detected. The density of audio layers corresponds to the physical accumulation of refuse on the shoreline.";
  } else {
      sonic = "CRITICAL SATURATION. Atonal noise bursts dominate, representing an ecosystem overwhelmed by foreign material.";
  }

  // Ecological Templates (Context-Aware)
  if (materialType === 'plastic') {
      reality = `Polymers are the dominant signature here (${location.composition.plastic}%). These materials fracture into microplastics, entering the food chain at the microscopic level.`;
      advocacy = "Support extended producer responsibility (EPR) laws to hold manufacturers accountable.";
  } else if (materialType === 'glass') {
      reality = `Silicate fragments dominate (${location.composition.glass}%). While chemically inert, sharp edges pose immediate physical risks to local fauna.`;
      advocacy = "Coordinate with local land management to restrict illegal dumping access points.";
  } else if (materialType === 'fishingGear') {
      reality = `Ghost gear detected (${location.composition.fishingGear}%). Abandoned nets and lines continue to trap marine life long after being lost.`;
      advocacy = "Support organizations conducting deep-water net retrieval and recycling operations.";
  } else {
      reality = `Mixed debris field detected (${location.density} items/km²). The composition is varied, creating a complex hazard profile for local species.`;
      advocacy = "Volunteer with local watershed protection groups to intercept debris at the source.";
  }

  return {
    sonicAnalysis: prefix ? `[${prefix}] ${sonic}` : sonic,
    ecologicalReality: reality,
    advocacyNote: advocacy
  };
};