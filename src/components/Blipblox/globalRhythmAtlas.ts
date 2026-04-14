export type RhythmTag =
  | "binary"
  | "ternary"
  | "compound"
  | "asymmetric"
  | "polyrhythm"
  | "clave-based"
  | "cycle-based"
  | "12-beat-cycle"
  | "dance-driven"
  | "improvisational"
  | "call-response"
  | "hand-percussion"
  | "ensemble"
  | "drum-kit-adapted";

export type Rhythm = {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: RhythmContinent;
  tradition: string;
  meter: string;
  subdivision: number[];
  cycleLength: number;
  bpmRange: [number, number];
  instruments: string[];
  midiPattern: number[];
  accents: number[];
  timbreProfile: string;
  confidence: "high" | "medium" | "low";
  classification: "documented" | "regional" | "proxy";
  tags: RhythmTag[];
  source: {
    title: string;
    type: "pdf" | "academic" | "field" | "midi";
  };
};

export type RhythmContinent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

export type CountryMetadata = {
  country: string;
  region: string;
  continent: RhythmContinent;
};

type RhythmTemplate = Omit<Rhythm, "country" | "region" | "continent" | "midiPattern" | "accents" | "tags"> & {
  hitUnits: number[];
  accentUnits: number[];
  tags?: RhythmTag[];
};

type RegionalGroupId =
  | "west_africa_timeline"
  | "east_africa_ngoma"
  | "central_africa_polyrhythm"
  | "southern_africa_pulse"
  | "north_africa_maqsum"
  | "balkan_seven"
  | "middle_east_maqsum"
  | "south_asia_tala"
  | "southeast_asia_gamelan"
  | "east_asia_pulse"
  | "central_asia_pulse"
  | "caribbean_clave"
  | "central_america_marimba"
  | "andean_huayno"
  | "northern_europe_march"
  | "western_europe_waltz"
  | "southern_europe_compound"
  | "eastern_europe_dance"
  | "oceania_log_drum";

export const CANONICAL_COUNTRY_LIST = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Republic)",
  "Congo (Democratic Republic)",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Palestine",
] as const;

