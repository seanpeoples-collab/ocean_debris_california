import { DebrisLocation, DebrisLevel } from './types';

export const LOCATIONS: DebrisLocation[] = [
  // North Coast
  {
    id: 'ca_nc_1',
    name: 'Pelican State Beach',
    region: 'Del Norte',
    coordinates: [-124.1950, 41.9850],
    density: 15,
    composition: { plastic: 40, metal: 0, glass: 10, fishingGear: 40, other: 10 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_nc_2',
    name: 'Glass Beach',
    region: 'Fort Bragg',
    coordinates: [-123.8134, 39.4527],
    density: 950, // Historical glass dump site
    composition: { plastic: 5, metal: 5, glass: 90, fishingGear: 0, other: 0 },
    level: DebrisLevel.CRITICAL, // Unique case: critical density but mostly glass
  },
  {
    id: 'ca_nc_3',
    name: 'Bodega Bay',
    region: 'Sonoma',
    coordinates: [-123.0481, 38.3333],
    density: 65,
    composition: { plastic: 60, metal: 5, glass: 5, fishingGear: 30, other: 0 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_nc_4',
    name: 'Point Reyes North',
    region: 'Marin County',
    coordinates: [-122.9563, 38.0025],
    density: 45,
    composition: { plastic: 50, metal: 0, glass: 0, fishingGear: 40, other: 10 },
    level: DebrisLevel.LOW,
  },

  // Bay Area / Central Coast
  {
    id: 'ca_ba_1',
    name: 'Baker Beach',
    region: 'San Francisco',
    coordinates: [-122.4764, 37.7936],
    density: 120,
    composition: { plastic: 70, metal: 5, glass: 10, fishingGear: 0, other: 15 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_ba_2',
    name: 'Ocean Beach',
    region: 'San Francisco',
    coordinates: [-122.5107, 37.7594],
    density: 180,
    composition: { plastic: 70, metal: 5, glass: 5, fishingGear: 10, other: 10 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_ba_3',
    name: 'Cowell\'s Beach',
    region: 'Santa Cruz',
    coordinates: [-122.0225, 36.9610],
    density: 210,
    composition: { plastic: 80, metal: 5, glass: 5, fishingGear: 0, other: 10 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_ba_4',
    name: 'Elkhorn Slough',
    region: 'Monterey Bay',
    coordinates: [-121.7610, 36.8123],
    density: 410,
    composition: { plastic: 90, metal: 0, glass: 0, fishingGear: 5, other: 5 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_cc_1',
    name: 'Moonstone Beach',
    region: 'Cambria',
    coordinates: [-121.1245, 35.5714],
    density: 25,
    composition: { plastic: 30, metal: 5, glass: 60, fishingGear: 5, other: 0 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_cc_2',
    name: 'Morro Bay Strand',
    region: 'San Luis Obispo',
    coordinates: [-120.8631, 35.3857],
    density: 85,
    composition: { plastic: 75, metal: 5, glass: 5, fishingGear: 10, other: 5 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_cc_3',
    name: 'Pismo Beach',
    region: 'San Luis Obispo',
    coordinates: [-120.6413, 35.1428],
    density: 150,
    composition: { plastic: 85, metal: 5, glass: 5, fishingGear: 0, other: 5 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_cc_4',
    name: 'Jalama Beach',
    region: 'Santa Barbara',
    coordinates: [-120.5042, 34.5097],
    density: 110,
    composition: { plastic: 60, metal: 0, glass: 5, fishingGear: 30, other: 5 },
    level: DebrisLevel.MODERATE,
  },

  // South Coast - LA/OC
  {
    id: 'ca_sc_1',
    name: 'Carpinteria State Beach',
    region: 'Santa Barbara',
    coordinates: [-119.5186, 34.3900],
    density: 130,
    composition: { plastic: 60, metal: 10, glass: 10, fishingGear: 5, other: 15 }, // Tar balls common here naturally, but plastic adds up
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sc_2',
    name: 'Zuma Beach',
    region: 'Malibu',
    coordinates: [-118.8247, 34.0219],
    density: 190,
    composition: { plastic: 85, metal: 5, glass: 5, fishingGear: 0, other: 5 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sc_3',
    name: 'Santa Monica Pier',
    region: 'Los Angeles',
    coordinates: [-118.4958, 34.0092],
    density: 350,
    composition: { plastic: 90, metal: 3, glass: 2, fishingGear: 0, other: 5 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_sc_4',
    name: 'Venice Breakwater',
    region: 'Los Angeles',
    coordinates: [-118.4735, 33.9850],
    density: 320,
    composition: { plastic: 80, metal: 10, glass: 5, fishingGear: 1, other: 4 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_sc_5',
    name: 'Dockweiler State Beach',
    region: 'Los Angeles',
    coordinates: [-118.4344, 33.9416],
    density: 280,
    composition: { plastic: 85, metal: 5, glass: 5, fishingGear: 0, other: 5 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_sc_6',
    name: 'Long Beach Harbor',
    region: 'Long Beach',
    coordinates: [-118.1937, 33.7701],
    density: 600, // Inside the breakwater, trash accumulates
    composition: { plastic: 90, metal: 5, glass: 0, fishingGear: 0, other: 5 },
    level: DebrisLevel.CRITICAL,
  },
  {
    id: 'ca_sc_7',
    name: 'Seal Beach',
    region: 'Orange County',
    coordinates: [-118.1047, 33.7414],
    density: 1100, // River mouth impact
    composition: { plastic: 85, metal: 2, glass: 1, fishingGear: 2, other: 10 },
    level: DebrisLevel.CRITICAL,
  },
  {
    id: 'ca_sc_8',
    name: 'Huntington State Beach',
    region: 'Orange County',
    coordinates: [-117.9988, 33.6595],
    density: 215,
    composition: { plastic: 85, metal: 10, glass: 2, fishingGear: 0, other: 3 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sc_9',
    name: 'Newport Beach',
    region: 'Orange County',
    coordinates: [-117.9298, 33.6189],
    density: 195,
    composition: { plastic: 80, metal: 5, glass: 5, fishingGear: 0, other: 10 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sc_10',
    name: 'Crystal Cove',
    region: 'Orange County',
    coordinates: [-117.8403, 33.5750],
    density: 80,
    composition: { plastic: 70, metal: 0, glass: 20, fishingGear: 5, other: 5 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_sc_11',
    name: 'Doheny State Beach',
    region: 'Dana Point',
    coordinates: [-117.6953, 33.4608],
    density: 450, // Poor water quality / trapped debris
    composition: { plastic: 85, metal: 5, glass: 5, fishingGear: 0, other: 5 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_sc_12',
    name: 'Trestles',
    region: 'San Clemente',
    coordinates: [-117.5966, 33.3853],
    density: 110,
    composition: { plastic: 70, metal: 0, glass: 0, fishingGear: 10, other: 20 },
    level: DebrisLevel.MODERATE,
  },

  // San Diego
  {
    id: 'ca_sd_1',
    name: 'Oceanside Harbor',
    region: 'San Diego',
    coordinates: [-117.3973, 33.2045],
    density: 230,
    composition: { plastic: 80, metal: 10, glass: 0, fishingGear: 10, other: 0 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sd_2',
    name: 'Torrey Pines',
    region: 'San Diego',
    coordinates: [-117.2605, 32.9214],
    density: 60,
    composition: { plastic: 60, metal: 0, glass: 0, fishingGear: 30, other: 10 },
    level: DebrisLevel.LOW,
  },
  {
    id: 'ca_sd_3',
    name: 'Mission Beach',
    region: 'San Diego',
    coordinates: [-117.2524, 32.7709],
    density: 260,
    composition: { plastic: 90, metal: 5, glass: 5, fishingGear: 0, other: 0 },
    level: DebrisLevel.HIGH,
  },
  {
    id: 'ca_sd_4',
    name: 'Coronado (Silver Strand)',
    region: 'San Diego',
    coordinates: [-117.1519, 32.6360],
    density: 140,
    composition: { plastic: 70, metal: 10, glass: 0, fishingGear: 10, other: 10 },
    level: DebrisLevel.MODERATE,
  },
  {
    id: 'ca_sd_5',
    name: 'Tijuana River Mouth',
    region: 'San Diego County',
    coordinates: [-117.1265, 32.5531],
    density: 1250,
    composition: { plastic: 60, metal: 5, glass: 5, fishingGear: 5, other: 25 }, 
    level: DebrisLevel.CRITICAL,
  }
];

export const SYSTEM_PROMPT = `
You are an Eco-Acoustic Analyst. Analyze the provided ocean debris data and musical context. Return a JSON object with three fields:
1. "sonicAnalysis": Analyze the sound texture (dissonance, rhythm) and relate it to the density/debris level. Explain what the user is hearing and why. (Max 2 sentences)
2. "ecologicalReality": Describe the physical composition (plastic, metal, etc) and its specific threat to marine life in that region. Be precise about the materials found. (Max 2 sentences)
3. "advocacyNote": A short, punchy call to awareness or action relevant to the debris type. (Max 1 sentence)

Do not use flowery, vague language like "The tide at...". Be technical, sharp, and observational.
`;
