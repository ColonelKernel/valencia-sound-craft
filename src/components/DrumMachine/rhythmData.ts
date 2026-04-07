export type Region =
  | "west_africa"
  | "balkans"
  | "flamenco"
  | "afro_cuban"
  | "brazil"
  | "india"
  | "middle_east"
  | "argentina";

export type InstrumentRole =
  | "pulse"
  | "timeline"
  | "bass"
  | "slap"
  | "lead"
  | "texture";

export interface Timbre {
  id: string;
  name: string;
  instrument: string;
  role: InstrumentRole;
  midiNote: number;
}

export interface RhythmPattern {
  id: string;
  name: string;
  region: Region;
  country?: string;
  meter: string;
  subdivision: number[];
  tempoRange: [number, number];
  clave?: "2-3" | "3-2" | null;
  instruments: Timbre[];
  pattern: {
    [timbreId: string]: number[];
  };
  feel: "binary" | "ternary" | "swing" | "additive";
  tags: string[];
  source?: string;
}

export const REGIONS: Region[] = [
  "west_africa",
  "balkans",
  "flamenco",
  "afro_cuban",
  "brazil",
  "india",
  "middle_east",
  "argentina",
];

export const REGION_LABELS: Record<Region, string> = {
  west_africa: "West Africa",
  balkans: "Balkans",
  flamenco: "Flamenco",
  afro_cuban: "Afro-Cuban",
  brazil: "Brazil",
  india: "India",
  middle_east: "Middle East",
  argentina: "Argentina",
};

const X = 1;
const x = 0.72;
const g = 0.42;
const _ = 0;

const WEST_AFRICA_TIMBRES: Timbre[] = [
  { id: "djembe_bass", name: "Djembe Bass", instrument: "Djembe", role: "bass", midiNote: 36 },
  { id: "djembe_slap", name: "Djembe Slap", instrument: "Djembe", role: "slap", midiNote: 39 },
  { id: "dunun_bell", name: "Dunun Bell", instrument: "Bell", role: "timeline", midiNote: 56 },
];

const BALKAN_TIMBRES: Timbre[] = [
  { id: "tupan_low", name: "Tupan Low", instrument: "Tupan", role: "bass", midiNote: 36 },
  { id: "tupan_high", name: "Tupan High", instrument: "Tupan", role: "lead", midiNote: 38 },
];

const FLAMENCO_TIMBRES: Timbre[] = [
  { id: "palmas", name: "Palmas", instrument: "Hands", role: "timeline", midiNote: 39 },
  { id: "cajon_low", name: "Cajon Low", instrument: "Cajon", role: "bass", midiNote: 36 },
  { id: "cajon_high", name: "Cajon High", instrument: "Cajon", role: "slap", midiNote: 38 },
];

const AFRO_CUBAN_TIMBRES: Timbre[] = [
  { id: "clave", name: "Clave", instrument: "Clave", role: "timeline", midiNote: 75 },
  { id: "conga-low", name: "Conga Tumba", instrument: "Conga", role: "bass", midiNote: 64 },
  { id: "conga-slap", name: "Conga Slap", instrument: "Conga", role: "slap", midiNote: 62 },
  { id: "campana", name: "Campana", instrument: "Bell", role: "pulse", midiNote: 56 },
];

const BRAZIL_TIMBRES: Timbre[] = [
  { id: "zabumba_low", name: "Zabumba Low", instrument: "Zabumba", role: "bass", midiNote: 36 },
  { id: "zabumba_high", name: "Zabumba High", instrument: "Zabumba", role: "slap", midiNote: 37 },
  { id: "triangle", name: "Triangle", instrument: "Triangle", role: "timeline", midiNote: 81 },
];

const INDIA_TIMBRES: Timbre[] = [
  { id: "tabla_bayan", name: "Tabla Bayan", instrument: "Tabla", role: "bass", midiNote: 36 },
  { id: "tabla_dayan", name: "Tabla Dayan", instrument: "Tabla", role: "lead", midiNote: 68 },
  { id: "konnakol", name: "Konnakol", instrument: "Voice", role: "timeline", midiNote: 39 },
];

const MIDDLE_EAST_TIMBRES: Timbre[] = [
  { id: "darbuka_dum", name: "Darbuka Dum", instrument: "Darbuka", role: "bass", midiNote: 36 },
  { id: "darbuka_tek", name: "Darbuka Tek", instrument: "Darbuka", role: "lead", midiNote: 42 },
  { id: "riq", name: "Riq", instrument: "Riq", role: "timeline", midiNote: 54 },
  { id: "frame_drum", name: "Frame Drum", instrument: "Frame Drum", role: "pulse", midiNote: 40 },
];