export const COUNTRY_METADATA: CountryMetadata[] = [
  { country: "Afghanistan", region: "South Asia", continent: "Asia" },
  { country: "Albania", region: "Balkans", continent: "Europe" },
  { country: "Algeria", region: "North Africa", continent: "Africa" },
  { country: "Andorra", region: "Southern Europe", continent: "Europe" },
  { country: "Angola", region: "Southern Africa", continent: "Africa" },
  { country: "Antigua and Barbuda", region: "Caribbean", continent: "North America" },
  { country: "Argentina", region: "Southern Cone", continent: "South America" },
  { country: "Armenia", region: "Caucasus", continent: "Asia" },
  { country: "Australia", region: "Australia and New Zealand", continent: "Oceania" },
  { country: "Austria", region: "Central Europe", continent: "Europe" },
  { country: "Azerbaijan", region: "Caucasus", continent: "Asia" },
  { country: "Bahamas", region: "Caribbean", continent: "North America" },
  { country: "Bahrain", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Bangladesh", region: "South Asia", continent: "Asia" },
  { country: "Barbados", region: "Caribbean", continent: "North America" },
  { country: "Belarus", region: "Eastern Europe", continent: "Europe" },
  { country: "Belgium", region: "Western Europe", continent: "Europe" },
  { country: "Belize", region: "Central America", continent: "North America" },
  { country: "Benin", region: "West Africa", continent: "Africa" },
  { country: "Bhutan", region: "South Asia", continent: "Asia" },
  { country: "Bolivia", region: "Andes", continent: "South America" },
  { country: "Bosnia and Herzegovina", region: "Balkans", continent: "Europe" },
  { country: "Botswana", region: "Southern Africa", continent: "Africa" },
  { country: "Brazil", region: "South America", continent: "South America" },
  { country: "Brunei", region: "Southeast Asia", continent: "Asia" },
  { country: "Bulgaria", region: "Balkans", continent: "Europe" },
  { country: "Burkina Faso", region: "West Africa", continent: "Africa" },
  { country: "Burundi", region: "East Africa", continent: "Africa" },
  { country: "Cabo Verde", region: "West Africa", continent: "Africa" },
  { country: "Cambodia", region: "Southeast Asia", continent: "Asia" },
  { country: "Cameroon", region: "Central Africa", continent: "Africa" },
  { country: "Canada", region: "North America", continent: "North America" },
  { country: "Central African Republic", region: "Central Africa", continent: "Africa" },
  { country: "Chad", region: "Central Africa", continent: "Africa" },
  { country: "Chile", region: "Andes", continent: "South America" },
  { country: "China", region: "East Asia", continent: "Asia" },
  { country: "Colombia", region: "Northern South America", continent: "South America" },
  { country: "Comoros", region: "East Africa", continent: "Africa" },
  { country: "Congo (Republic)", region: "Central Africa", continent: "Africa" },
  { country: "Congo (Democratic Republic)", region: "Central Africa", continent: "Africa" },
  { country: "Costa Rica", region: "Central America", continent: "North America" },
  { country: "Cote d'Ivoire", region: "West Africa", continent: "Africa" },
  { country: "Croatia", region: "Balkans", continent: "Europe" },
  { country: "Cuba", region: "Caribbean", continent: "North America" },
  { country: "Cyprus", region: "Eastern Mediterranean", continent: "Europe" },
  { country: "Czechia", region: "Central Europe", continent: "Europe" },
  { country: "Denmark", region: "Northern Europe", continent: "Europe" },
  { country: "Djibouti", region: "East Africa", continent: "Africa" },
  { country: "Dominica", region: "Caribbean", continent: "North America" },
  { country: "Dominican Republic", region: "Caribbean", continent: "North America" },
  { country: "Ecuador", region: "Andes", continent: "South America" },
  { country: "Egypt", region: "North Africa", continent: "Africa" },
  { country: "El Salvador", region: "Central America", continent: "North America" },
  { country: "Equatorial Guinea", region: "Central Africa", continent: "Africa" },
  { country: "Eritrea", region: "East Africa", continent: "Africa" },
  { country: "Estonia", region: "Northern Europe", continent: "Europe" },
  { country: "Eswatini", region: "Southern Africa", continent: "Africa" },
  { country: "Ethiopia", region: "East Africa", continent: "Africa" },
  { country: "Fiji", region: "Melanesia", continent: "Oceania" },
  { country: "Finland", region: "Northern Europe", continent: "Europe" },
  { country: "France", region: "Western Europe", continent: "Europe" },
  { country: "Gabon", region: "Central Africa", continent: "Africa" },
  { country: "Gambia", region: "West Africa", continent: "Africa" },
  { country: "Georgia", region: "Caucasus", continent: "Asia" },
  { country: "Germany", region: "Central Europe", continent: "Europe" },
  { country: "Ghana", region: "West Africa", continent: "Africa" },
  { country: "Greece", region: "Balkans", continent: "Europe" },
  { country: "Grenada", region: "Caribbean", continent: "North America" },
  { country: "Guatemala", region: "Central America", continent: "North America" },
  { country: "Guinea", region: "West Africa", continent: "Africa" },
  { country: "Guinea-Bissau", region: "West Africa", continent: "Africa" },
  { country: "Guyana", region: "Guianas", continent: "South America" },
  { country: "Haiti", region: "Caribbean", continent: "North America" },
  { country: "Honduras", region: "Central America", continent: "North America" },
  { country: "Hungary", region: "Central Europe", continent: "Europe" },
  { country: "Iceland", region: "Northern Europe", continent: "Europe" },
  { country: "India", region: "South Asia", continent: "Asia" },
  { country: "Indonesia", region: "Southeast Asia", continent: "Asia" },
  { country: "Iran", region: "West Asia", continent: "Asia" },
  { country: "Iraq", region: "Middle East", continent: "Asia" },
  { country: "Ireland", region: "Northern Europe", continent: "Europe" },
  { country: "Israel", region: "Middle East", continent: "Asia" },
  { country: "Italy", region: "Southern Europe", continent: "Europe" },
  { country: "Jamaica", region: "Caribbean", continent: "North America" },
  { country: "Japan", region: "East Asia", continent: "Asia" },
  { country: "Jordan", region: "Middle East", continent: "Asia" },
  { country: "Kazakhstan", region: "Central Asia", continent: "Asia" },
  { country: "Kenya", region: "East Africa", continent: "Africa" },
  { country: "Kiribati", region: "Micronesia", continent: "Oceania" },
  { country: "Kuwait", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Kyrgyzstan", region: "Central Asia", continent: "Asia" },
  { country: "Laos", region: "Southeast Asia", continent: "Asia" },
  { country: "Latvia", region: "Northern Europe", continent: "Europe" },
  { country: "Lebanon", region: "Middle East", continent: "Asia" },
  { country: "Lesotho", region: "Southern Africa", continent: "Africa" },
  { country: "Liberia", region: "West Africa", continent: "Africa" },
  { country: "Libya", region: "North Africa", continent: "Africa" },
  { country: "Liechtenstein", region: "Central Europe", continent: "Europe" },
  { country: "Lithuania", region: "Northern Europe", continent: "Europe" },
  { country: "Luxembourg", region: "Western Europe", continent: "Europe" },
  { country: "Madagascar", region: "Indian Ocean", continent: "Africa" },
  { country: "Malawi", region: "Southern Africa", continent: "Africa" },
  { country: "Malaysia", region: "Southeast Asia", continent: "Asia" },
  { country: "Maldives", region: "South Asia", continent: "Asia" },
  { country: "Mali", region: "West Africa", continent: "Africa" },
  { country: "Malta", region: "Southern Europe", continent: "Europe" },
  { country: "Marshall Islands", region: "Micronesia", continent: "Oceania" },
  { country: "Mauritania", region: "West Africa", continent: "Africa" },
  { country: "Mauritius", region: "Indian Ocean", continent: "Africa" },
  { country: "Mexico", region: "North America", continent: "North America" },
  { country: "Micronesia", region: "Micronesia", continent: "Oceania" },
  { country: "Moldova", region: "Eastern Europe", continent: "Europe" },
  { country: "Monaco", region: "Western Europe", continent: "Europe" },
  { country: "Mongolia", region: "East Asia", continent: "Asia" },
  { country: "Montenegro", region: "Balkans", continent: "Europe" },
  { country: "Morocco", region: "North Africa", continent: "Africa" },
  { country: "Mozambique", region: "Southern Africa", continent: "Africa" },
  { country: "Myanmar", region: "Southeast Asia", continent: "Asia" },
  { country: "Namibia", region: "Southern Africa", continent: "Africa" },
  { country: "Nauru", region: "Micronesia", continent: "Oceania" },
  { country: "Nepal", region: "South Asia", continent: "Asia" },
  { country: "Netherlands", region: "Western Europe", continent: "Europe" },
  { country: "New Zealand", region: "Australia and New Zealand", continent: "Oceania" },
  { country: "Nicaragua", region: "Central America", continent: "North America" },
  { country: "Niger", region: "West Africa", continent: "Africa" },
  { country: "Nigeria", region: "West Africa", continent: "Africa" },
  { country: "North Korea", region: "East Asia", continent: "Asia" },
  { country: "North Macedonia", region: "Balkans", continent: "Europe" },
  { country: "Norway", region: "Northern Europe", continent: "Europe" },
  { country: "Oman", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Pakistan", region: "South Asia", continent: "Asia" },
  { country: "Palau", region: "Micronesia", continent: "Oceania" },
  { country: "Panama", region: "Central America", continent: "North America" },
  { country: "Papua New Guinea", region: "Melanesia", continent: "Oceania" },
  { country: "Paraguay", region: "Southern Cone", continent: "South America" },
  { country: "Peru", region: "Andes", continent: "South America" },
  { country: "Philippines", region: "Southeast Asia", continent: "Asia" },
  { country: "Poland", region: "Central Europe", continent: "Europe" },
  { country: "Portugal", region: "Southern Europe", continent: "Europe" },
  { country: "Qatar", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Romania", region: "Balkans", continent: "Europe" },
  { country: "Russia", region: "Eastern Europe", continent: "Europe" },
  { country: "Rwanda", region: "East Africa", continent: "Africa" },
  { country: "Saint Kitts and Nevis", region: "Caribbean", continent: "North America" },
  { country: "Saint Lucia", region: "Caribbean", continent: "North America" },
  { country: "Saint Vincent and the Grenadines", region: "Caribbean", continent: "North America" },
  { country: "Samoa", region: "Polynesia", continent: "Oceania" },
  { country: "San Marino", region: "Southern Europe", continent: "Europe" },
  { country: "Sao Tome and Principe", region: "Central Africa", continent: "Africa" },
  { country: "Saudi Arabia", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Senegal", region: "West Africa", continent: "Africa" },
  { country: "Serbia", region: "Balkans", continent: "Europe" },
  { country: "Seychelles", region: "Indian Ocean", continent: "Africa" },
  { country: "Sierra Leone", region: "West Africa", continent: "Africa" },
  { country: "Singapore", region: "Southeast Asia", continent: "Asia" },
  { country: "Slovakia", region: "Central Europe", continent: "Europe" },
  { country: "Slovenia", region: "Balkans", continent: "Europe" },
  { country: "Solomon Islands", region: "Melanesia", continent: "Oceania" },
  { country: "Somalia", region: "East Africa", continent: "Africa" },
  { country: "South Africa", region: "Southern Africa", continent: "Africa" },
  { country: "South Korea", region: "East Asia", continent: "Asia" },
  { country: "South Sudan", region: "East Africa", continent: "Africa" },
  { country: "Spain", region: "Southern Europe", continent: "Europe" },
  { country: "Sri Lanka", region: "South Asia", continent: "Asia" },
  { country: "Sudan", region: "North Africa", continent: "Africa" },
  { country: "Suriname", region: "Guianas", continent: "South America" },
  { country: "Sweden", region: "Northern Europe", continent: "Europe" },
  { country: "Switzerland", region: "Central Europe", continent: "Europe" },
  { country: "Syria", region: "Middle East", continent: "Asia" },
  { country: "Tajikistan", region: "Central Asia", continent: "Asia" },
  { country: "Tanzania", region: "East Africa", continent: "Africa" },
  { country: "Thailand", region: "Southeast Asia", continent: "Asia" },
  { country: "Timor-Leste", region: "Southeast Asia", continent: "Asia" },
  { country: "Togo", region: "West Africa", continent: "Africa" },
  { country: "Tonga", region: "Polynesia", continent: "Oceania" },
  { country: "Trinidad and Tobago", region: "Caribbean", continent: "North America" },
  { country: "Tunisia", region: "North Africa", continent: "Africa" },
  { country: "Turkey", region: "Anatolia", continent: "Asia" },
  { country: "Turkmenistan", region: "Central Asia", continent: "Asia" },
  { country: "Tuvalu", region: "Polynesia", continent: "Oceania" },
  { country: "Uganda", region: "East Africa", continent: "Africa" },
  { country: "Ukraine", region: "Eastern Europe", continent: "Europe" },
  { country: "United Arab Emirates", region: "Arabian Peninsula", continent: "Asia" },
  { country: "United Kingdom", region: "Northern Europe", continent: "Europe" },
  { country: "United States", region: "North America", continent: "North America" },
  { country: "Uruguay", region: "Southern Cone", continent: "South America" },
  { country: "Uzbekistan", region: "Central Asia", continent: "Asia" },
  { country: "Vanuatu", region: "Melanesia", continent: "Oceania" },
  { country: "Vatican City", region: "Southern Europe", continent: "Europe" },
  { country: "Venezuela", region: "Northern South America", continent: "South America" },
  { country: "Vietnam", region: "Southeast Asia", continent: "Asia" },
  { country: "Yemen", region: "Arabian Peninsula", continent: "Asia" },
  { country: "Zambia", region: "Southern Africa", continent: "Africa" },
  { country: "Zimbabwe", region: "Southern Africa", continent: "Africa" },
  { country: "Palestine", region: "Middle East", continent: "Asia" },
];

const TIMBRE_INSTRUMENTS: Record<string, string[]> = {
  djembe: ["Djembe", "Dunun Bell"],
  "conga/clave": ["Conga", "Clave"],
  surdo: ["Surdo", "Agogo"],
  "cajón": ["Cajon", "Palmas"],
  tupan: ["Tupan", "Hand Drum"],
  tabla: ["Tabla", "Konnakol"],
  darbuka: ["Darbuka", "Riq"],
  taiko: ["Taiko", "Shime-daiko"],
  "log drum": ["Log Drum", "Wood Block"],
  "neutral kit": ["Kick", "Snare"],
};

const DOCUMENTED_TEMPLATES: Record<string, RhythmTemplate> = {
  argentina_chacarera: {
    id: "argentina-chacarera",
    name: "Chacarera",
    tradition: "Argentine chacarera hemiola",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [108, 140],
    instruments: ["Bombo Leguero", "Palmas"],
    hitUnits: [0, 3, 6, 8, 10],
    accentUnits: [0, 6, 8],
    timbreProfile: "neutral kit",
    confidence: "high",
    classification: "documented",
    tags: ["compound", "12-beat-cycle", "dance-driven", "hand-percussion", "polyrhythm"],
    source: {
      title: "Bombo Leguero Patterns",
      type: "pdf",
    },
  },
  brazil_samba_de_roda: {
    id: "brazil-samba-de-roda",
    name: "Samba de Roda",
    tradition: "Bahian samba de roda",
    meter: "2/4",
    subdivision: [4, 4],
    cycleLength: 8,
    bpmRange: [96, 132],
    instruments: ["Surdo", "Agogo", "Palmas"],
    hitUnits: [0, 2, 4, 5, 6],
    accentUnits: [0, 4, 6],
    timbreProfile: "surdo",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "dance-driven", "ensemble", "call-response"],
    source: {
      title: "Samba de Roda Ensemble",
      type: "pdf",
    },
  },
  bulgaria_rachenitsa: {
    id: "bulgaria-rachenitsa",
    name: "Rachenitsa",
    tradition: "Bulgarian 7/8 dance rhythm",
    meter: "7/8",
    subdivision: [2, 2, 3],
    cycleLength: 7,
    bpmRange: [96, 144],
    instruments: ["Tupan", "Hand Drum"],
    hitUnits: [0, 2, 4],
    accentUnits: [0, 2, 4],
    timbreProfile: "tupan",
    confidence: "high",
    classification: "documented",
    tags: ["asymmetric", "dance-driven", "hand-percussion"],
    source: {
      title: "Bulgarian Rhythms Research Paper",
      type: "pdf",
    },
  },
  cuba_son_clave: {
    id: "cuba-son-clave-32",
    name: "Son Clave",
    tradition: "Cuban son clave (3-2)",
    meter: "4/4",
    subdivision: [4, 4, 4, 4, 4, 4, 4, 4],
    cycleLength: 32,
    bpmRange: [88, 124],
    instruments: ["Clave", "Conga", "Campana"],
    hitUnits: [0, 6, 12, 20, 24],
    accentUnits: [0, 12, 20, 24],
    timbreProfile: "conga/clave",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "clave-based", "dance-driven", "hand-percussion", "ensemble"],
    source: {
      title: "Claves in the Caribbean",
      type: "pdf",
    },
  },
  ghana_kpanlogo: {
    id: "ghana-kpanlogo",
    name: "Kpanlogo",
    tradition: "Ga social dance groove",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [90, 120],
    instruments: ["Djembe", "Bell"],
    hitUnits: [0, 3, 6, 8, 12, 14],
    accentUnits: [0, 6, 12],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "polyrhythm", "dance-driven", "call-response", "hand-percussion"],
    source: {
      title: "African Rhythms Overview",
      type: "academic",
    },
  },
  guinea_kuku: {
    id: "guinea-kuku",
    name: "Kuku",
    tradition: "Guinean harvest dance rhythm",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [96, 132],
    instruments: ["Djembe", "Dunun Bell"],
    hitUnits: [0, 2, 4, 6, 8, 10],
    accentUnits: [0, 4, 8],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["compound", "12-beat-cycle", "polyrhythm", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: {
      title: "African Rhythms and Calls",
      type: "pdf",
    },
  },
  india_teentaal: {
    id: "india-teentaal",
    name: "Teentaal",
    tradition: "North Indian tala cycle",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [72, 132],
    instruments: ["Tabla", "Konnakol"],
    hitUnits: [0, 4, 8, 12],
    accentUnits: [0, 4, 12],
    timbreProfile: "tabla",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "cycle-based", "improvisational", "hand-percussion"],
    source: {
      title: "Indian Rhythms and Odd Meters",
      type: "academic",
    },
  },
  japan_matsuri_bayashi: {
    id: "japan-matsuri-bayashi",
    name: "Matsuri Bayashi",
    tradition: "Japanese festival drumming pulse",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [88, 128],
    instruments: ["Taiko", "Shime-daiko"],
    hitUnits: [0, 4, 8, 12, 14],
    accentUnits: [0, 8, 12],
    timbreProfile: "taiko",
    confidence: "medium",
    classification: "documented",
    tags: ["binary", "ensemble", "call-response"],
    source: {
      title: "Festival drumming field reference",
      type: "field",
    },
  },
  peru_festejo: {
    id: "peru-festejo",
    name: "Festejo",
    tradition: "Afro-Peruvian festejo",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [96, 132],
    instruments: ["Cajon", "Quijada"],
    hitUnits: [0, 3, 5, 6, 9, 11],
    accentUnits: [0, 6, 9],
    timbreProfile: "cajón",
    confidence: "high",
    classification: "documented",
    tags: ["compound", "12-beat-cycle", "dance-driven", "hand-percussion", "polyrhythm"],
    source: {
      title: "Peru Cajon Grooves",
      type: "pdf",
    },
  },
  spain_buleria: {
    id: "spain-buleria",
    name: "Buleria",
    tradition: "Flamenco compas",
    meter: "12/8",
    subdivision: [3, 3, 2, 2, 2],
    cycleLength: 12,
    bpmRange: [126, 168],
    instruments: ["Cajon", "Palmas"],
    hitUnits: [0, 3, 6, 8, 10],
    accentUnits: [0, 3, 6, 8, 10],
    timbreProfile: "cajón",
    confidence: "high",
    classification: "documented",
    tags: ["asymmetric", "12-beat-cycle", "dance-driven", "hand-percussion", "improvisational"],
    source: {
      title: "Flamenco Rhythm Course Notes",
      type: "academic",
    },
  },
  uruguay_candombe: {
    id: "uruguay-candombe",
    name: "Candombe",
    tradition: "Afro-Uruguayan candombe",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [92, 122],
    instruments: ["Tambor Piano", "Tambor Chico", "Madera"],
    hitUnits: [0, 3, 6, 8, 10, 12, 15],
    accentUnits: [0, 6, 10, 12],
    timbreProfile: "surdo",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "polyrhythm", "dance-driven", "ensemble", "call-response"],
    source: {
      title: "Candombe Ensemble Parts",
      type: "pdf",
    },
  },
  senegal_sabar: {
    id: "senegal-sabar",
    name: "Sabar",
    tradition: "Wolof sabar drum ensemble",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [110, 160],
    instruments: ["Sabar", "Tama"],
    hitUnits: [0, 2, 5, 8, 10, 13],
    accentUnits: [0, 5, 10],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "polyrhythm", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: {
      title: "Wolof Sabar Drumming Tradition",
      type: "academic",
    },
  },
  mali_foli: {
    id: "mali-foli",
    name: "Foli",
    tradition: "Malian communal drum dance",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [100, 140],
    instruments: ["Djembe", "Dunun"],
    hitUnits: [0, 3, 4, 7, 8, 11, 12, 15],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "polyrhythm", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: {
      title: "Foli: Rhythm of Life Field Recording",
      type: "field",
    },
  },
  guinea_soli: {
    id: "guinea-soli",
    name: "Soli",
    tradition: "Guinean initiation ceremony rhythm",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [120, 160],
    instruments: ["Djembe", "Dunun Bell"],
    hitUnits: [0, 2, 4, 6, 10, 12, 14],
    accentUnits: [0, 4, 10, 14],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "polyrhythm", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: {
      title: "Mandinka Djembe Traditions",
      type: "academic",
    },
  },
  nigeria_timeline_six: {
    id: "nigeria-timeline-six",
    name: "Timeline in Six",
    tradition: "Yoruba 6/8 bell timeline",
    meter: "6/8",
    subdivision: [3, 3],
    cycleLength: 6,
    bpmRange: [90, 130],
    instruments: ["Agogo Bell", "Shekere"],
    hitUnits: [0, 1, 3, 4],
    accentUnits: [0, 3],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["compound", "polyrhythm", "dance-driven", "call-response", "hand-percussion"],
    source: {
      title: "Yoruba Drumming Timeline Patterns",
      type: "academic",
    },
  },
  cameroon_bikutsi: {
    id: "cameroon-bikutsi",
    name: "Bikutsi",
    tradition: "Beti people triple-pulse dance rhythm",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [110, 150],
    instruments: ["Balafon", "Nkul Drum"],
    hitUnits: [0, 1, 3, 4, 6, 7, 9, 10],
    accentUnits: [0, 3, 6, 9],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["compound", "12-beat-cycle", "dance-driven", "hand-percussion", "ensemble"],
    source: {
      title: "Bikutsi Rhythmic Structures",
      type: "academic",
    },
  },
  ethiopia_eskista: {
    id: "ethiopia-eskista",
    name: "Eskista",
    tradition: "Ethiopian shoulder-dance drum pattern",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [100, 140],
    instruments: ["Kebero", "Krar"],
    hitUnits: [0, 2, 4, 7, 8, 10, 14],
    accentUnits: [0, 4, 8, 14],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "dance-driven", "hand-percussion", "improvisational"],
    source: {
      title: "Ethiopian Music and Dance Traditions",
      type: "field",
    },
  },
  congo_soukous: {
    id: "congo-soukous",
    name: "Soukous",
    tradition: "Congolese rumba-derived dance rhythm",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [110, 150],
    instruments: ["Conga", "Snare"],
    hitUnits: [0, 3, 4, 6, 8, 11, 12, 14],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "dance-driven", "ensemble", "clave-based"],
    source: {
      title: "Congolese Rumba and Soukous",
      type: "academic",
    },
  },
  tanzania_ngoma: {
    id: "tanzania-ngoma",
    name: "Ngoma",
    tradition: "East African communal drum-dance",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [90, 130],
    instruments: ["Ngoma Drum", "Kayamba"],
    hitUnits: [0, 4, 6, 8, 12, 14],
    accentUnits: [0, 6, 12],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: {
      title: "Ngoma Traditions of East Africa",
      type: "academic",
    },
  },
  southafrica_gumboot: {
    id: "southafrica-gumboot",
    name: "Gumboot Dance",
    tradition: "South African mine-worker boot percussion",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [100, 130],
    instruments: ["Boot Slaps", "Hand Claps"],
    hitUnits: [0, 2, 4, 8, 10, 12],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "djembe",
    confidence: "high",
    classification: "documented",
    tags: ["binary", "dance-driven", "call-response", "ensemble"],
    source: {
      title: "Gumboot Dance: Isicathulo",
      type: "field",
    },
  },
};

