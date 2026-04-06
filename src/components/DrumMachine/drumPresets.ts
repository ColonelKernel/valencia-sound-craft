// Global Rhythm Data Model + Culturally Accurate Presets
// Each rhythm is defined by pulse GROUPINGS (2+3, 3+2+2), not just time signatures

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StepData {
  velocity: number;
  probability: number;
  microtime: number;
}

export interface TrackPreset {
  instrumentId: string;
  steps: number[];
  subdivisions: number;
}

export type TimeFeel = 'straight' | 'swing' | 'compound' | 'asymmetric' | 'polyrhythmic';
export type Complexity = 'beginner' | 'intermediate' | 'advanced';

export interface PatternPreset {
  name: string;
  category: string;
  region: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  description: string;
  bpm: number;
  swing: number;
  timeSignature: [number, number];
  clavePattern?: string;
  tracks: TrackPreset[];
  variationTracks?: TrackPreset[];
  // Extended metadata
  timeFeel: TimeFeel;
  pulseGrouping: number[];
  tempoRange: [number, number];
  instrumentRoles?: {
    timeline?: string;
    groove?: string;
    bass?: string;
  };
  culturalDescription?: string;
  artists?: string[];
  complexity: Complexity;
  subdivisionType?: string;
  regional?: boolean; // inherited from broader region
}

// ─── Velocity shorthands ────────────────────────────────────────────────────
const X = 1.0;
const x = 0.7;
const g = 0.4;
const _ = 0;

// ─── PRESETS ────────────────────────────────────────────────────────────────