const ARGENTINA_TIMBRES: Timbre[] = [
  { id: "bombo_leguero_low", name: "Bombo Leguero Low", instrument: "Bombo Leguero", role: "bass", midiNote: 36 },
  { id: "bombo_leguero_high", name: "Bombo Leguero High", instrument: "Bombo Leguero", role: "lead", midiNote: 38 },
  { id: "bombo_leguero_rim", name: "Bombo Leguero Rim", instrument: "Bombo Leguero", role: "timeline", midiNote: 37 },
];

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: "west_africa_kuku",
    name: "Kuku",
    region: "west_africa",
    country: "Guinea",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    tempoRange: [96, 132],
    clave: null,
    instruments: WEST_AFRICA_TIMBRES,
    pattern: {
      djembe_bass: [X, _, _, g, _, _, X, _, _, g, _, _],
      djembe_slap: [_, _, X, _, X, _, _, _, X, _, X, _],
      dunun_bell: [X, _, x, _, X, _, x, _, X, _, x, _],
    },
    feel: "ternary",
    tags: ["dance", "guinea", "djembe", "intermediate"],
    source: "Guinean harvest dance rhythm",
  },
  {
    id: "west_africa_kpanlogo",
    name: "Kpanlogo",
    region: "west_africa",
    country: "Ghana",
    meter: "4/4",
    subdivision: [2, 2, 2, 2],
    tempoRange: [90, 120],
    clave: null,
    instruments: WEST_AFRICA_TIMBRES,
    pattern: {
      djembe_bass: [X, _, _, _, _, x, X, _],
      djembe_slap: [_, _, X, _, _, X, _, X],
      dunun_bell: [X, _, _, X, _, X, _, _],
    },
    feel: "swing",
    tags: ["groove", "ghana", "community", "beginner"],
    source: "Ga social groove from Accra",
  },
  {
    id: "west_africa_soli",
    name: "Soli",
    region: "west_africa",
    country: "Guinea",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    tempoRange: [118, 154],
    clave: null,
    instruments: WEST_AFRICA_TIMBRES,
    pattern: {
      djembe_bass: [X, _, _, _, X, _, _, _, X, _, _, _],
      djembe_slap: [_, X, _, _, _, X, _, X, _, _, _, X],
      dunun_bell: [X, _, x, _, X, _, X, _, x, _, X, _],
    },
    feel: "ternary",
    tags: ["celebration", "guinea", "rite", "advanced"],
    source: "Manding initiation rhythm",
  },
  {
    id: "balkans_kopanitsa",
    name: "Kopanitsa",
    region: "balkans",
    country: "Bulgaria",
    meter: "11/8",
    subdivision: [2, 2, 3, 2, 2],
    tempoRange: [100, 138],
    clave: null,
    instruments: BALKAN_TIMBRES,
    pattern: {
      tupan_low: [X, _, X, _, X, _, _, X, _, X, _],
      tupan_high: [_, X, _, X, _, X, _, _, X, _, X],
    },
    feel: "additive",
    tags: ["dance", "bulgaria", "odd-meter", "advanced"],
    source: "Bulgarian 11/8 dance groove",
  },
  {
    id: "balkans_cocek",
    name: "Cocek",
    region: "balkans",
    country: "North Macedonia",
    meter: "9/8",
    subdivision: [2, 2, 2, 3],
    tempoRange: [108, 148],
    clave: null,
    instruments: BALKAN_TIMBRES,
    pattern: {
      tupan_low: [X, _, X, _, X, _, X, _, _],
      tupan_high: [_, X, _, X, _, X, _, X, _],
    },
    feel: "additive",
    tags: ["brass", "north-macedonia", "odd-meter", "intermediate"],
    source: "Balkan brass dance pulse",
  },
  {
    id: "balkans_lesnoto",
    name: "Lesnoto",
    region: "balkans",
    country: "North Macedonia",
    meter: "7/8",
    subdivision: [3, 2, 2],
    tempoRange: [88, 124],
    clave: null,
    instruments: BALKAN_TIMBRES,
    pattern: {
      tupan_low: [X, _, _, X, _, X, _],
      tupan_high: [_, X, _, _, X, _, X],
    },
    feel: "additive",
    tags: ["dance", "north-macedonia", "odd-meter", "beginner"],
    source: "Common Balkan 7/8 dance cycle",
  },
  {
    id: "flamenco_buleria",
    name: "Buleria",
    region: "flamenco",
    country: "Spain",
    meter: "12/8",
    subdivision: [3, 3, 2, 2, 2],
    tempoRange: [150, 220],
    clave: null,
    instruments: FLAMENCO_TIMBRES,
    pattern: {
      palmas: [X, _, _, X, _, _, X, _, X, _, X, _],
      cajon_low: [X, _, _, _, _, _, X, _, _, _, _, _],
      cajon_high: [_, _, X, _, _, X, _, _, X, _, X, _],
    },
    feel: "additive",
    tags: ["jerez", "compas", "dance", "advanced"],
    source: "12-beat buleria compas",
  },
  {
    id: "flamenco_solea",
    name: "Solea",
    region: "flamenco",
    country: "Spain",
    meter: "12/8",
    subdivision: [3, 3, 2, 2, 2],
    tempoRange: [92, 128],
    clave: null,
    instruments: FLAMENCO_TIMBRES,
    pattern: {
      palmas: [X, _, _, X, _, _, X, _, X, _, X, _],
      cajon_low: [X, _, _, _, _, _, _, _, X, _, _, _],
      cajon_high: [_, _, _, X, _, _, _, _, _, X, _, _],
    },
    feel: "additive",
    tags: ["cante-jondo", "compas", "spain", "intermediate"],
    source: "Traditional solea pulse",
  },
  {
    id: "flamenco_tangos",
    name: "Tangos",
    region: "flamenco",
    country: "Spain",
    meter: "4/4",
    subdivision: [2, 2, 2, 2],
    tempoRange: [108, 144],
    clave: null,
    instruments: FLAMENCO_TIMBRES,
    pattern: {
      palmas: [X, _, X, _, X, _, X, _],
      cajon_low: [X, _, _, X, X, _, _, X],
      cajon_high: [_, X, _, X, _, X, _, X],
    },
    feel: "binary",
    tags: ["groove", "cadiz", "dance", "beginner"],
    source: "Straight-ahead tangos compas",
  },
  {
    id: "afro_cuban_son_23",
    name: "Son Clave 2-3",
    region: "afro_cuban",
    country: "Cuba",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    tempoRange: [90, 136],
    clave: "2-3",
    instruments: AFRO_CUBAN_TIMBRES,
    pattern: {
      clave: [X, _, _, X, _, _, X, _, _, _, X, _, X, _, _, _],
      "conga-low": [X, _, _, _, _, _, x, _, _, _, X, _, _, _, x, _],
      "conga-slap": [_, _, x, _, X, _, _, _, _, _, x, _, _, X, _, _],
      campana: [X, _, _, _, X, _, _, _, X, _, _, _, X, _, _, _],
    },
    feel: "swing",
    tags: ["son", "cuba", "clave", "intermediate"],
    source: "Son clave in 2-3 direction",
  },
  {
    id: "afro_cuban_son_32",
    name: "Son Clave 3-2",
    region: "afro_cuban",
    country: "Cuba",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    tempoRange: [88, 126],
    clave: "3-2",
    instruments: AFRO_CUBAN_TIMBRES,
    pattern: {
      clave: [X, _, _, X, _, _, _, X, _, _, X, _, _, X, _, _],
      "conga-low": [X, _, _, _, _, _, x, _, X, _, _, _, _, _, x, _],
      "conga-slap": [_, _, x, _, _, _, X, _, _, _, x, _, _, _, X, _],
      campana: [X, _, _, _, X, _, _, _, X, _, X, _, _, _, X, _],
    },
    feel: "swing",
    tags: ["son", "cuba", "clave", "intermediate"],
    source: "Son clave in 3-2 direction",
  },
  {
    id: "afro_cuban_guaguanco",
    name: "Guaguanco",
    region: "afro_cuban",
    country: "Cuba",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    tempoRange: [80, 108],
    clave: "3-2",
    instruments: AFRO_CUBAN_TIMBRES,
    pattern: {
      clave: [X, _, _, X, _, _, _, X, _, _, X, _, X, _, _, _],
      "conga-low": [X, _, _, _, x, _, _, _, X, _, _, _, x, _, _, _],
      "conga-slap": [_, _, _, _, _, _, _, X, _, _, _, _, _, X, _, _],
      campana: [_, _, _, _, X, _, _, X, _, _, X, _, _, X, _, _],
    },
    feel: "binary",
    tags: ["rumba", "cuba", "clave", "advanced"],
    source: "Rumba guaguanco cask-and-conga texture",
  },
  {
    id: "brazil_baiao",
    name: "Baiao",
    region: "brazil",
    country: "Brazil",
    meter: "2/4",
    subdivision: [4, 4],
    tempoRange: [108, 136],
    clave: null,
    instruments: BRAZIL_TIMBRES,
    pattern: {
      zabumba_low: [X, _, _, _, _, _, X, _],
      zabumba_high: [_, _, _, _, _, _, _, X],
      triangle: [X, _, x, X, _, x, X, _],
    },
    feel: "swing",
    tags: ["northeast", "forro", "brazil", "beginner"],
    source: "Luiz Gonzaga-style baiao",
  },
  {
    id: "brazil_xote",
    name: "Xote",
    region: "brazil",
    country: "Brazil",
    meter: "4/4",
    subdivision: [2, 2, 2, 2],
    tempoRange: [84, 110],
    clave: null,
    instruments: BRAZIL_TIMBRES,
    pattern: {
      zabumba_low: [X, _, X, _, X, _, X, _],
      zabumba_high: [_, _, X, _, _, _, X, _],
      triangle: [X, _, x, _, X, _, x, _],
    },
    feel: "binary",
    tags: ["forro", "brazil", "dance", "beginner"],
    source: "Even xote pulse with zabumba and triangle",
  },
  {
    id: "brazil_coco",
    name: "Coco",
    region: "brazil",
    country: "Brazil",
    meter: "4/4",
    subdivision: [2, 2, 2, 2],
    tempoRange: [100, 132],
    clave: null,
    instruments: BRAZIL_TIMBRES,
    pattern: {
      zabumba_low: [X, _, _, X, X, _, _, X],
      zabumba_high: [_, _, _, X, _, _, _, _],
      triangle: [X, _, x, X, _, x, X, _],
    },
    feel: "swing",
    tags: ["northeast", "brazil", "circle-dance", "intermediate"],
    source: "Northeastern coco groove",
  },
  {
    id: "india_teentaal",
    name: "Teentaal",
    region: "india",
    country: "India",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    tempoRange: [78, 118],
    clave: null,
    instruments: INDIA_TIMBRES,
    pattern: {
      tabla_bayan: [X, _, _, _, X, _, _, _, X, _, _, _, X, _, _, _],
      tabla_dayan: [_, X, _, X, _, X, _, X, _, X, _, X, _, X, _, X],
      konnakol: [X, _, X, _, X, _, X, _, X, _, X, _, X, _, X, _],
    },
    feel: "binary",
    tags: ["tala", "hindustani", "india", "intermediate"],
    source: "Sixteen-beat teentaal theka",
  },
  {
    id: "india_keharwa",
    name: "Keharwa",
    region: "india",
    country: "India",
    meter: "4/4",
    subdivision: [4, 4],
    tempoRange: [90, 130],
    clave: null,
    instruments: INDIA_TIMBRES,
    pattern: {
      tabla_bayan: [X, _, _, _, X, _, _, _],
      tabla_dayan: [_, X, _, X, _, _, X, _],
      konnakol: [X, X, _, X, X, _, X, _],
    },
    feel: "binary",
    tags: ["tala", "folk", "india", "beginner"],
    source: "Eight-beat keharwa cycle",
  },
  {
    id: "india_rupak",
    name: "Rupak",
    region: "india",
    country: "India",
    meter: "7/8",
    subdivision: [3, 2, 2],
    tempoRange: [72, 108],
    clave: null,
    instruments: INDIA_TIMBRES,
    pattern: {
      tabla_bayan: [X, _, _, X, _, X, _],
      tabla_dayan: [_, X, X, _, X, _, X],
      konnakol: [X, _, X, X, _, X, _],
    },
    feel: "additive",
    tags: ["tala", "hindustani", "india", "advanced"],
    source: "Seven-beat rupak tala",
  },
  {
    id: "middle_east_maqsum",
    name: "Maqsum",
    region: "middle_east",
    country: "Egypt",
    meter: "4/4",
    subdivision: [2, 2, 2, 2],
    tempoRange: [80, 118],
    clave: null,
    instruments: MIDDLE_EAST_TIMBRES,
    pattern: {
      darbuka_dum: [X, _, _, _, X, _, _, _],
      darbuka_tek: [_, _, X, _, _, X, _, X],
      riq: [X, _, X, _, X, _, X, _],
      frame_drum: [X, _, _, X, _, _, X, _],
    },
    feel: "binary",
    tags: ["egypt", "baladi", "groove", "beginner"],
    source: "Canonical maqsum rhythm",
  },
  {
    id: "middle_east_malfuf",
    name: "Malfuf",
    region: "middle_east",
    country: "Lebanon",
    meter: "2/4",
    subdivision: [2, 2],
    tempoRange: [102, 138],
    clave: null,
    instruments: MIDDLE_EAST_TIMBRES,
    pattern: {
      darbuka_dum: [X, _, _, X],
      darbuka_tek: [_, X, _, X],
      riq: [X, _, X, _],
      frame_drum: [X, _, _, _],
    },
    feel: "binary",
    tags: ["levant", "dance", "groove", "beginner"],
    source: "Fast entrance rhythm for Levantine music",
  },
  {
    id: "middle_east_samai",
    name: "Samai Thaqil",
    region: "middle_east",
    country: "Turkey",
    meter: "10/8",
    subdivision: [3, 2, 2, 3],
    tempoRange: [60, 88],
    clave: null,
    instruments: MIDDLE_EAST_TIMBRES,
    pattern: {
      darbuka_dum: [X, _, _, _, X, _, X, _, _, _],
      darbuka_tek: [_, _, X, _, _, X, _, _, _, X],
      riq: [X, _, X, _, X, _, X, _, X, _],
      frame_drum: [X, _, _, X, _, _, X, _, _, X],
    },
    feel: "additive",
    tags: ["classical", "turkey", "odd-meter", "advanced"],
    source: "Ottoman samai usul",
  },
  {
    id: "argentina_chacarera",
    name: "Chacarera",
    region: "argentina",
    country: "Argentina",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    tempoRange: [110, 142],
    clave: null,
    instruments: ARGENTINA_TIMBRES,
    pattern: {
      bombo_leguero_low: [X, _, _, X, _, _, X, _, _, X, _, _],
      bombo_leguero_high: [_, _, X, _, _, _, _, _, X, _, _, _],
      bombo_leguero_rim: [_, X, _, _, X, _, _, X, _, _, X, _],
    },
    feel: "ternary",
    tags: ["folk", "santiago-del-estero", "argentina", "beginner"],
    source: "Traditional chacarera pulse",
  },
  {
    id: "argentina_zamba",
    name: "Zamba",
    region: "argentina",
    country: "Argentina",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    tempoRange: [80, 110],
    clave: null,
    instruments: ARGENTINA_TIMBRES,
    pattern: {
      bombo_leguero_low: [X, _, _, _, _, X, _, _, X, _, _, _],
      bombo_leguero_high: [_, _, X, _, _, _, _, _, x, _, _, _],
      bombo_leguero_rim: [_, X, _, _, _, X, _, _, _, X, _, _],
    },
    feel: "ternary",
    tags: ["folk", "argentina", "song-form", "intermediate"],
    source: "Argentine zamba accompaniment groove",
  },
  {
    id: "argentina_malambo",
    name: "Malambo",
    region: "argentina",
    country: "Argentina",
    meter: "2/4",
    subdivision: [4, 4],
    tempoRange: [120, 160],
    clave: null,
    instruments: ARGENTINA_TIMBRES,
    pattern: {
      bombo_leguero_low: [X, _, X, _, X, _, X, _],
      bombo_leguero_high: [_, X, _, X, _, X, _, X],
      bombo_leguero_rim: [X, _, _, X, X, _, _, X],
    },
    feel: "binary",
    tags: ["dance", "argentina", "percussive", "advanced"],
    source: "Fast malambo bombo pattern",
  },
];

export function formatRegion(region: Region): string {
  return REGION_LABELS[region];
}

export function filterRhythms({
  region,
  bpm,
  tags,
}: {
  region: Region;
  bpm?: number | null;
  tags?: string[] | null;
}): RhythmPattern[] {
  return RHYTHM_PATTERNS.filter((rhythm) =>
    rhythm.region === region &&
    (!bpm || (rhythm.tempoRange[0] <= bpm && rhythm.tempoRange[1] >= bpm)) &&
    (!tags || tags.length === 0 || tags.every((tag) => rhythm.tags.includes(tag)))
  );
}