const REGIONAL_TEMPLATES: Record<RegionalGroupId, RhythmTemplate> = {
  west_africa_timeline: {
    id: "regional-west-africa-timeline",
    name: "West African Timeline",
    tradition: "Shared West African bell-and-drum pulse",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [88, 128],
    instruments: ["Djembe", "Dunun Bell"],
    hitUnits: [0, 3, 6, 8, 10],
    accentUnits: [0, 6],
    timbreProfile: "djembe",
    confidence: "medium",
    classification: "regional",
    tags: ["compound", "12-beat-cycle", "polyrhythm", "call-response", "hand-percussion"],
    source: { title: "African Rhythms and Calls", type: "pdf" },
  },
  east_africa_ngoma: {
    id: "regional-east-africa-ngoma",
    name: "East African Ngoma Pulse",
    tradition: "Shared East African communal drum-dance pattern",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [90, 130],
    instruments: ["Ngoma Drum", "Kayamba"],
    hitUnits: [0, 4, 6, 8, 12, 14],
    accentUnits: [0, 6, 12],
    timbreProfile: "djembe",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "call-response", "hand-percussion", "ensemble"],
    source: { title: "Ngoma Traditions of East Africa", type: "academic" },
  },
  central_africa_polyrhythm: {
    id: "regional-central-africa-polyrhythm",
    name: "Central African Polyrhythm",
    tradition: "Shared Central African interlocking drum pattern",
    meter: "12/8",
    subdivision: [3, 3, 3, 3],
    cycleLength: 12,
    bpmRange: [100, 140],
    instruments: ["Log Drum", "Hand Drum"],
    hitUnits: [0, 2, 3, 5, 6, 8, 9, 11],
    accentUnits: [0, 3, 6, 9],
    timbreProfile: "djembe",
    confidence: "medium",
    classification: "regional",
    tags: ["compound", "12-beat-cycle", "polyrhythm", "ensemble", "hand-percussion"],
    source: { title: "Central African Drum Ensembles", type: "academic" },
  },
  southern_africa_pulse: {
    id: "regional-southern-africa-pulse",
    name: "Southern African Pulse",
    tradition: "Shared Southern African communal dance beat",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [96, 130],
    instruments: ["Drum", "Hand Claps"],
    hitUnits: [0, 2, 4, 8, 10, 12],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "djembe",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "call-response", "ensemble"],
    source: { title: "Southern African Rhythmic Traditions", type: "academic" },
  },
  north_africa_maqsum: {
    id: "regional-north-africa-maqsum",
    name: "North African Maqsum",
    tradition: "Shared North African/Arab percussion groove",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [84, 122],
    instruments: ["Darbuka", "Riq"],
    hitUnits: [0, 3, 8, 10, 12],
    accentUnits: [0, 8],
    timbreProfile: "darbuka",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "cycle-based", "dance-driven", "hand-percussion"],
    source: { title: "Arab percussion field reference", type: "field" },
  },
  balkan_seven: {
    id: "regional-balkan-seven",
    name: "Balkan Seven",
    tradition: "Shared Balkan additive dance pulse",
    meter: "7/8",
    subdivision: [2, 2, 3],
    cycleLength: 7,
    bpmRange: [92, 138],
    instruments: ["Tupan", "Hand Drum"],
    hitUnits: [0, 2, 4],
    accentUnits: [0, 2, 4],
    timbreProfile: "tupan",
    confidence: "medium",
    classification: "regional",
    tags: ["asymmetric", "dance-driven", "hand-percussion"],
    source: { title: "Balkan Rhythms Overview", type: "academic" },
  },
  middle_east_maqsum: {
    id: "regional-middle-east-maqsum",
    name: "Maqsum",
    tradition: "Shared Arab percussion groove",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [84, 122],
    instruments: ["Darbuka", "Riq"],
    hitUnits: [0, 3, 8, 10, 12],
    accentUnits: [0, 8],
    timbreProfile: "darbuka",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "cycle-based", "dance-driven", "hand-percussion"],
    source: { title: "Arab percussion field reference", type: "field" },
  },
  south_asia_tala: {
    id: "regional-south-asia-tala",
    name: "South Asian Tala Pulse",
    tradition: "Shared tala-based pulse organization",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [72, 126],
    instruments: ["Tabla", "Hand Drum"],
    hitUnits: [0, 4, 8, 12],
    accentUnits: [0, 8],
    timbreProfile: "tabla",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "cycle-based", "improvisational", "hand-percussion"],
    source: { title: "Indian Rhythms and Odd Meters", type: "academic" },
  },
  southeast_asia_gamelan: {
    id: "regional-southeast-asia-gamelan",
    name: "Southeast Asian Colotomic Pulse",
    tradition: "Shared gong-cycle rhythmic organization",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [76, 120],
    instruments: ["Gong", "Kendang"],
    hitUnits: [0, 4, 8, 12, 14],
    accentUnits: [0, 8],
    timbreProfile: "log drum",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "cycle-based", "ensemble"],
    source: { title: "Gamelan and Gong Cycles", type: "academic" },
  },
  east_asia_pulse: {
    id: "regional-east-asia-pulse",
    name: "East Asian Ensemble Pulse",
    tradition: "Shared East Asian percussion ensemble pattern",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [80, 130],
    instruments: ["Drum", "Gong"],
    hitUnits: [0, 4, 8, 12, 14],
    accentUnits: [0, 8, 12],
    timbreProfile: "taiko",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "ensemble", "call-response"],
    source: { title: "East Asian Percussion Overview", type: "academic" },
  },
  central_asia_pulse: {
    id: "regional-central-asia-pulse",
    name: "Central Asian Pulse",
    tradition: "Shared Central Asian dance rhythm",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [88, 130],
    instruments: ["Doira", "Daf"],
    hitUnits: [0, 3, 4, 8, 10, 12],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "darbuka",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "hand-percussion"],
    source: { title: "Central Asian Drum Traditions", type: "field" },
  },
  caribbean_clave: {
    id: "regional-caribbean-clave",
    name: "Caribbean Clave Pulse",
    tradition: "Shared Afro-Caribbean clave-derived pulse",
    meter: "4/4",
    subdivision: [4, 4, 4, 4, 4, 4, 4, 4],
    cycleLength: 32,
    bpmRange: [86, 124],
    instruments: ["Clave", "Conga"],
    hitUnits: [0, 6, 12, 20, 24],
    accentUnits: [0, 12, 20, 24],
    timbreProfile: "conga/clave",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "clave-based", "dance-driven", "hand-percussion"],
    source: { title: "Claves in the Caribbean", type: "pdf" },
  },
  central_america_marimba: {
    id: "regional-central-america-marimba",
    name: "Central American Marimba Pulse",
    tradition: "Shared Central American marimba-driven dance rhythm",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [100, 140],
    instruments: ["Marimba", "Drum"],
    hitUnits: [0, 2, 4, 6, 8, 10, 12, 14],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "log drum",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "ensemble"],
    source: { title: "Central American Marimba Traditions", type: "field" },
  },
  andean_huayno: {
    id: "regional-andean-huayno",
    name: "Andean Huayno Pulse",
    tradition: "Shared Andean dance rhythm with hemiola feel",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [90, 130],
    instruments: ["Bombo", "Charango"],
    hitUnits: [0, 3, 4, 7, 8, 12, 14],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "neutral kit",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "hand-percussion"],
    source: { title: "Andean Music and Dance", type: "field" },
  },
  northern_europe_march: {
    id: "regional-northern-europe-march",
    name: "Northern European March",
    tradition: "Shared Northern European march and folk pulse",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [100, 130],
    instruments: ["Snare", "Bass Drum"],
    hitUnits: [0, 4, 8, 12],
    accentUnits: [0, 8],
    timbreProfile: "neutral kit",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "drum-kit-adapted"],
    source: { title: "European Folk Rhythm Traditions", type: "academic" },
  },
  western_europe_waltz: {
    id: "regional-western-europe-waltz",
    name: "Western European Waltz",
    tradition: "Shared Western European triple-meter dance pulse",
    meter: "3/4",
    subdivision: [4, 4, 4],
    cycleLength: 12,
    bpmRange: [88, 140],
    instruments: ["Snare", "Bass Drum"],
    hitUnits: [0, 4, 8],
    accentUnits: [0],
    timbreProfile: "neutral kit",
    confidence: "medium",
    classification: "regional",
    tags: ["ternary", "dance-driven", "drum-kit-adapted"],
    source: { title: "European Dance Forms", type: "academic" },
  },
  southern_europe_compound: {
    id: "regional-southern-europe-compound",
    name: "Southern European Compound",
    tradition: "Shared Mediterranean compound-meter dance pulse",
    meter: "6/8",
    subdivision: [3, 3],
    cycleLength: 6,
    bpmRange: [90, 140],
    instruments: ["Tambourine", "Hand Drum"],
    hitUnits: [0, 1, 3, 4],
    accentUnits: [0, 3],
    timbreProfile: "darbuka",
    confidence: "medium",
    classification: "regional",
    tags: ["compound", "dance-driven", "hand-percussion"],
    source: { title: "Mediterranean Rhythm Traditions", type: "academic" },
  },
  eastern_europe_dance: {
    id: "regional-eastern-europe-dance",
    name: "Eastern European Dance Pulse",
    tradition: "Shared Eastern European folk dance rhythm",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [96, 140],
    instruments: ["Drum", "Tambourine"],
    hitUnits: [0, 2, 4, 8, 10, 12],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "neutral kit",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven"],
    source: { title: "Eastern European Folk Music", type: "academic" },
  },
  oceania_log_drum: {
    id: "regional-oceania-log-drum",
    name: "Pacific Log Drum Pulse",
    tradition: "Shared Pacific Island log drum and slit drum pattern",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [80, 120],
    instruments: ["Log Drum", "Hand Claps"],
    hitUnits: [0, 3, 4, 8, 10, 12],
    accentUnits: [0, 4, 8, 12],
    timbreProfile: "log drum",
    confidence: "medium",
    classification: "regional",
    tags: ["binary", "dance-driven", "call-response", "ensemble"],
    source: { title: "Pacific Island Percussion", type: "field" },
  },
};