export const DRUM_PRESETS: PatternPreset[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRO-CUBAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Son Clave 2:3',
    category: 'Afro-Cuban',
    region: 'Caribbean',
    country: 'Cuba',
    countryCode: 'CU',
    description: 'Classic son clave in 2:3 direction. Reference: "El Cuarto de Tula" by Buena Vista Social Club.',
    bpm: 180,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 son',
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 4, 2, 4],
    tempoRange: [120, 200],
    instrumentRoles: { timeline: 'Clave', groove: 'Congas', bass: 'Kick' },
    artists: ['Buena Vista Social Club', 'Chucho Valdés'],
    complexity: 'intermediate',
    subdivisionType: '16th notes',
    tracks: [
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
    region: 'Caribbean',
    country: 'Cuba',
    countryCode: 'CU',
    description: 'Son clave in 3:2 direction. Reference: "Chan Chan" by Compay Segundo.',
    bpm: 130,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '3:2 son',
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 4, 2, 4],
    tempoRange: [100, 160],
    instrumentRoles: { timeline: 'Clave', groove: 'Congas', bass: 'Kick' },
    artists: ['Compay Segundo', 'Ibrahim Ferrer'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,X,_,_,_,x,_,_,_,X,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Rumba Clave 3:2',
    category: 'Afro-Cuban',
    region: 'Caribbean',
    country: 'Cuba',
    countryCode: 'CU',
    description: 'Rumba clave pattern. The delayed third stroke distinguishes it from son clave.',
    bpm: 110,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '3:2 rumba',
    timeFeel: 'straight',
    pulseGrouping: [3, 4, 3, 2, 4],
    tempoRange: [80, 130],
    instrumentRoles: { timeline: 'Clave', groove: 'Congas/Quinto' },
    artists: ['Los Muñequitos de Matanzas', 'Yoruba Andabo'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,_,_,X,_,_,_,x,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,_,_,_,X,_,_,_,_,_,X,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Cascara 2:3',
    category: 'Afro-Cuban',
    region: 'Caribbean',
    country: 'Cuba',
    countryCode: 'CU',
    description: 'Cascara on the timbale shell, aligned to 2:3 son clave.',
    bpm: 180,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 son',
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 1, 2, 2, 1, 2, 2],
    tempoRange: [140, 210],
    instrumentRoles: { timeline: 'Clave', groove: 'Cascara/Rimshot', bass: 'Kick' },
    artists: ['Tito Puente'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,X,_,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,X,_,X,_,X,X,_,X,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,x,_,_,_,X,_,_,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Mozambique',
    category: 'Afro-Cuban',
    region: 'Caribbean',
    country: 'Cuba',
    countryCode: 'CU',
    description: 'Created by Pello el Afrokán in 1960s Havana. A fusion of African and Cuban elements.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    clavePattern: '2:3 rumba',
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [100, 140],
    instrumentRoles: { timeline: 'Cowbell', groove: 'Congas', bass: 'Kick' },
    artists: ['Pello el Afrokán'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,_,X,_,_,X,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,X,_,_,X,_,_,X,_,X,_,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,X,_,_,_,x,_,X,_,_,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PUERTO RICO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Bomba Sicá',
    category: 'Puerto Rican',
    region: 'Caribbean',
    country: 'Puerto Rico',
    countryCode: 'PR',
    description: 'The most common bomba rhythm. Buleador provides steady pulse while subidor improvises.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [100, 150],
    instrumentRoles: { timeline: 'Cuá (sticks)', groove: 'Buleador/Subidor', bass: 'Buleador' },
    artists: ['Familia Cepeda', 'Los Pleneros de la 21'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'conga-low', steps: [X,_,_,_,x,_,X,_,_,_,x,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,_,x,_,_,x,_,_,_,_,x], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,_,X,_,X,_,X,_,X,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Bomba Holandé',
    category: 'Puerto Rican',
    region: 'Caribbean',
    country: 'Puerto Rico',
    countryCode: 'PR',
    description: 'A slower, stately bomba in 6/8 feel. Dutch-influenced rhythm from colonial era.',
    bpm: 95,
    swing: 0,
    timeSignature: [6, 8],
    timeFeel: 'compound',
    pulseGrouping: [3, 3],
    tempoRange: [80, 110],
    instrumentRoles: { timeline: 'Cuá', groove: 'Buleador' },
    artists: ['Modesto Cepeda'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'conga-low', steps: [X,_,_,x,_,_,X,_,_,x,_,_], subdivisions: 12 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,x,_,_,x,_,_,x], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [X,_,X,_,X,_,X,_,X,_,X,_], subdivisions: 12 },
    ],
  },
  {
    name: 'Plena',
    category: 'Puerto Rican',
    region: 'Caribbean',
    country: 'Puerto Rico',
    countryCode: 'PR',
    description: 'Three panderetas interlock. Known as "the newspaper of the poor."',
    bpm: 130,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [110, 160],
    instrumentRoles: { timeline: 'Seguidor', groove: 'Punteador/Requinto' },
    artists: ['Plena Libre', 'Mon Rivera'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'conga-low', steps: [X,_,X,_,X,_,X,_], subdivisions: 8 },
      { instrumentId: 'conga-high', steps: [_,_,X,_,_,_,X,_], subdivisions: 8 },
      { instrumentId: 'bongo', steps: [x,_,_,X,_,x,_,X], subdivisions: 8 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERU
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Festejo',
    category: 'Peruvian',
    region: 'Latin America',
    country: 'Peru',
    countryCode: 'PE',
    description: 'Afro-Peruvian dance rhythm. The cajón was born here.',
    bpm: 140,
    swing: 10,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [120, 160],
    instrumentRoles: { timeline: 'Quijada/Cowbell', groove: 'Cajón', bass: 'Cajón bass tone' },
    artists: ['Susana Baca', 'Eva Ayllón', 'Perú Negro'],
    complexity: 'intermediate',
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
    region: 'Latin America',
    country: 'Peru',
    countryCode: 'PE',
    description: 'Slow, sensual Afro-Peruvian rhythm with distinctive syncopated cajón.',
    bpm: 90,
    swing: 5,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [70, 100],
    instrumentRoles: { groove: 'Cajón', bass: 'Cajón bass' },
    artists: ['Chabuca Granda', 'Susana Baca'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'cajon', steps: [X,_,_,_,_,_,g,_,_,_,X,_,_,g,_,_], subdivisions: 16 },
      { instrumentId: 'conga-low', steps: [_,_,x,_,_,_,_,x,_,_,_,_,x,_,_,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Marinera',
    category: 'Peruvian',
    region: 'Latin America',
    country: 'Peru',
    countryCode: 'PE',
    description: 'Elegant Peruvian courtship dance. National dance of Peru with criolla and norteña variants.',
    bpm: 130,
    swing: 0,
    timeSignature: [6, 8],
    timeFeel: 'compound',
    pulseGrouping: [3, 3],
    tempoRange: [110, 150],
    instrumentRoles: { timeline: 'Palmas', groove: 'Cajón', bass: 'Cajón bass tone' },
    artists: ['Chabuca Granda', 'Eva Ayllón', 'Arturo "Zambo" Cavero'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'cajon', steps: [X,_,_,x,_,_,X,_,_,x,_,_], subdivisions: 12 },
      { instrumentId: 'clap', steps: [X,_,_,_,_,X,X,_,_,_,_,X], subdivisions: 12 },
      { instrumentId: 'shaker', steps: [x,_,x,x,_,x,x,_,x,x,_,x], subdivisions: 12 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,_,_,X,_,_,_,_,_], subdivisions: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAZIL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Samba (Partido Alto)',
    category: 'Brazilian',
    region: 'Latin America',
    country: 'Brazil',
    countryCode: 'BR',
    description: 'Partido alto with teleco-teco tamborim pattern.',
    bpm: 110,
    swing: 0,
    timeSignature: [2, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [90, 130],
    instrumentRoles: { timeline: 'Tamborim', groove: 'Surdo', bass: 'Surdo' },
    artists: ['Martinho da Vila', 'Beth Carvalho'],
    complexity: 'intermediate',
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
    region: 'Latin America',
    country: 'Brazil',
    countryCode: 'BR',
    description: 'Full batucada ensemble for samba school percussion.',
    bpm: 130,
    swing: 0,
    timeSignature: [2, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [110, 160],
    instrumentRoles: { timeline: 'Agogô/Repique', groove: 'Caixa/Tamborim', bass: 'Surdo' },
    artists: ['Olodum', 'Mangueira'],
    complexity: 'advanced',
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
    region: 'Latin America',
    country: 'Brazil',
    countryCode: 'BR',
    description: 'João Gilberto\'s rhythmic revolution. Intimate and syncopated.',
    bpm: 135,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [110, 150],
    instrumentRoles: { groove: 'Brushes/Rim', bass: 'Kick' },
    artists: ['João Gilberto', 'Tom Jobim', 'Stan Getz'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,x,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,x,_,_,_,_,_,_,x,_,_,x,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g], subdivisions: 16 },
    ],
  },
  {
    name: 'Baião',
    category: 'Brazilian',
    region: 'Latin America',
    country: 'Brazil',
    countryCode: 'BR',
    description: 'Northeastern Brazilian rhythm popularized by Luiz Gonzaga. Zabumba and triangle drive.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [100, 140],
    instrumentRoles: { timeline: 'Triangle', groove: 'Zabumba', bass: 'Zabumba bass' },
    artists: ['Luiz Gonzaga', 'Dominguinhos'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,_,_,_,_,X,_,_,_,_,_,_,_,X], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,x,X,_,x,X,_,x,X,_,x,X,_,x,X], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // URUGUAY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Candombe',
    category: 'Uruguayan',
    region: 'Latin America',
    country: 'Uruguay',
    countryCode: 'UY',
    description: 'Three-drum interplay of piano (low), chico (high), and repique (mid). UNESCO heritage.',
    bpm: 110,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [90, 130],
    instrumentRoles: { timeline: 'Chico', groove: 'Repique', bass: 'Piano drum' },
    artists: ['Ruben Rada', 'Hugo Fattoruso'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'surdo', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'bongo', steps: [X,_,X,X,_,X,X,_,X,X,_,X,X,_,X,X], subdivisions: 16 },
      { instrumentId: 'repique', steps: [_,_,_,X,_,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ARGENTINA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Chacarera',
    category: 'Argentine',
    region: 'Latin America',
    country: 'Argentina',
    countryCode: 'AR',
    description: 'Folk dance in 6/8 with bombo legüero. 3+3 grouping over 2 pulses.',
    bpm: 130,
    swing: 0,
    timeSignature: [6, 8],
    timeFeel: 'compound',
    pulseGrouping: [3, 3],
    tempoRange: [110, 150],
    instrumentRoles: { groove: 'Bombo legüero', bass: 'Bombo bass' },
    artists: ['Los Chalchaleros', 'Peteco Carabajal'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,_,X,_,_,X,_,_], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [_,_,X,_,_,X,_,_,X,_,_,X], subdivisions: 12 },
      { instrumentId: 'hh-closed', steps: [x,_,x,x,_,x,x,_,x,x,_,x], subdivisions: 12 },
    ],
  },
  {
    name: 'Zamba',
    category: 'Argentine',
    region: 'Latin America',
    country: 'Argentina',
    countryCode: 'AR',
    description: 'Slow, elegant 6/8 dance. Not to be confused with Brazilian samba.',
    bpm: 90,
    swing: 0,
    timeSignature: [6, 8],
    timeFeel: 'compound',
    pulseGrouping: [3, 3],
    tempoRange: [70, 100],
    instrumentRoles: { groove: 'Bombo legüero' },
    artists: ['Mercedes Sosa', 'Divididos'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,X,_,_,X,_,_,_], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [_,_,x,_,_,_,_,_,x,_,_,_], subdivisions: 12 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLOMBIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Cumbia',
    category: 'Colombian',
    region: 'Latin America',
    country: 'Colombia',
    countryCode: 'CO',
    description: 'National rhythm of Colombia. Alegre and llamador drums interlock over gaita melody.',
    bpm: 95,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [80, 110],
    instrumentRoles: { timeline: 'Guacharaca', groove: 'Alegre drum', bass: 'Llamador' },
    artists: ['Totó la Momposina', 'Lucho Bermúdez', 'Bomba Estéreo'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'conga-low', steps: [X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [X,_,x,_,X,_,x,_,X,_,x,_,X,_,x,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPAIN / FLAMENCO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Bulerías',
    category: 'Flamenco',
    region: 'Europe',
    country: 'Spain',
    countryCode: 'ES',
    description: '12-beat flamenco compás with accents on 3, 6, 8, 10, 12. Fastest flamenco form.',
    bpm: 210,
    swing: 0,
    timeSignature: [12, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [3, 3, 2, 2, 2],
    tempoRange: [180, 280],
    instrumentRoles: { timeline: 'Palmas (handclaps)', groove: 'Cajón/Feet' },
    artists: ['Paco de Lucía', 'Camarón de la Isla', 'Tomatito'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'clap', steps: [_,_,X,_,_,X,_,X,_,X,_,X], subdivisions: 12 },
      { instrumentId: 'cajon', steps: [g,_,X,_,g,X,_,X,g,X,_,X], subdivisions: 12 },
      { instrumentId: 'kick', steps: [_,_,X,_,_,_,_,X,_,_,_,X], subdivisions: 12 },
    ],
  },
  {
    name: 'Soleá',
    category: 'Flamenco',
    region: 'Europe',
    country: 'Spain',
    countryCode: 'ES',
    description: 'Foundational 12-beat flamenco compás. "Mother of flamenco" styles.',
    bpm: 120,
    swing: 0,
    timeSignature: [12, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [3, 3, 2, 2, 2],
    tempoRange: [90, 140],
    instrumentRoles: { timeline: 'Palmas', groove: 'Cajón' },
    artists: ['Paco de Lucía', 'La Niña de los Peines'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'clap', steps: [_,_,X,_,_,X,_,X,_,X,_,X], subdivisions: 12 },
      { instrumentId: 'cajon', steps: [g,_,X,_,_,X,g,X,_,X,_,X], subdivisions: 12 },
    ],
  },
  {
    name: 'Tangos (Flamenco)',
    category: 'Flamenco',
    region: 'Europe',
    country: 'Spain',
    countryCode: 'ES',
    description: 'Flamenco tangos: 4/4 with strong backbeat. Not Argentine tango.',
    bpm: 150,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [120, 170],
    instrumentRoles: { timeline: 'Palmas', groove: 'Cajón' },
    artists: ['Camarón de la Isla'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'clap', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'cajon', steps: [X,_,_,g,X,_,_,g,X,_,_,g,X,_,_,g], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WEST AFRICA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Agbadza Bell Pattern',
    category: 'West African',
    region: 'Africa',
    country: 'Ghana',
    countryCode: 'GH',
    description: 'Standard West African 12/8 cross-rhythm bell pattern (Agbadza/Ewe).',
    bpm: 110,
    swing: 0,
    timeSignature: [12, 8],
    timeFeel: 'compound',
    pulseGrouping: [2, 2, 1, 2, 2, 2, 1],
    tempoRange: [90, 130],
    instrumentRoles: { timeline: 'Gankogui (bell)', groove: 'Kaganu/Kidi', bass: 'Atsimevu' },
    artists: ['Mustapha Tettey Addy', 'Ewe drum ensembles'],
    complexity: 'advanced',
    tracks: [
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
    region: 'Africa',
    country: 'Ghana',
    countryCode: 'GH',
    description: 'Ghanaian popular music groove, blending traditional and Western elements.',
    bpm: 120,
    swing: 10,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [100, 140],
    instrumentRoles: { timeline: 'Bell', groove: 'Guitar/Drums', bass: 'Bass guitar' },
    artists: ['E.T. Mensah', 'Ebo Taylor', 'Pat Thomas'],
    complexity: 'beginner',
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
    region: 'Africa',
    country: 'Nigeria',
    countryCode: 'NG',
    description: 'Fela Kuti-style Afrobeat with Tony Allen-inspired hi-hat work.',
    bpm: 115,
    swing: 5,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [100, 130],
    instrumentRoles: { timeline: 'Shekere', groove: 'Drums (Tony Allen style)', bass: 'Kick' },
    artists: ['Fela Kuti', 'Tony Allen', 'Antibalas'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,x,_,x,x,_,x,_,x,x,_,x,x,_], subdivisions: 16 },
      { instrumentId: 'hh-open', steps: [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,x], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Mbalax',
    category: 'West African',
    region: 'Africa',
    country: 'Senegal',
    countryCode: 'SN',
    description: 'Senegalese popular music driven by sabar drums. Complex polyrhythmic interplay.',
    bpm: 130,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'polyrhythmic',
    pulseGrouping: [3, 3, 2, 3, 3, 2],
    tempoRange: [110, 150],
    instrumentRoles: { timeline: 'Sabar lead', groove: 'Tama (talking drum)', bass: 'Kick' },
    artists: ['Youssou N\'Dour', 'Baaba Maal', 'Orchestra Baobab'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'conga-slap', steps: [X,_,_,X,_,_,_,X,_,X,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,x,_,_,x,_,_,x,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Djembe Ensemble',
    category: 'West African',
    region: 'Africa',
    country: 'Guinea',
    countryCode: 'GN',
    description: 'Mandinka djembe ensemble with dundun bass and bell. Foundation of West African drumming.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'compound',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [100, 160],
    instrumentRoles: { timeline: 'Bell', groove: 'Djembe solo/sangban', bass: 'Dundunba' },
    artists: ['Mamady Keïta', 'Famoudou Konaté'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,X,_,_,X,_,_,X], subdivisions: 12 },
      { instrumentId: 'conga-slap', steps: [_,_,X,_,X,_,_,_,X,_,X,_], subdivisions: 12 },
      { instrumentId: 'conga-low', steps: [X,_,_,_,_,_,X,_,_,_,_,_], subdivisions: 12 },
      { instrumentId: 'surdo', steps: [X,_,_,_,_,_,_,_,_,X,_,_], subdivisions: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH / EAST AFRICA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Gnawa',
    category: 'North African',
    region: 'Africa',
    country: 'Morocco',
    countryCode: 'MA',
    description: 'Gnawa trance rhythm with qraqeb (metal castanets) and guembri bass lute. Spiritual music.',
    bpm: 100,
    swing: 10,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [3, 3, 2],
    tempoRange: [80, 120],
    instrumentRoles: { timeline: 'Qraqeb', groove: 'Guembri', bass: 'Guembri bass' },
    artists: ['Maalem Mahmoud Guinia', 'Gnawa Diffusion'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'clave', steps: [X,_,_,X,_,_,X,_,X,_,_,X,_,_,X,_], subdivisions: 16 },
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'clap', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,x,_,x,x,_,x,_,x,x,_,x,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Ethio-Groove',
    category: 'East African',
    region: 'Africa',
    country: 'Ethiopia',
    countryCode: 'ET',
    description: 'Ethiopian groove blending traditional rhythms with funk. The "Éthiopiques" sound.',
    bpm: 105,
    swing: 15,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [3, 3, 2],
    tempoRange: [90, 120],
    instrumentRoles: { groove: 'Drums', bass: 'Bass guitar' },
    artists: ['Mulatu Astatke', 'Hailu Mergia', 'Éthiopiques series'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [_,_,_,x,_,_,_,_,_,_,_,x,_,_,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Township Jive',
    category: 'Southern African',
    region: 'Africa',
    country: 'South Africa',
    countryCode: 'ZA',
    description: 'Township jive / mbaqanga: the driving force behind South African popular music.',
    bpm: 130,
    swing: 10,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [110, 150],
    instrumentRoles: { groove: 'Drums', bass: 'Bass guitar' },
    artists: ['Mahlathini & the Mahotella Queens', 'Soul Brothers'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,_,X,_,X,_,_,X,_,_,X,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Soukous',
    category: 'Central African',
    region: 'Africa',
    country: 'DR Congo',
    countryCode: 'CD',
    description: 'Congolese rumba / soukous. Fast sebene section with driving guitars.',
    bpm: 140,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [120, 170],
    instrumentRoles: { groove: 'Drums/Guitar', bass: 'Bass guitar' },
    artists: ['Franco & TPOK Jazz', 'Papa Wemba', 'Koffi Olomide'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,_,x,_,_,x,_,_,_,_,x], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,_,X,_,_,X,_,X,_,_,X,_,_,X,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Maqsum',
    category: 'Middle Eastern',
    region: 'Middle East',
    country: 'Egypt',
    countryCode: 'EG',
    description: 'Most common Arabic rhythm. "Dum-tak-tak-Dum-tak" pattern on doumbek.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [3, 2, 3],
    tempoRange: [100, 140],
    instrumentRoles: { timeline: 'Sagat (finger cymbals)', groove: 'Doumbek/Tabla', bass: 'Doumbek dum' },
    artists: ['Hossam Ramzy'],
    complexity: 'beginner',
    culturalDescription: 'Foundation of Egyptian belly dance rhythms (iqa\'at). D=dum (bass), T=tek (edge).',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,X,_,_,_,_,_,X,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,_,_,_,_,x,_,_,_,_,_,X,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Baladi',
    category: 'Middle Eastern',
    region: 'Middle East',
    country: 'Egypt',
    countryCode: 'EG',
    description: 'Egyptian baladi: "of the country." Earthy, grounded belly dance rhythm.',
    bpm: 100,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [80, 120],
    instrumentRoles: { groove: 'Doumbek/Tabla', bass: 'Doumbek dum' },
    artists: ['Hossam Ramzy', 'Sami Nossair'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,X,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,_,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,_,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Saidi',
    category: 'Middle Eastern',
    region: 'Middle East',
    country: 'Egypt',
    countryCode: 'EG',
    description: 'Upper Egyptian rhythm. Heavy, accented feel with strong downbeats.',
    bpm: 110,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [90, 130],
    instrumentRoles: { groove: 'Tabla', bass: 'Dum strokes' },
    artists: ['Mahmoud Reda'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,X,_,_,_,X,_,_,_,_,_,X,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,_,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,_,_,_,_,x,_,_,_,x,_,_,_,_,x], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,x,_,_,_,_,_,_,_,x,_,_,_,_,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TURKEY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Aksak (9/8)',
    category: 'Turkish',
    region: 'Middle East',
    country: 'Turkey',
    countryCode: 'TR',
    description: 'Turkish aksak ("limping") rhythm in 9/8. Grouping: 2+2+2+3.',
    bpm: 140,
    swing: 0,
    timeSignature: [9, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [2, 2, 2, 3],
    tempoRange: [120, 170],
    instrumentRoles: { timeline: 'Zil (finger cymbals)', groove: 'Darbuka', bass: 'Dum strokes' },
    artists: ['Burhan Öçal', 'Okay Temiz'],
    complexity: 'advanced',
    subdivisionType: '8th notes in groups of 2+2+2+3',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,X,_,_,_,_], subdivisions: 9 },
      { instrumentId: 'conga-slap', steps: [_,_,X,_,_,_,X,_,_], subdivisions: 9 },
      { instrumentId: 'conga-high', steps: [_,x,_,x,_,x,_,x,x], subdivisions: 9 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x], subdivisions: 9 },
    ],
  },
  {
    name: 'Karşılama (9/8)',
    category: 'Turkish',
    region: 'Middle East',
    country: 'Turkey',
    countryCode: 'TR',
    description: 'Turkish dance in 9/8 with grouping 2+3+2+2. Face-to-face dance.',
    bpm: 130,
    swing: 0,
    timeSignature: [9, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [2, 3, 2, 2],
    tempoRange: [110, 150],
    instrumentRoles: { groove: 'Darbuka' },
    artists: ['Turkish folk tradition'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,X,_,_,_], subdivisions: 9 },
      { instrumentId: 'conga-slap', steps: [_,_,X,_,_,_,_,X,_], subdivisions: 9 },
      { instrumentId: 'conga-high', steps: [_,x,_,x,x,_,x,_,x], subdivisions: 9 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x], subdivisions: 9 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH ASIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Tintal (16-beat Tala)',
    category: 'South Asian',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    description: 'Most common Hindustani tala. 16 beats: 4+4+4+4. Clap on 1, 5, 13; wave on 9.',
    bpm: 80,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [4, 4, 4, 4],
    tempoRange: [60, 160],
    instrumentRoles: { timeline: 'Tabla bayan (bass)', groove: 'Tabla dayan (treble)' },
    artists: ['Zakir Hussain', 'Ustad Alla Rakha'],
    complexity: 'intermediate',
    culturalDescription: 'Vibhags: X(clap) | 2(clap) | 0(wave/khali) | 3(clap). Structured improvisation over 16 beats.',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,x,_,_,_,_,_,_,_,x,_,_,_], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,x,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,x,_,x,_,x,_,x,_,x,_,x,_,x,_,x], subdivisions: 16 },
      { instrumentId: 'bongo', steps: [X,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Rupak Tala (7-beat)',
    category: 'South Asian',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    description: 'Hindustani tala in 7 beats: 3+2+2. Asymmetric feel with khali (wave) on beat 1.',
    bpm: 90,
    swing: 0,
    timeSignature: [7, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [3, 2, 2],
    tempoRange: [60, 120],
    instrumentRoles: { groove: 'Tabla' },
    artists: ['Zakir Hussain'],
    complexity: 'advanced',
    culturalDescription: 'Unusual: beat 1 is khali (wave, not clap). Creates a floating, unresolved feel.',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,X,_], subdivisions: 7 },
      { instrumentId: 'conga-slap', steps: [_,_,x,_,x,_,x], subdivisions: 7 },
      { instrumentId: 'conga-high', steps: [_,x,_,_,_,_,_], subdivisions: 7 },
    ],
  },
  {
    name: 'Jhaptal (10-beat)',
    category: 'South Asian',
    region: 'South Asia',
    country: 'India',
    countryCode: 'IN',
    description: 'Hindustani tala in 10 beats: 2+3+2+3. Used in semi-classical and devotional music.',
    bpm: 80,
    swing: 0,
    timeSignature: [10, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [2, 3, 2, 3],
    tempoRange: [60, 120],
    instrumentRoles: { groove: 'Tabla' },
    artists: ['Zakir Hussain', 'Pandit Jasraj'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,X,_,_,_,_], subdivisions: 10 },
      { instrumentId: 'conga-slap', steps: [_,_,X,_,_,_,_,X,_,_], subdivisions: 10 },
      { instrumentId: 'conga-high', steps: [_,x,_,x,x,_,x,_,x,x], subdivisions: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BALKANS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Kopanitsa (11/8)',
    category: 'Balkan',
    region: 'Europe',
    country: 'Bulgaria',
    countryCode: 'BG',
    description: 'Bulgarian folk dance in 11/8: 2+2+3+2+2. One of the most complex Balkan meters.',
    bpm: 160,
    swing: 0,
    timeSignature: [11, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [2, 2, 3, 2, 2],
    tempoRange: [140, 200],
    instrumentRoles: { groove: 'Tapan/Drum', timeline: 'Gadulka/Gaida' },
    artists: ['Le Mystère des Voix Bulgares', 'Ivo Papazov'],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,X,_,X,_,_,X,_,X,_], subdivisions: 11 },
      { instrumentId: 'rimshot', steps: [_,x,_,x,_,x,x,_,x,_,x], subdivisions: 11 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x], subdivisions: 11 },
    ],
  },
  {
    name: 'Rachenitsa (7/8)',
    category: 'Balkan',
    region: 'Europe',
    country: 'Bulgaria',
    countryCode: 'BG',
    description: 'Bulgarian national dance in 7/8: 2+2+3 (quick-quick-slow).',
    bpm: 140,
    swing: 0,
    timeSignature: [7, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [2, 2, 3],
    tempoRange: [120, 170],
    instrumentRoles: { groove: 'Tapan' },
    artists: ['Bulgarian folk tradition'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,X,_,X,_,_], subdivisions: 7 },
      { instrumentId: 'rimshot', steps: [_,x,_,x,_,x,x], subdivisions: 7 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x], subdivisions: 7 },
    ],
  },
  {
    name: 'Lesnoto (7/8)',
    category: 'Balkan',
    region: 'Europe',
    country: 'North Macedonia',
    countryCode: 'MK',
    description: 'Macedonian folk dance in 7/8: 3+2+2 (slow-quick-quick). The "easy one."',
    bpm: 120,
    swing: 0,
    timeSignature: [7, 8],
    timeFeel: 'asymmetric',
    pulseGrouping: [3, 2, 2],
    tempoRange: [100, 140],
    instrumentRoles: { groove: 'Tapan' },
    artists: ['Kočani Orkestar'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,X,_], subdivisions: 7 },
      { instrumentId: 'rimshot', steps: [_,x,x,_,x,_,x], subdivisions: 7 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x], subdivisions: 7 },
    ],
  },
  {
    name: 'Čoček (4/4)',
    category: 'Balkan',
    region: 'Europe',
    country: 'Serbia',
    countryCode: 'RS',
    description: 'Roma/Romani dance rhythm popular across the Balkans. Driving, celebratory feel.',
    bpm: 140,
    swing: 5,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [120, 180],
    instrumentRoles: { groove: 'Drums/Darbuka', bass: 'Tuba/Kick' },
    artists: ['Boban Marković', 'Fanfare Ciocărlia'],
    complexity: 'intermediate',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'conga-high', steps: [_,_,x,_,_,_,_,x,_,_,x,_,_,_,_,x], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IRELAND / CELTIC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Reel (4/4)',
    category: 'Celtic',
    region: 'Europe',
    country: 'Ireland',
    countryCode: 'IE',
    description: 'Irish reel in 4/4. Fast, driving dance rhythm. Most common Irish dance form.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [100, 140],
    instrumentRoles: { groove: 'Bodhrán', bass: 'Bodhrán bass' },
    artists: ['Peadar Mercier', 'Colm Murphy', 'The Chieftains'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Jig (6/8)',
    category: 'Celtic',
    region: 'Europe',
    country: 'Ireland',
    countryCode: 'IE',
    description: 'Irish jig in 6/8 compound meter. "Jiggity" feel: 3+3 grouping.',
    bpm: 130,
    swing: 0,
    timeSignature: [6, 8],
    timeFeel: 'compound',
    pulseGrouping: [3, 3],
    tempoRange: [110, 150],
    instrumentRoles: { groove: 'Bodhrán' },
    artists: ['The Chieftains', 'Planxty'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,X,_,_,_,_,_], subdivisions: 12 },
      { instrumentId: 'rimshot', steps: [_,_,_,X,_,_,_,_,_,X,_,_], subdivisions: 12 },
      { instrumentId: 'hh-closed', steps: [x,_,x,x,_,x,x,_,x,x,_,x], subdivisions: 12 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CARIBBEAN (ADDITIONAL)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Reggae One Drop',
    category: 'Jamaican',
    region: 'Caribbean',
    country: 'Jamaica',
    countryCode: 'JM',
    description: 'Signature reggae beat: kick and snare together on beat 3, nothing on beat 1.',
    bpm: 80,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [65, 95],
    instrumentRoles: { timeline: 'Hi-hat/Rim', groove: 'One drop', bass: 'Bass guitar' },
    artists: ['Bob Marley', 'Carlton Barrett', 'Sly Dunbar'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,x,_,_,_,x,_,_,_,x,_,_,_,x], subdivisions: 16 },
    ],
  },
  {
    name: 'Ska',
    category: 'Jamaican',
    region: 'Caribbean',
    country: 'Jamaica',
    countryCode: 'JM',
    description: 'Jamaican ska: upbeat-heavy rhythm predating reggae. Walking bass feel.',
    bpm: 140,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [120, 170],
    instrumentRoles: { timeline: 'Guitar skank', groove: 'Drums', bass: 'Walking bass' },
    artists: ['The Skatalites', 'Prince Buster'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [_,_,x,_,_,_,x,_,_,_,x,_,_,_,x,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,X,_,_,_,X,_,_,_,X,_,_,_,X,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Soca',
    category: 'Caribbean',
    region: 'Caribbean',
    country: 'Trinidad & Tobago',
    countryCode: 'TT',
    description: 'Calypso-derived party rhythm. High-energy, carnival music.',
    bpm: 140,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [120, 160],
    instrumentRoles: { groove: 'Drums/Iron', bass: 'Bass' },
    artists: ['Machel Montano', 'Kes The Band'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,_,_,_,_,X,_,_,_,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'cowbell', steps: [X,_,X,_,X,_,X,_,X,_,X,_,X,_,X,_], subdivisions: 16 },
    ],
  },
  {
    name: 'Merengue',
    category: 'Caribbean',
    region: 'Caribbean',
    country: 'Dominican Republic',
    countryCode: 'DO',
    description: 'Dominican national dance. Güira and tambora drive the infectious groove.',
    bpm: 150,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [130, 180],
    instrumentRoles: { timeline: 'Güira', groove: 'Tambora', bass: 'Tambora bass' },
    artists: ['Juan Luis Guerra', 'Johnny Ventura'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,X,_,_,_,X,_,_,_,X,_,_,_,X,_], subdivisions: 16 },
      { instrumentId: 'shaker', steps: [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x], subdivisions: 16 },
      { instrumentId: 'conga-slap', steps: [_,_,_,_,_,_,_,X,_,_,_,_,_,_,_,X], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STANDARD / CONTEMPORARY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'Basic Rock',
    category: 'Standard',
    region: 'Universal',
    country: 'United States',
    countryCode: 'US',
    description: 'Standard rock beat: kick on 1 and 3, snare on 2 and 4.',
    bpm: 120,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [90, 160],
    complexity: 'beginner',
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
    country: 'United States',
    countryCode: 'US',
    description: 'Classic funk with syncopated kick and ghost snare notes.',
    bpm: 100,
    swing: 15,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [85, 115],
    instrumentRoles: { groove: 'Drums', bass: 'Bass guitar' },
    artists: ['Clyde Stubblefield', 'James Brown', 'Bootsy Collins'],
    complexity: 'intermediate',
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
    country: 'United States',
    countryCode: 'US',
    description: 'Boom-bap style hip hop with heavy swing.',
    bpm: 90,
    swing: 25,
    timeSignature: [4, 4],
    timeFeel: 'swing',
    pulseGrouping: [2, 2, 2, 2],
    tempoRange: [80, 100],
    instrumentRoles: { groove: '808/Sampler', bass: '808 sub' },
    artists: ['J Dilla', 'DJ Premier', '9th Wonder'],
    complexity: 'beginner',
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
    country: 'Puerto Rico',
    countryCode: 'PR',
    description: 'Dembow riddim: the backbone of reggaeton.',
    bpm: 95,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'straight',
    pulseGrouping: [3, 3, 2],
    tempoRange: [85, 105],
    instrumentRoles: { groove: 'Dembow', bass: 'Sub bass' },
    artists: ['Daddy Yankee', 'Bad Bunny'],
    complexity: 'beginner',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,X,_,_,_,_,X,_,_,X,_,_,_,_], subdivisions: 16 },
      { instrumentId: 'snare', steps: [_,_,_,_,X,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 16 },
      { instrumentId: 'hh-closed', steps: [x,_,x,_,x,_,x,_,x,_,x,_,x,_,x,_], subdivisions: 16 },
      { instrumentId: 'rimshot', steps: [_,_,_,x,_,_,x,_,_,_,_,x,_,_,x,_], subdivisions: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // POLYRHYTHMS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: '3 vs 4 Polyrhythm',
    category: 'Polyrhythm',
    region: 'Universal',
    country: 'Universal',
    countryCode: 'UN',
    description: 'Foundational cross-rhythm: 3 beats against 4.',
    bpm: 100,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'polyrhythmic',
    pulseGrouping: [3, 3, 3, 3],
    tempoRange: [60, 140],
    complexity: 'intermediate',
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
    country: 'Universal',
    countryCode: 'UN',
    description: 'Advanced cross-rhythm: 5 evenly spaced beats against 4.',
    bpm: 90,
    swing: 0,
    timeSignature: [4, 4],
    timeFeel: 'polyrhythmic',
    pulseGrouping: [4, 4, 4, 4, 4],
    tempoRange: [60, 120],
    complexity: 'advanced',
    tracks: [
      { instrumentId: 'kick', steps: [X,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,X,_,_,_], subdivisions: 20 },
      { instrumentId: 'clave', steps: [X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_,X,_,_,_], subdivisions: 20 },
    ],
  },
];

