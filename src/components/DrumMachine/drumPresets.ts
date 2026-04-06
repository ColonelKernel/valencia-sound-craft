// Culturally accurate drum pattern presets
// Each step has velocity (0-1) where 0 = off
// Patterns encoded as 16ths unless otherwise noted

export interface StepData {
  velocity: number; // 0 = off, 0.1-1.0 = hit strength
  probability: number; // 0-1, chance of playing (1 = always)
  microtime: number; // -0.5 to 0.5 in fractions of a step (humanization)
}

export interface TrackPreset {
  instrumentId: string;
  steps: number[]; // velocity array, 0 = off
  subdivisions: number; // 8, 12, 16, 32
}

export interface PatternPreset {
  name: string;
  category: string;
  region: string;
  description: string;
  bpm: number;
  swing: number; // 0-50%
  timeSignature: [number, number]; // [beats, division]
  clavePattern?: string; // e.g. "2:3 son" 
  tracks: TrackPreset[];
  variationTracks?: TrackPreset[]; // alternate pattern (B section / fill)
}

// Helper: shorthand velocity
const X = 1.0;  // full accent
const x = 0.7;  // normal hit
const g = 0.4;  // ghost note
const _ = 0;    // rest

export const DRUM_PRESETS: PatternPreset[] = [
  // ══════════════════════════════════════════════════════════════
  // AFRO-CUBAN
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Son Clave 2:3',
    category: 'Afro-Cuban',
    region: 'Cuba',
    description: 'Classic son clave in 2:3 direction. Reference: "El Cuarto de Tula" by Buena Vista Social Club.',
    bpm: 180,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 son',
    tracks: [
      // Son clave 2:3 in 16th notes: X--X--X---X-X---
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,X,_,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,x,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,x,_,X,_,_,_,x,_,_,_,X,_,x,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [x,_,_,_,_,_,x,_,_,_,x,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Son Clave 3:2',
    category: 'Afro-Cuban',
    region: 'Cuba',
    description: 'Son clave in 3:2 direction. Reference: "Chan Chan" by Compay Segundo.',
    bpm: 130,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '3:2 son',
    tracks: [
      // Son clave 3:2: X--X--X---X-X--- reversed to X-X---X--X--X---
      // Actually: --X-X---X--X--X- (3:2 starts with 3-side)
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,X,_,_,_,x,_,_,_,X,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Rumba Clave 3:2',
    category: 'Afro-Cuban',
    region: 'Cuba',
    description: 'Rumba clave pattern. Reference: "Rumba pa los rumberos".',
    bpm: 110,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '3:2 rumba',
    tracks: [
      // Rumba clave 3:2: X--X---X--X-X---
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,_,_,X,_,_,_,x,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,_,_,_,X,_,_,_,_,_,X,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Cascara 2:3',
    category: 'Afro-Cuban',
    region: 'Cuba',
    description: 'Cascara pattern played on the side of the timbale shell, aligned to 2:3 son clave.',
    bpm: 180,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 son',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,X,_,_,_,X,_,X,_,_,_], subdivisions: 16 },
      // Cascara: X-X-X-XX-X-XX-X-
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,X,_,X,_,X,X,_,X,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,x,_,_,_,X,_,_,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Mozambique',
    category: 'Afro-Cuban',
    region: 'Cuba',
    description: 'Mozambique rhythm created by Pello el Afrokán in 1960s Havana.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 rumba',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,X,_,_,X,_,_,X,_,X,_,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,X,_,_,_,x,_,X,_,_,_], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // PUERTO RICO
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Bomba Sicá',
    category: 'Puerto Rican',
    region: 'Puerto Rico',
    description: 'Bomba Sicá: the most common bomba rhythm, characterized by a 2-feel pattern.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      // Buleador (steady pattern)
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,X,_,_,_,x,_,X,_,_,_], subdivisions: 16 },
      // Subidor/Primo (improvising drum, simplified)
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,_,x,_,_,x,_,_,_,_,x], subdivisions: 16 },
      // Cuá (sticks on wood)
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,_,X,_,X,_,X,_,X,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Bomba Holandé',
    category: 'Puerto Rican',
    region: 'Puerto Rico',
    description: 'Bomba Holandé: a slower, more stately bomba rhythm in 6/8 feel.',
    bpm: 95,
    swing: 0,
    timeSignature: [6, 8],
    tracks: [
      { instrumentId: 'conga-low', steps: [X,_,_,x,_,_,X,_,_,x,_,_], subdivisions: 12 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,x,_,_,x,_,_,x], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,_,X,_,X,_], subdivisions: 12 },
    ],
  },
  {
    name: 'Plena',
    category: 'Puerto Rican',
    region: 'Puerto Rico',
    description: 'Plena rhythm using panderetas (hand drums). "El periódico de los pobres."',
    bpm: 130,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      // Seguidor (lowest pandereta)
      { instrumentId: 'conga-low', steps: [X,_,X,_,X,_,X,_], subdivisions: 8 },
      // Punteador (mid pandereta)
      { instrumentId: 'conga-high', steps: [_,_,X,_,_,_,X,_], subdivisions: 8 },
      // Requinto (highest, improvising)
      { instrumentId: 'bongo', steps: [x,_,_,X,_,x,_,X], subdivisions: 8 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // PERU
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Festejo',
    category: 'Peruvian',
    region: 'Peru',
    description: 'Festejo: Afro-Peruvian dance rhythm with cajón as primary instrument.',
    bpm: 140,
    swing: 10,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'cajon', steps: [X,_,_,g,_,_,X,_,_,g,_,_,X,_,_,g], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [x,_,_,x,_,_,x,_,_,x,_,_,x,_,_,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Landó',
    category: 'Peruvian',
    region: 'Peru',
    description: 'Landó: slow, sensual Afro-Peruvian rhythm. Distinctive syncopated cajón pattern.',
    bpm: 90,
    swing: 5,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'cajon', steps: [X,_,_,_,_,_,g,_,_,_,X,_,_,g,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,x,_,_,_,_,x,_,_,_,_,x,_,_,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // BRAZIL
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Samba (Partido Alto)',
    category: 'Brazilian',
    region: 'Brazil',
    description: 'Partido alto samba pattern with teleco-teco rhythm on the tamborim.',
    bpm: 110,
    swing: 0,
    timeSignature: [2, 4],
    tracks: [
      { instrumentId: 'surdo', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [X,_,x,_,_,x,X,_,x,_,_,x,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'agogo', steps: [X,_,_,X,_,_,X,_,X,_,_,X,_,_,X,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Samba (Batucada)',
    category: 'Brazilian',
    region: 'Brazil',
    description: 'Full batucada ensemble pattern for samba school percussion.',
    bpm: 130,
    swing: 0,
    timeSignature: [2, 4],
    tracks: [
      { instrumentId: 'surdo', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'repique', steps: [x,x,X,_,x,x,X,_,x,x,X,_,x,x,X,_], subdivisions: 16 },
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,X,_,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'agogo', steps: [X,_,X,_,_,X,_,X,X,_,X,_,_,X,_,X], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Bossa Nova',
    category: 'Brazilian',
    region: 'Brazil',
    description: 'Authentic bossa nova pattern. Reference: João Gilberto rhythmic approach.',
    bpm: 135,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,x,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,x,_,_,_,_,_,_,x,_,_,x,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // URUGUAY
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Candombe',
    category: 'Uruguayan',
    region: 'Uruguay',
    description: 'Candombe: three-drum interplay of piano (low), chico (high), and repique (mid).',
    bpm: 110,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      // Piano drum (lowest, steady pulse)
      { instrumentId: 'surdo', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      // Chico drum (highest, constant rhythm)
      { instrumentId: 'bongo', steps: [X,_,X,X,_,X,X,_,X,X,_,X,X,_,X,X], subdivisions: 16 },
      // Repique (mid, call-and-response/improvisation)
      { instrumentId: 'repique', steps: [_,_,_,X,_,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // ARGENTINA
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Chacarera',
    category: 'Argentine',
    region: 'Argentina',
    description: 'Chacarera: folk dance in 6/8. Reference: "Chacarera del Patio".',
    bpm: 130,
    swing: 0,
    timeSignature: [6, 8],
    tracks: [
      // Bombo legüero pattern
      { instrumentId: 'kick', steps: [X,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [_,_,X,_,_,X,_,_,X,_,_,X], subdivisions: 12 },
      // Aro (rim of bombo)
      { instrumentId: 'hh-closed', steps: [x,_,x,x,_,x,x,_,x,x,_,x], subdivisions: 12 },
    ],
  },
  {
    name: 'Zamba',
    category: 'Argentine',
    region: 'Argentina',
    description: 'Zamba: slow, elegant 6/8 dance. Reference: "Zamba por vos".',
    bpm: 90,
    swing: 0,
    timeSignature: [6, 8],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,X,_,_,X,_,_,_], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [_,_,x,_,_,_,_,_,x,_,_,_], subdivisions: 12 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 12 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // SPAIN / FLAMENCO
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Bulerías',
    category: 'Flamenco',
    region: 'Spain',
    description: 'Bulerías: 12-beat flamenco cycle with accents on 3, 6, 8, 10, 12.',
    bpm: 210,
    swing: 0,
    timeSignature: [12, 8],
    tracks: [
      // Palmas (handclaps) on accented beats: 12-beat cycle
      // Beats: 1  2  3  4  5  6  7  8  9  10 11 12
      { instrumentId: 'clap', steps: [_,_,X,_,_,X,_,X,_,X,_,X], subdivisions: 12 },
      { instrumentId: 'cajon', steps: [g,_,X,_,g,X,_,X,g,X,_,X], subdivisions: 12 },
      { instrumentId: 'kick', steps: [_,_,X,_,_,_,_,X,_,_,_,X], subdivisions: 12 },
    ],
  },
  {
    name: 'Soleá',
    category: 'Flamenco',
    region: 'Spain',
    description: 'Soleá: foundational 12-beat flamenco compás. Slower and more solemn than bulerías.',
    bpm: 120,
    swing: 0,
    timeSignature: [12, 8],
    tracks: [
      // Accents: 3, 6, 8, 10, 12
      { instrumentId: 'clap', steps: [_,_,X,_,_,X,_,X,_,X,_,X], subdivisions: 12 },
      { instrumentId: 'cajon', steps: [g,_,X,_,_,X,g,X,_,X,_,X], subdivisions: 12 },
    ],
  },
  {
    name: 'Tangos (Flamenco)',
    category: 'Flamenco',
    region: 'Spain',
    description: 'Flamenco tangos: 4/4 compás with strong backbeat.',
    bpm: 150,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'clap', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'cajon', steps: [X,_,_,g,X,_,_,g,X,_,_,g,X,_,_,g], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // WEST AFRICA
  // ══════════════════════════════════════════════════════════════
  {
    name: 'West African 12/8',
    category: 'West African',
    region: 'West Africa',
    description: 'Standard West African 12/8 cross-rhythm with bell pattern (Agbadza-type).',
    bpm: 110,
    swing: 0,
    timeSignature: [12, 8],
    tracks: [
      // Standard bell: X-X-XX-X-X-X
      { instrumentId: 'cowbell', steps: [X,_,X,_,X,X,_,X,_,X,_,X], subdivisions: 12 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_], subdivisions: 12 },
      { instrumentId: 'conga-low', steps: [X,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 12 },
      { instrumentId: 'conga-high', steps: [_,_,X,_,_,X,_,_,X,_,_,X], subdivisions: 12 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 12 },
    ],
  },
  {
    name: 'Highlife',
    category: 'West African',
    region: 'Ghana / Nigeria',
    description: 'Highlife groove: Ghanaian/Nigerian popular music rhythm.',
    bpm: 120,
    swing: 10,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,_,X,_,X,_,_,X,_,_,X,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,x,_,_,x,_,_,_,_,x,_,_,x,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Afrobeat',
    category: 'West African',
    region: 'Nigeria',
    description: 'Fela Kuti-style Afrobeat drum pattern with Tony Allen-inspired hi-hat work.',
    bpm: 115,
    swing: 5,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,x,_,x,x,_,x,_,x,x,_,x,x,_], subdivisions: 16 },
      { instrumentId: 'hh-open', steps: [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,x], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // STANDARD / CONTEMPORARY
  // ══════════════════════════════════════════════════════════════
  {
    name: 'Basic Rock',
    category: 'Standard',
    region: 'Universal',
    description: 'Standard rock beat: kick on 1 and 3, snare on 2 and 4.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Funk',
    category: 'Standard',
    region: 'Universal',
    description: 'Classic funk groove with syncopated kick and ghost notes on snare.',
    bpm: 100,
    swing: 15,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,g,_,_,_,_,X,_,_,g], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'hh-open', steps: [_,_,_,_,_,_,_,_,_,_,_,_,_,x,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Hip Hop',
    category: 'Standard',
    region: 'Universal',
    description: 'Boom-bap style hip hop with heavy swing.',
    bpm: 90,
    swing: 25,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: '808-kick', steps: [X,_,_,_,_,_,_,x,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: '808-snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'hh-open', steps: [_,_,_,_,_,_,_,_,_,_,_,_,_,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Reggaeton',
    category: 'Standard',
    region: 'Caribbean',
    description: 'Dembow riddim: the backbone of reggaeton.',
    bpm: 95,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,_,_,_,X,_,_,X,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,x,_,_,x,_,_,_,_,x,_,_,x,_], subdivisions: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // POLYRHYTHMS
  // ══════════════════════════════════════════════════════════════
  {
    name: '3 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    region: 'Universal',
    description: 'Foundational cross-rhythm: 3 beats against 4.',
    bpm: 100,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 12 },
      { instrumentId: 'cowbell', steps: [X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 12 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 12 },
    ],
  },
  {
    name: '5 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    region: 'Universal',
    description: 'Advanced cross-rhythm: 5 evenly spaced beats against 4.',
    bpm: 90,
    swing: 0,
    timeSignature: [4, 4],
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 20 },
      { instrumentId: 'clave', steps: [X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 20 },
    ],
  },
];

// Group presets by region
export function getPresetsByRegion(): Record<string, PatternPreset[]> {
  const map: Record<string, PatternPreset[]> = {};
  DRUM_PRESETS.forEach(p => {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  });
  return map;
}