const DOCUMENTED_COUNTRY_MAP: Record<string, keyof typeof DOCUMENTED_TEMPLATES> = {
  Argentina: "argentina_chacarera",
  Brazil: "brazil_samba_de_roda",
  Bulgaria: "bulgaria_rachenitsa",
  Cameroon: "cameroon_bikutsi",
  "Congo (Brazzaville)": "congo_soukous",
  "Democratic Republic of the Congo": "congo_soukous",
  Cuba: "cuba_son_clave",
  Ethiopia: "ethiopia_eskista",
  Ghana: "ghana_kpanlogo",
  Guinea: "guinea_kuku",
  India: "india_teentaal",
  Japan: "japan_matsuri_bayashi",
  Mali: "mali_foli",
  Nigeria: "nigeria_timeline_six",
  Peru: "peru_festejo",
  Senegal: "senegal_sabar",
  "South Africa": "southafrica_gumboot",
  Spain: "spain_buleria",
  Tanzania: "tanzania_ngoma",
  Uruguay: "uruguay_candombe",
};

const REGIONAL_COUNTRY_MAP: Partial<Record<string, RegionalGroupId>> = {
  // ── Africa ──────────────────────────────────────────────
  // North Africa
  Algeria: "north_africa_maqsum",
  Egypt: "north_africa_maqsum",
  Libya: "north_africa_maqsum",
  Morocco: "north_africa_maqsum",
  Tunisia: "north_africa_maqsum",
  Sudan: "north_africa_maqsum",
  // West Africa
  Benin: "west_africa_timeline",
  "Burkina Faso": "west_africa_timeline",
  "Cabo Verde": "west_africa_timeline",
  "Cote d'Ivoire": "west_africa_timeline",
  Gambia: "west_africa_timeline",
  "Guinea-Bissau": "west_africa_timeline",
  Liberia: "west_africa_timeline",
  Mauritania: "west_africa_timeline",
  Niger: "west_africa_timeline",
  "Sierra Leone": "west_africa_timeline",
  Togo: "west_africa_timeline",
  // East Africa
  Burundi: "east_africa_ngoma",
  Comoros: "east_africa_ngoma",
  Djibouti: "east_africa_ngoma",
  Eritrea: "east_africa_ngoma",
  Kenya: "east_africa_ngoma",
  Madagascar: "east_africa_ngoma",
  Rwanda: "east_africa_ngoma",
  Somalia: "east_africa_ngoma",
  "South Sudan": "east_africa_ngoma",
  Uganda: "east_africa_ngoma",
  // Central Africa
  "Central African Republic": "central_africa_polyrhythm",
  Chad: "central_africa_polyrhythm",
  "Congo (Republic)": "central_africa_polyrhythm",
  "Congo (Democratic Republic)": "central_africa_polyrhythm",
  "Equatorial Guinea": "central_africa_polyrhythm",
  Gabon: "central_africa_polyrhythm",
  "Sao Tome and Principe": "central_africa_polyrhythm",
  // Southern Africa
  Angola: "southern_africa_pulse",
  Botswana: "southern_africa_pulse",
  Eswatini: "southern_africa_pulse",
  Lesotho: "southern_africa_pulse",
  Malawi: "southern_africa_pulse",
  Mauritius: "southern_africa_pulse",
  Mozambique: "southern_africa_pulse",
  Namibia: "southern_africa_pulse",
  Seychelles: "southern_africa_pulse",
  Zambia: "southern_africa_pulse",
  Zimbabwe: "southern_africa_pulse",

  // ── Europe ──────────────────────────────────────────────
  // Balkans
  "Bosnia and Herzegovina": "balkan_seven",
  Croatia: "balkan_seven",
  Greece: "balkan_seven",
  Montenegro: "balkan_seven",
  "North Macedonia": "balkan_seven",
  Romania: "balkan_seven",
  Serbia: "balkan_seven",
  Slovenia: "balkan_seven",
  Albania: "balkan_seven",
  // Northern Europe
  Denmark: "northern_europe_march",
  Estonia: "northern_europe_march",
  Finland: "northern_europe_march",
  Iceland: "northern_europe_march",
  Ireland: "northern_europe_march",
  Latvia: "northern_europe_march",
  Lithuania: "northern_europe_march",
  Norway: "northern_europe_march",
  Sweden: "northern_europe_march",
  "United Kingdom": "northern_europe_march",
  // Western Europe
  Austria: "western_europe_waltz",
  Belgium: "western_europe_waltz",
  France: "western_europe_waltz",
  Germany: "western_europe_waltz",
  Liechtenstein: "western_europe_waltz",
  Luxembourg: "western_europe_waltz",
  Monaco: "western_europe_waltz",
  Netherlands: "western_europe_waltz",
  Switzerland: "western_europe_waltz",
  // Southern Europe
  Andorra: "southern_europe_compound",
  Cyprus: "southern_europe_compound",
  Italy: "southern_europe_compound",
  Malta: "southern_europe_compound",
  Portugal: "southern_europe_compound",
  "San Marino": "southern_europe_compound",
  "Vatican City": "southern_europe_compound",
  // Eastern Europe
  Belarus: "eastern_europe_dance",
  Czechia: "eastern_europe_dance",
  Hungary: "eastern_europe_dance",
  Moldova: "eastern_europe_dance",
  Poland: "eastern_europe_dance",
  Russia: "eastern_europe_dance",
  Slovakia: "eastern_europe_dance",
  Ukraine: "eastern_europe_dance",

  // ── Asia ────────────────────────────────────────────────
  // Middle East
  Bahrain: "middle_east_maqsum",
  Iraq: "middle_east_maqsum",
  Israel: "middle_east_maqsum",
  Jordan: "middle_east_maqsum",
  Kuwait: "middle_east_maqsum",
  Lebanon: "middle_east_maqsum",
  Oman: "middle_east_maqsum",
  Palestine: "middle_east_maqsum",
  Qatar: "middle_east_maqsum",
  "Saudi Arabia": "middle_east_maqsum",
  Syria: "middle_east_maqsum",
  "United Arab Emirates": "middle_east_maqsum",
  Yemen: "middle_east_maqsum",
  Turkey: "middle_east_maqsum",
  Iran: "middle_east_maqsum",
  // South Asia
  Afghanistan: "south_asia_tala",
  Bangladesh: "south_asia_tala",
  Bhutan: "south_asia_tala",
  Maldives: "south_asia_tala",
  Nepal: "south_asia_tala",
  Pakistan: "south_asia_tala",
  "Sri Lanka": "south_asia_tala",
  // Southeast Asia
  Brunei: "southeast_asia_gamelan",
  Cambodia: "southeast_asia_gamelan",
  Indonesia: "southeast_asia_gamelan",
  Laos: "southeast_asia_gamelan",
  Malaysia: "southeast_asia_gamelan",
  Myanmar: "southeast_asia_gamelan",
  Philippines: "southeast_asia_gamelan",
  Singapore: "southeast_asia_gamelan",
  Thailand: "southeast_asia_gamelan",
  "Timor-Leste": "southeast_asia_gamelan",
  Vietnam: "southeast_asia_gamelan",
  // East Asia
  China: "east_asia_pulse",
  Mongolia: "east_asia_pulse",
  "North Korea": "east_asia_pulse",
  "South Korea": "east_asia_pulse",
  // Central Asia / Caucasus
  Armenia: "central_asia_pulse",
  Azerbaijan: "central_asia_pulse",
  Georgia: "central_asia_pulse",
  Kazakhstan: "central_asia_pulse",
  Kyrgyzstan: "central_asia_pulse",
  Tajikistan: "central_asia_pulse",
  Turkmenistan: "central_asia_pulse",
  Uzbekistan: "central_asia_pulse",

  // ── North America ───────────────────────────────────────
  // Caribbean
  "Antigua and Barbuda": "caribbean_clave",
  Bahamas: "caribbean_clave",
  Barbados: "caribbean_clave",
  Dominica: "caribbean_clave",
  "Dominican Republic": "caribbean_clave",
  Grenada: "caribbean_clave",
  Haiti: "caribbean_clave",
  Jamaica: "caribbean_clave",
  "Saint Kitts and Nevis": "caribbean_clave",
  "Saint Lucia": "caribbean_clave",
  "Saint Vincent and the Grenadines": "caribbean_clave",
  "Trinidad and Tobago": "caribbean_clave",
  // Central America
  Belize: "central_america_marimba",
  "Costa Rica": "central_america_marimba",
  "El Salvador": "central_america_marimba",
  Guatemala: "central_america_marimba",
  Honduras: "central_america_marimba",
  Nicaragua: "central_america_marimba",
  Panama: "central_america_marimba",
  // North America proper
  Canada: "northern_europe_march",
  Mexico: "caribbean_clave",
  "United States": "caribbean_clave",

  // ── South America ───────────────────────────────────────
  Bolivia: "andean_huayno",
  Chile: "andean_huayno",
  Colombia: "caribbean_clave",
  Ecuador: "andean_huayno",
  Guyana: "caribbean_clave",
  Paraguay: "andean_huayno",
  Suriname: "caribbean_clave",
  Venezuela: "caribbean_clave",

  // ── Oceania ─────────────────────────────────────────────
  Australia: "oceania_log_drum",
  Fiji: "oceania_log_drum",
  Kiribati: "oceania_log_drum",
  "Marshall Islands": "oceania_log_drum",
  Micronesia: "oceania_log_drum",
  Nauru: "oceania_log_drum",
  "New Zealand": "oceania_log_drum",
  Palau: "oceania_log_drum",
  "Papua New Guinea": "oceania_log_drum",
  Samoa: "oceania_log_drum",
  "Solomon Islands": "oceania_log_drum",
  Tonga: "oceania_log_drum",
  Tuvalu: "oceania_log_drum",
  Vanuatu: "oceania_log_drum",
};

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function midpoint([minimum, maximum]: [number, number]) {
  return Math.round((minimum + maximum) / 2);
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function parseMeter(meter: string): [number, number] | null {
  const [numeratorText, denominatorText] = meter.split("/");
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator <= 0 || denominator <= 0) {
    return null;
  }

  return [numerator, denominator];
}