// ─── Country → coordinates mapping for the world map ────────────────────────

export interface CountryMapData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  rhythmCount: number;
}

export function getCountryMapData(): CountryMapData[] {
  const countryMap = new Map<string, { name: string; region: string; count: number }>();
  DRUM_PRESETS.forEach(p => {
    if (p.countryCode === 'UN') return;
    const existing = countryMap.get(p.countryCode);
    if (existing) {
      existing.count++;
    } else {
      countryMap.set(p.countryCode, { name: p.country, region: p.region, count: 1 });
    }
  });

  // Real lat/lng coordinates
  const positions: Record<string, [number, number]> = {
    'US': [39.8, -98.6], 'CU': [21.5, -80.0], 'PR': [18.2, -66.6], 'JM': [18.1, -77.3],
    'DO': [18.7, -70.2], 'TT': [10.4, -61.2], 'CO': [4.6, -74.1], 'PE': [-12.0, -77.0],
    'BR': [-14.2, -51.9], 'UY': [-32.5, -55.8], 'AR': [-38.4, -63.6], 'MX': [23.6, -102.6],
    'ES': [40.5, -3.7], 'IE': [53.4, -8.2], 'BG': [42.7, 25.5], 'MK': [41.5, 21.7],
    'RS': [44.0, 21.0], 'GH': [7.9, -1.0], 'NG': [9.1, 7.5], 'SN': [14.5, -14.5],
    'GN': [9.9, -11.6], 'MA': [31.8, -7.1], 'ET': [9.1, 40.5], 'ZA': [-30.6, 22.9],
    'CD': [-4.0, 21.8], 'EG': [26.8, 30.8], 'TR': [39.0, 35.2], 'IN': [20.6, 79.0],
  };

  const result: CountryMapData[] = [];
  countryMap.forEach((data, code) => {
    const pos = positions[code] || [0, 0];
    result.push({
      code,
      name: data.name,
      lat: pos[0],
      lng: pos[1],
      region: data.region,
      rhythmCount: data.count,
    });
  });

  return result;
}

