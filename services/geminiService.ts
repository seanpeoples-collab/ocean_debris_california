import { GoogleGenAI, Type } from "@google/genai";
import { DebrisLocation, NarrativeData, DebrisLevel } from '../types';
import { SYSTEM_PROMPT } from '../constants';

// Initialize Gemini Client
// IMPORTANT: The API key must be provided via the process.env.API_KEY variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNarrative = async (location: DebrisLocation): Promise<NarrativeData> => {
  // If no API key, return fallback immediately
  if (!process.env.API_KEY) {
    return generateFallbackNarrative(location, "System Offline: API Key Missing");
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
        temperature: 0.5, // Lower temperature for more analytical/factual output
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

    // Handle the JSON response
    const jsonText = response.text;
    if (jsonText) {
        return JSON.parse(jsonText) as NarrativeData;
    }
    
    throw new Error("Empty response");

  } catch (error: any) {
    // Determine the nature of the error for the prefix
    let statusPrefix = "Signal Interrupted";
    
    // Robust Error Detection
    const errorCode = error.status || error.response?.status || error.error?.code;
    const errorBody = JSON.stringify(error, Object.getOwnPropertyNames(error)).toLowerCase();
    const errorMessage = (error.message || '').toLowerCase();
    
    // Check for Quota Exceeded (429)
    if (
        errorCode == 429 || 
        errorBody.includes("429") || 
        errorBody.includes("quota") || 
        errorBody.includes("exhausted") ||
        errorMessage.includes("quota")
    ) {
        statusPrefix = "Offline Mode (Quota Exceeded)";
        // Warn instead of Error for expected quota limits to keep console clean
        console.warn("Gemini API Quota Exceeded. Switching to offline simulation.");
    } 
    // Check for Network/Connection issues
    else if (
        errorBody.includes("network") || 
        errorBody.includes("fetch") ||
        errorMessage.includes("network")
    ) {
        statusPrefix = "Connection Lost";
        console.warn("Gemini API Connection Lost. Switching to offline simulation.");
    } 
    // Unexpected errors
    else {
        console.error("Gemini API Error:", error);
    }

    // Return deterministic fallback data so the app remains usable
    return generateFallbackNarrative(location, statusPrefix);
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

// Deterministic fallback generator for when API is unavailable
const generateFallbackNarrative = (location: DebrisLocation, prefix: string): NarrativeData => {
  // Find dominant material
  const entries = Object.entries(location.composition);
  const dominant = entries.sort((a, b) => b[1] - a[1])[0];
  const materialName = dominant ? dominant[0] : "debris";

  let sonic = "";
  let reality = "";
  let advocacy = "";

  switch (location.level) {
    case DebrisLevel.LOW:
        sonic = "Harmonic resonance remains stable. Low-frequency oscillators indicate minimal structural interference.";
        reality = `Trace amounts of ${materialName} detected. The ecosystem currently maintains its natural rhythm.`;
        advocacy = "Preserve this balance. Even minor pollution events can disrupt the frequency.";
        break;
    case DebrisLevel.MODERATE:
        sonic = "Texture irregularities detected. Mid-range frequencies are fracturing due to increased density.";
        reality = `Significant accumulation of ${materialName} is altering the coastal profile of ${location.region}.`;
        advocacy = "The noise floor is rising. Reduce consumption to restore signal clarity.";
        break;
    case DebrisLevel.HIGH:
        sonic = "Signal saturation imminent. Heavy dissonance reflects the weight of accumulated debris.";
        reality = `Dense concentrations of ${materialName} (${location.density}/km²) are creating a physical barrier in the environment.`;
        advocacy = "Urgent action required. The soundscape is becoming uninhabitable.";
        break;
    case DebrisLevel.CRITICAL:
        sonic = "CRITICAL FAILURE. Atonal noise bursts dominate the spectrum, mirroring total overwhelm.";
        reality = `Toxic levels of ${materialName} have breached safety thresholds.`;
        advocacy = "System collapse risk high. Immediate large-scale remediation is the only solution.";
        break;
    default:
        sonic = "Data stream analysis inconclusive.";
        reality = "Unknown material composition.";
        advocacy = "Manual inspection recommended.";
  }

  return {
    sonicAnalysis: `[${prefix}] ${sonic}`,
    ecologicalReality: reality,
    advocacyNote: advocacy
  };
};