function normalizeUnitPositions(unitPositions: number[], cycleLength: number): number[] {
  return unique(
    unitPositions.map((unit) => {
      const normalized = Math.floor((unit / cycleLength) * 32);
      return Math.max(0, Math.min(31, normalized));
    }),
  ).sort((left, right) => left - right);
}

function buildMidiPattern(hitUnits: number[], cycleLength: number): number[] {
  const midiPattern = new Array(32).fill(0);

  normalizeUnitPositions(hitUnits, cycleLength).forEach((index) => {
    midiPattern[index] = 1;
  });

  return midiPattern;
}

function buildAccentPattern(accentUnits: number[], cycleLength: number): number[] {
  const accents = new Array(32).fill(0);

  normalizeUnitPositions(accentUnits, cycleLength).forEach((index) => {
    accents[index] = 1;
  });

  return accents;
}

function getTimbreProfile(country: string, region: string, continent: RhythmContinent): string {
  if (country === "Cuba" || region === "Caribbean") {
    return "conga/clave";
  }

  if (country === "Brazil") {
    return "surdo";
  }

  if (country === "Spain") {
    return "cajón";
  }

  if (region === "Balkans") {
    return "tupan";
  }

  if (country === "India" || region === "South Asia") {
    return "tabla";
  }

  if (
    region === "Middle East"
    || region === "Arabian Peninsula"
    || region === "North Africa"
    || region === "Eastern Mediterranean"
    || region === "Anatolia"
  ) {
    return "darbuka";
  }

  if (region === "East Asia") {
    return "taiko";
  }

  if (continent === "Oceania") {
    return "log drum";
  }

  if (continent === "Africa") {
    return "djembe";
  }

  return "neutral kit";
}