// ─── Utility functions ──────────────────────────────────────────────────────

export function getPresetsByRegion(): Record<string, PatternPreset[]> {
  const map: Record<string, PatternPreset[]> = {};
  DRUM_PRESETS.forEach(p => {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  });
  return map;
}

export function getPresetsByCountry(): Record<string, PatternPreset[]> {
  const map: Record<string, PatternPreset[]> = {};
  DRUM_PRESETS.forEach(p => {
    if (!map[p.country]) map[p.country] = [];
    map[p.country].push(p);
  });
  return map;
}

export function getPresetsByFeel(): Record<TimeFeel, PatternPreset[]> {
  const map: Record<TimeFeel, PatternPreset[]> = {
    straight: [], swing: [], compound: [], asymmetric: [], polyrhythmic: [],
  };
  DRUM_PRESETS.forEach(p => {
    map[p.timeFeel].push(p);
  });
  return map;
}

export function getPresetsByComplexity(): Record<Complexity, PatternPreset[]> {
  const map: Record<Complexity, PatternPreset[]> = {
    beginner: [], intermediate: [], advanced: [],
  };
  DRUM_PRESETS.forEach(p => {
    map[p.complexity].push(p);
  });
  return map;
}

export function getAllRegions(): string[] {
  return [...new Set(DRUM_PRESETS.map(p => p.region))];
}

export function getAllCountries(): string[] {
  return [...new Set(DRUM_PRESETS.filter(p => p.country !== 'Universal').map(p => p.country))];
}

export function getAllCategories(): string[] {
  return [...new Set(DRUM_PRESETS.map(p => p.category))];
}

export function filterPresets(opts: {
  category?: string | null;
  timeFeel?: TimeFeel | null;
  complexity?: Complexity | null;
  bpmRange?: [number, number] | null;
  country?: string | null;
  search?: string;
}): PatternPreset[] {
  return DRUM_PRESETS.filter(p => {
    if (opts.category && p.category !== opts.category) return false;
    if (opts.timeFeel && p.timeFeel !== opts.timeFeel) return false;
    if (opts.complexity && p.complexity !== opts.complexity) return false;
    if (opts.country && p.country !== opts.country) return false;
    if (opts.bpmRange) {
      if (p.bpm < opts.bpmRange[0] || p.bpm > opts.bpmRange[1]) return false;
    }
    if (opts.search) {
      const s = opts.search.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        p.country.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        (p.artists || []).some(a => a.toLowerCase().includes(s))
      );
    }
    return true;
  });
}

export function formatPulseGrouping(grouping: number[]): string {
  return grouping.join(' + ');
}