function buildProxyTemplate(country: string, region: string, continent: RhythmContinent): RhythmTemplate {
  const timbreProfile = getTimbreProfile(country, region, continent);

  return {
    id: `proxy-${country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: "Global 4/4 Fallback",
    tradition: "Neutral proxy pulse",
    meter: "4/4",
    subdivision: [4, 4, 4, 4],
    cycleLength: 16,
    bpmRange: [80, 120],
    instruments: TIMBRE_INSTRUMENTS[timbreProfile] || TIMBRE_INSTRUMENTS["neutral kit"],
    hitUnits: [0, 4, 8, 12],
    accentUnits: [0, 8],
    timbreProfile,
    confidence: "low",
    classification: "proxy",
    source: {
      title: "Atlas neutral 4/4 fallback",
      type: "midi",
    },
  };
}

function inferTags(template: RhythmTemplate, metadata: CountryMetadata): RhythmTag[] {
  if (template.tags && template.tags.length > 0) {
    return [...template.tags];
  }

  const tags: RhythmTag[] = [];
  const uniqueGroups = new Set(template.subdivision);

  // Structure tags
  if (uniqueGroups.size > 1) {
    tags.push("asymmetric");
  }
  if (template.subdivision.every((g) => g === 3)) {
    tags.push("ternary");
  } else if (template.subdivision.every((g) => g === 2 || g === 4)) {
    tags.push("binary");
  }
  if (template.meter === "12/8" || template.meter === "6/8") {
    tags.push("compound");
  }
  if (template.cycleLength === 12 && template.meter === "12/8") {
    tags.push("12-beat-cycle");
  }

  // Rhythmic concept tags
  if (metadata.continent === "Africa" || template.timbreProfile === "djembe") {
    tags.push("polyrhythm");
  }
  if (template.timbreProfile === "conga/clave" || template.tradition.toLowerCase().includes("clave")) {
    tags.push("clave-based");
  }
  if (template.timbreProfile === "tabla" || template.tradition.toLowerCase().includes("tala")) {
    tags.push("cycle-based");
  }

  // Performance tags
  if (template.tradition.toLowerCase().includes("dance") || template.tradition.toLowerCase().includes("compás") || template.tradition.toLowerCase().includes("compas")) {
    tags.push("dance-driven");
  }
  if (template.tradition.toLowerCase().includes("call") || metadata.continent === "Africa") {
    tags.push("call-response");
  }

  // Instrumentation tags
  const handPercussion = ["djembe", "tabla", "darbuka", "cajón", "conga/clave"];
  if (handPercussion.includes(template.timbreProfile)) {
    tags.push("hand-percussion");
  }
  if (template.instruments.length >= 3) {
    tags.push("ensemble");
  }
  if (template.timbreProfile === "neutral kit") {
    tags.push("drum-kit-adapted");
  }

  return tags.length > 0 ? tags : ["binary"];
}

function hydrateTemplate(template: RhythmTemplate, metadata: CountryMetadata): Rhythm {
  const timbreProfile = template.classification === "proxy"
    ? getTimbreProfile(metadata.country, metadata.region, metadata.continent)
    : template.timbreProfile;

  return {
    id: `${template.id}-${metadata.country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: template.name,
    country: metadata.country,
    region: metadata.region,
    continent: metadata.continent,
    tradition: template.tradition,
    meter: template.meter,
    subdivision: [...template.subdivision],
    cycleLength: template.cycleLength,
    bpmRange: [...template.bpmRange],
    instruments: template.classification === "proxy"
      ? TIMBRE_INSTRUMENTS[timbreProfile] || [...template.instruments]
      : [...template.instruments],
    midiPattern: buildMidiPattern(template.hitUnits, template.cycleLength),
    accents: buildAccentPattern(template.accentUnits, template.cycleLength),
    timbreProfile,
    confidence: template.classification === "proxy" ? "low" : template.confidence,
    classification: template.classification,
    tags: inferTags(template, metadata),
    source: { ...template.source },
  };
}

export function validateRhythm(rhythm: Rhythm): string[] {
  const errors: string[] = [];
  const parsedMeter = parseMeter(rhythm.meter);
  const subdivisionTotal = sum(rhythm.subdivision);

  if (!parsedMeter) {
    errors.push(`${rhythm.country}: invalid meter "${rhythm.meter}"`);
  } else {
    const [numerator] = parsedMeter;
    const allowedBaseTotals = unique([numerator, numerator * 2, numerator * 4]);
    const subdivisionMatchesMeter = allowedBaseTotals.some((total) => subdivisionTotal % total === 0);

    if (!subdivisionMatchesMeter) {
      errors.push(`${rhythm.country}: subdivision does not align with ${rhythm.meter}`);
    }
  }

  if (rhythm.cycleLength !== subdivisionTotal) {
    errors.push(`${rhythm.country}: cycleLength must match subdivision total`);
  }

  if (rhythm.bpmRange[0] < 40 || rhythm.bpmRange[1] > 220 || rhythm.bpmRange[0] > rhythm.bpmRange[1]) {
    errors.push(`${rhythm.country}: bpm range is not realistic`);
  }

  if (!rhythm.classification) {
    errors.push(`${rhythm.country}: missing classification`);
  }

  if (!rhythm.confidence) {
    errors.push(`${rhythm.country}: missing confidence`);
  }

  if (rhythm.midiPattern.length !== 32 || rhythm.accents.length !== 32) {
    errors.push(`${rhythm.country}: atlas patterns must be normalized to 32 steps`);
  }

  if (!rhythm.instruments.length) {
    errors.push(`${rhythm.country}: at least one instrument is required`);
  }

  if (!rhythm.source.title) {
    errors.push(`${rhythm.country}: source title is required`);
  }

  if (!rhythm.tags || rhythm.tags.length === 0) {
    errors.push(`${rhythm.country}: at least one tag is required`);
  }

  return errors;
}

function resolveTemplate(metadata: CountryMetadata): RhythmTemplate {
  const documentedTemplateId = DOCUMENTED_COUNTRY_MAP[metadata.country];

  if (documentedTemplateId) {
    return DOCUMENTED_TEMPLATES[documentedTemplateId];
  }

  const regionalTemplateId = REGIONAL_COUNTRY_MAP[metadata.country];

  if (regionalTemplateId) {
    return REGIONAL_TEMPLATES[regionalTemplateId];
  }

  return buildProxyTemplate(metadata.country, metadata.region, metadata.continent);
}

export function getAtlasRhythmByCountry(country: string): Rhythm | undefined {
  return GLOBAL_RHYTHM_ATLAS.find((rhythm) => rhythm.country === country);
}

export function getPlaybackVelocityPattern(rhythm: Rhythm): number[] {
  return rhythm.midiPattern.map((hit, index) => {
    if (!hit) {
      return 0;
    }

    return rhythm.accents[index] ? 118 : 84;
  });
}

export function getRhythmStepBoundaries(rhythm: Rhythm): number[] {
  const boundaries = [0];
  const totalUnits = sum(rhythm.subdivision);
  let runningTotal = 0;

  rhythm.subdivision.forEach((group) => {
    runningTotal += group;
    const stepIndex = Math.min(31, Math.floor((runningTotal / totalUnits) * 32));

    if (!boundaries.includes(stepIndex)) {
      boundaries.push(stepIndex);
    }
  });

  return boundaries.sort((left, right) => left - right);
}

export function filterAtlasRhythms(filters: {
  country?: string;
  continent?: RhythmContinent | "All";
  meter?: string | "All";
  tag?: RhythmTag | "All";
} = {}): Rhythm[] {
  return GLOBAL_RHYTHM_ATLAS.filter((rhythm) => {
    if (filters.country && rhythm.country !== filters.country) {
      return false;
    }

    if (filters.continent && filters.continent !== "All" && rhythm.continent !== filters.continent) {
      return false;
    }

    if (filters.meter && filters.meter !== "All" && rhythm.meter !== filters.meter) {
      return false;
    }

    if (filters.tag && filters.tag !== "All" && !rhythm.tags.includes(filters.tag)) {
      return false;
    }

    return true;
  });
}

export function filterByContinent(rhythms: Rhythm[], selectedContinent?: RhythmContinent | "All"): Rhythm[] {
  if (!selectedContinent || selectedContinent === "All") return rhythms;
  return rhythms.filter((r) => r.continent === selectedContinent);
}

export function filterByTag(rhythms: Rhythm[], tag?: RhythmTag | "All"): Rhythm[] {
  if (!tag || tag === "All") return rhythms;
  return rhythms.filter((r) => r.tags.includes(tag));
}

export const GLOBAL_RHYTHM_ATLAS: Rhythm[] = COUNTRY_METADATA.map((metadata) =>
  hydrateTemplate(resolveTemplate(metadata), metadata),
);

export const GLOBAL_RHYTHM_METERS = unique(GLOBAL_RHYTHM_ATLAS.map((rhythm) => rhythm.meter)).sort();
export const GLOBAL_RHYTHM_CONTINENTS = unique(GLOBAL_RHYTHM_ATLAS.map((rhythm) => rhythm.continent)).sort() as RhythmContinent[];
export const GLOBAL_RHYTHM_TAGS = unique(GLOBAL_RHYTHM_ATLAS.flatMap((rhythm) => rhythm.tags)).sort() as RhythmTag[];

// Indexed lookups for performance
export const ATLAS_BY_CONTINENT = new Map<RhythmContinent, Rhythm[]>();
GLOBAL_RHYTHM_ATLAS.forEach((rhythm) => {
  const list = ATLAS_BY_CONTINENT.get(rhythm.continent) || [];
  list.push(rhythm);
  ATLAS_BY_CONTINENT.set(rhythm.continent, list);
});

export const ATLAS_BY_TAG = new Map<RhythmTag, Rhythm[]>();
GLOBAL_RHYTHM_ATLAS.forEach((rhythm) => {
  rhythm.tags.forEach((tag) => {
    const list = ATLAS_BY_TAG.get(tag) || [];
    list.push(rhythm);
    ATLAS_BY_TAG.set(tag, list);
  });
});

export function validateGlobalRhythmAtlas(): string[] {
  const errors: string[] = [];
  const atlasCountries = GLOBAL_RHYTHM_ATLAS.map((rhythm) => rhythm.country);
  const uniqueCountries = new Set(atlasCountries);

  if (CANONICAL_COUNTRY_LIST.length !== 195) {
    errors.push(`Canonical country list contains ${CANONICAL_COUNTRY_LIST.length} entries instead of 195`);
  }

  if (COUNTRY_METADATA.length !== CANONICAL_COUNTRY_LIST.length) {
    errors.push(`Country metadata contains ${COUNTRY_METADATA.length} entries instead of ${CANONICAL_COUNTRY_LIST.length}`);
  }

  CANONICAL_COUNTRY_LIST.forEach((country) => {
    if (!uniqueCountries.has(country)) {
      errors.push(`Missing atlas rhythm for ${country}`);
    }
  });

  GLOBAL_RHYTHM_ATLAS.forEach((rhythm) => {
    errors.push(...validateRhythm(rhythm));
  });

  return errors;
}

export function getAtlasSummary(rhythm: Rhythm) {
  return {
    bpm: midpoint(rhythm.bpmRange),
    velocityPattern: getPlaybackVelocityPattern(rhythm),
    boundaries: getRhythmStepBoundaries(rhythm),
  };
}
