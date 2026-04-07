import type { Region } from "./rhythmData";

export type ResearchRegion = Region | "fundamentals";

export interface RhythmLessonMaterial {
  id: string;
  title: string;
  region: ResearchRegion;
  country?: string;
  materialType: "docx" | "pdf";
  fileName: string;
  path: string;
  summary: string;
  topics: string[];
  relatedPatternIds: string[];
}

export interface RhythmReferenceSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  region: ResearchRegion;
  country?: string;
  summary: string;
  relatedPatternIds: string[];
}

const MATERIAL_ROOT = "/Users/zacharyscheffler/Downloads/Cross Cultural Rhythm/research/materials";

function materialPath(fileName: string) {
  return `${MATERIAL_ROOT}/${fileName}`;
}

export const RHYTHM_LESSONS: RhythmLessonMaterial[] = [
  {
    id: "lesson_afroperuvian_overview",
    title: "Afro-Peruvian Rhythms Overview",
    region: "afro_peruvian",
    country: "Peru",
    materialType: "docx",
    fileName: "AFROPERUVIAN-1.docx",
    path: materialPath("AFROPERUVIAN-1.docx"),
    summary: "Course overview covering Afro-Peruvian history, instruments, and the core genres Marinera, Lando, and Festejo.",
    topics: ["history", "cajon", "cajita", "quijada", "marinera", "lando", "festejo"],
    relatedPatternIds: [
      "afro_peruvian_marinera_limenia",
      "afro_peruvian_marinera_nortena",
      "afro_peruvian_festejo",
      "afro_peruvian_lando",
    ],
  },
  {
    id: "lesson_african_calls",
    title: "African Rhythms and Calls",
    region: "west_africa",
    country: "Ghana",
    materialType: "pdf",
    fileName: "African Rhythms & calls.pdf",
    path: materialPath("African Rhythms & calls.pdf"),
    summary: "Notation packet focused on African bell timelines, layered calls, and 12/8 coordination.",
    topics: ["12/8", "calls", "bell-pattern", "ostinato", "polyrhythm"],
    relatedPatternIds: [
      "west_africa_kuku",
      "west_africa_soli",
      "west_africa_foli",
      "west_africa_timeline_in_six",
    ],
  },
  {
    id: "lesson_african_overview",
    title: "African Rhythms Overview",
    region: "west_africa",
    country: "Ghana",
    materialType: "docx",
    fileName: "African rhythms 2024.docx",
    path: materialPath("African rhythms 2024.docx"),
    summary: "Course overview on African rhythmic structure, call-and-response, repetition, and interlocking parts.",
    topics: ["history", "call-and-response", "polyrhythm", "timeline", "interlocking"],
    relatedPatternIds: [
      "west_africa_kuku",
      "west_africa_kpanlogo",
      "west_africa_soli",
      "west_africa_foli",
      "west_africa_timeline_in_six",
    ],
  },
  {
    id: "lesson_afro_claves_in_six",
    title: "Afro Claves in Six",
    region: "west_africa",
    materialType: "pdf",
    fileName: "Afro claves in six.pdf",
    path: materialPath("Afro claves in six.pdf"),
    summary: "Reference notation for six-pulse clave translation and Afro-diasporic 12/8 timelines.",
    topics: ["clave-in-6", "timeline", "12/8", "cross-rhythm"],
    relatedPatternIds: ["west_africa_timeline_in_six"],
  },
  {
    id: "lesson_bombo_leguero",
    title: "Bombo Leguero Patterns",
    region: "argentina",
    country: "Argentina",
    materialType: "pdf",
    fileName: "Argentina leguero.pdf",
    path: materialPath("Argentina leguero.pdf"),
    summary: "Pattern sheet for bombo leguero accompaniment in Vidala, Zamba, and Chacarera.",
    topics: ["bombo-leguero", "vidala", "zamba", "chacarera"],
    relatedPatternIds: ["argentina_vidala", "argentina_zamba", "argentina_chacarera"],
  },
  {
    id: "lesson_argentinean_rhythms_pdf",
    title: "Argentinean Rhythms Notation",
    region: "argentina",
    country: "Argentina",
    materialType: "pdf",
    fileName: "Argentinean rhythms.pdf",
    path: materialPath("Argentinean rhythms.pdf"),
    summary: "Notation packet for bombo leguero phrasing across core Argentine folk styles.",
    topics: ["bombo-leguero", "vidala", "zamba", "chacarera"],
    relatedPatternIds: ["argentina_vidala", "argentina_zamba", "argentina_chacarera", "argentina_malambo"],
  },
  {
    id: "lesson_balkan_overview",
    title: "Balkan Rhythms Overview",
    region: "balkans",
    country: "Bulgaria",
    materialType: "docx",
    fileName: "BALKAN RHYTHMS 2024.docx",
    path: materialPath("BALKAN RHYTHMS 2024.docx"),
    summary: "Survey of Balkan dance meters covering simple, compound, and combined groupings from 5/8 to 15/8.",
    topics: ["odd-meter", "dance", "5/8", "7/8", "9/8", "11/8", "13/8", "15/8"],
    relatedPatternIds: [
      "balkans_paidushko",
      "balkans_ruchenitsa",
      "balkans_lesnoto",
      "balkans_daychovo",
      "balkans_cocek",
      "balkans_kopanitsa",
      "balkans_buchimish",
    ],
  },
  {
    id: "lesson_bulgarian_paper",
    title: "Bulgarian Rhythms Research Paper",
    region: "balkans",
    country: "Bulgaria",
    materialType: "pdf",
    fileName: "Bulgarian Rhythms - Past, Present And Future .pdf",
    path: materialPath("Bulgarian Rhythms - Past, Present And Future .pdf"),
    summary: "Research article on Bulgarian rhythmic practice and its implications for performers.",
    topics: ["bulgaria", "odd-meter", "analysis", "performance-practice"],
    relatedPatternIds: [
      "balkans_paidushko",
      "balkans_ruchenitsa",
      "balkans_daychovo",
      "balkans_kopanitsa",
      "balkans_buchimish",
    ],
  },
  {
    id: "lesson_flamenco_overview",
    title: "Flamenco Rhythm Course Notes",
    region: "flamenco",
    country: "Spain",
    materialType: "docx",
    fileName: "CROSS CULTURAL RHYTHM _ Flamenco.docx",
    path: materialPath("CROSS CULTURAL RHYTHM _ Flamenco.docx"),
    summary: "Course packet covering flamenco compas, palos, palmas, toque, and the cajon's adoption into flamenco.",
    topics: ["compas", "palos", "palmas", "buleria", "solea", "alegria", "seguiriya", "tangos", "tanguillos"],
    relatedPatternIds: [
      "flamenco_buleria",
      "flamenco_solea",
      "flamenco_alegria",
      "flamenco_seguiriya",
      "flamenco_tangos",
      "flamenco_tanguillos",
    ],
  },
  {
    id: "lesson_caribbean_overview",
    title: "Caribbean Rhythms Overview",
    region: "afro_cuban",
    country: "Cuba",
    materialType: "docx",
    fileName: "CUBA  PUERTO RICO 2024.docx",
    path: materialPath("CUBA  PUERTO RICO 2024.docx"),
    summary: "Course packet covering Cuban clave-based styles plus Puerto Rican Bomba and Plena traditions.",
    topics: ["clave", "son", "rumba", "cha-cha", "mozambique", "bomba", "plena"],
    relatedPatternIds: [
      "afro_cuban_son_23",
      "afro_cuban_son_32",
      "afro_cuban_guaguanco",
      "afro_cuban_cha_cha_cha",
      "afro_cuban_mozambique",
      "afro_cuban_bomba_sica",
      "afro_cuban_bomba_yuba",
      "afro_cuban_plena",
    ],
  },
  {
    id: "lesson_cajon_flamenco",
    title: "Cajon Flamenco Patterns",
    region: "flamenco",
    country: "Spain",
    materialType: "pdf",
    fileName: "Cajon Flamenco 2023.pdf",
    path: materialPath("Cajon Flamenco 2023.pdf"),
    summary: "Basic cajon flamenco pattern sheet aligned with compas accents.",
    topics: ["cajon", "flamenco", "buleria", "solea", "compas"],
    relatedPatternIds: ["flamenco_buleria", "flamenco_solea", "flamenco_tangos", "flamenco_alegria"],
  },
  {
    id: "lesson_candombe_pdf",
    title: "Candombe Ensemble Parts",
    region: "uruguay",
    country: "Uruguay",
    materialType: "pdf",
    fileName: "Candombe.pdf",
    path: materialPath("Candombe.pdf"),
    summary: "Ensemble notation showing the candombe madera and drum roles used in Afro-Uruguayan performance.",
    topics: ["candombe", "madera", "llamada", "ensemble"],
    relatedPatternIds: ["uruguay_candombe_base", "uruguay_candombe_llamada", "uruguay_candombe_porton"],
  },
  {
    id: "lesson_selva_ex_1",
    title: "Chapter 1 Exercise 1",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Ch 1 Ex 1.pdf",
    path: materialPath("Ch 1 Ex 1.pdf"),
    summary: "Reading and subdivision exercise used as a foundational rhythm literacy drill.",
    topics: ["reading", "subdivision", "coordination"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_selva_ex_2",
    title: "Chapter 1 Exercise 2",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Ch 1 Ex 2.pdf",
    path: materialPath("Ch 1 Ex 2.pdf"),
    summary: "Follow-on subdivision drill for internal pulse and consistent phrasing.",
    topics: ["reading", "subdivision", "coordination"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_selva_ex_3",
    title: "Chapter 1 Exercise 3",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Ch 1 Ex 3.pdf",
    path: materialPath("Ch 1 Ex 3.pdf"),
    summary: "Voice-led rhythmic exercise focused on spoken count alignment and pulse control.",
    topics: ["voice", "counting", "coordination"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_selva_improv",
    title: "Selva Improvisation with Counts",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Ch 1 Selva Improvisation w_counts.pdf",
    path: materialPath("Ch 1 Selva Improvisation w_counts.pdf"),
    summary: "Improvisation reading exercise with explicit counts for internalizing pulse placement.",
    topics: ["improvisation", "reading", "voice", "coordination"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_claves_brasil",
    title: "Claves in South American Rhythms: Brazil",
    region: "brazil",
    country: "Brazil",
    materialType: "pdf",
    fileName: "Claves Brasil.pdf",
    path: materialPath("Claves Brasil.pdf"),
    summary: "Clave-oriented guide to Brazilian rhythmic phrasing including bossa and related syncopations.",
    topics: ["brazil", "clave", "bossa-nova", "syncopation"],
    relatedPatternIds: ["brazil_bossa_nova", "brazil_baiao", "brazil_coco", "brazil_samba_de_roda"],
  },
  {
    id: "lesson_claves_candombe",
    title: "Claves in South American Rhythms: Uruguay",
    region: "uruguay",
    country: "Uruguay",
    materialType: "pdf",
    fileName: "Claves Candombe Uruguay.pdf",
    path: materialPath("Claves Candombe Uruguay.pdf"),
    summary: "Candombe clave variants linked to the Hugo Fattoruso repertoire and son-clave transformations.",
    topics: ["candombe", "clave", "syncopation", "variations"],
    relatedPatternIds: ["uruguay_candombe_base", "uruguay_candombe_llamada", "uruguay_candombe_porton"],
  },
  {
    id: "lesson_claves_caribbean",
    title: "Claves in the Caribbean",
    region: "afro_cuban",
    country: "Cuba",
    materialType: "pdf",
    fileName: "Claves in the caribbean.pdf",
    path: materialPath("Claves in the caribbean.pdf"),
    summary: "Clave reference showing son, rumba, contra-clave, and 6/8 translations used throughout Afro-Caribbean practice.",
    topics: ["clave", "son", "rumba", "6/8", "translation"],
    relatedPatternIds: [
      "afro_cuban_son_23",
      "afro_cuban_son_32",
      "afro_cuban_guaguanco",
      "afro_cuban_cha_cha_cha",
      "afro_cuban_mozambique",
      "uruguay_candombe_base",
    ],
  },
  {
    id: "lesson_cowbell_patterns",
    title: "Cuban Cowbell Patterns and More",
    region: "afro_cuban",
    country: "Cuba",
    materialType: "pdf",
    fileName: "Cowbell patterns and more.pdf",
    path: materialPath("Cowbell patterns and more.pdf"),
    summary: "Bell-pattern reference for bongo bell, mambo, montuno, and arrangement-side awareness.",
    topics: ["cowbell", "campana", "mambo", "montuno", "clave-side"],
    relatedPatternIds: [
      "afro_cuban_son_23",
      "afro_cuban_son_32",
      "afro_cuban_cha_cha_cha",
      "afro_cuban_mozambique",
    ],
  },
  {
    id: "lesson_argentina_overview",
    title: "Cross Cultural Rhythms Argentina",
    region: "argentina",
    country: "Argentina",
    materialType: "docx",
    fileName: "Cross Cultural Rhythms Argentina.docx",
    path: materialPath("Cross Cultural Rhythms Argentina.docx"),
    summary: "Historical survey of Argentine folk traditions, bombo leguero construction, and the Vidala-Zamba-Chacarera core repertoire.",
    topics: ["history", "bombo-leguero", "vidala", "zamba", "chacarera", "malambo"],
    relatedPatternIds: ["argentina_vidala", "argentina_zamba", "argentina_chacarera", "argentina_malambo"],
  },
  {
    id: "lesson_indian_phrase_reductions",
    title: "Indian Phrasing Reductions",
    region: "india",
    country: "India",
    materialType: "pdf",
    fileName: "Indian phrasing reductions.pdf",
    path: materialPath("Indian phrasing reductions.pdf"),
    summary: "Reduction study moving phrase cells across pulse groupings for konnakol and tala phrasing.",
    topics: ["konnakol", "phrasing", "takita", "takadimi", "speed"],
    relatedPatternIds: ["india_teentaal", "india_jhaptaal", "india_adi_tala", "india_rupak"],
  },
  {
    id: "lesson_indian_overview",
    title: "Indian Rhythms and Odd Meters",
    region: "india",
    country: "India",
    materialType: "docx",
    fileName: "Indian rhythms 2024-1.docx",
    path: materialPath("Indian rhythms 2024-1.docx"),
    summary: "Course overview on tala, konnakol syllables, Adi Tala, phrase speeds, and odd-meter recitation.",
    topics: ["tala", "konnakol", "adi-tala", "jhaptaal", "rupak", "speed-change"],
    relatedPatternIds: ["india_teentaal", "india_keharwa", "india_rupak", "india_jhaptaal", "india_adi_tala"],
  },
  {
    id: "lesson_bellson_reading",
    title: "Modern Reading Text in 4/4",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Page 39 Modern reading text in 4_4 by Louie Bellson (1).pdf",
    path: materialPath("Page 39 Modern reading text in 4_4 by Louie Bellson (1).pdf"),
    summary: "Reading-page reference used for straight-meter fluency and sight-reading accuracy.",
    topics: ["4/4", "reading", "literacy"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_palmas_flamencas",
    title: "Palmas Flamencas",
    region: "flamenco",
    country: "Spain",
    materialType: "pdf",
    fileName: "Palmas Flamencas 2024-1.pdf",
    path: materialPath("Palmas Flamencas 2024-1.pdf"),
    summary: "Palmas notation covering Alegria, Tanguillos, Buleria, Solea, Seguiriya, and Tangos.",
    topics: ["palmas", "alegria", "tanguillos", "buleria", "solea", "seguiriya", "tangos"],
    relatedPatternIds: [
      "flamenco_alegria",
      "flamenco_tanguillos",
      "flamenco_buleria",
      "flamenco_solea",
      "flamenco_seguiriya",
      "flamenco_tangos",
    ],
  },
  {
    id: "lesson_peru_cajon",
    title: "Peru Cajon Grooves",
    region: "afro_peruvian",
    country: "Peru",
    materialType: "pdf",
    fileName: "Perú Cajon.pdf",
    path: materialPath("Per\u00fa Cajon.pdf"),
    summary: "Pattern sheet for Marinera limenia, Marinera nortena, Festejo, and Lando on cajon.",
    topics: ["cajon", "marinera", "festejo", "lando"],
    relatedPatternIds: [
      "afro_peruvian_marinera_limenia",
      "afro_peruvian_marinera_nortena",
      "afro_peruvian_festejo",
      "afro_peruvian_lando",
    ],
  },
  {
    id: "lesson_exercises_in_fifteen",
    title: "Rhythmic Exercises in 15",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Rhythmic Exercises in 15.pdf",
    path: materialPath("Rhythmic Exercises in 15.pdf"),
    summary: "Odd-meter coordination material rooted in African pulse organization and long-form grouping.",
    topics: ["15/8", "odd-meter", "pulse", "coordination"],
    relatedPatternIds: ["balkans_buchimish"],
  },
  {
    id: "lesson_samba_de_roda",
    title: "Samba de Roda Ensemble",
    region: "brazil",
    country: "Brazil",
    materialType: "pdf",
    fileName: "Samba de roda.pdf",
    path: materialPath("Samba de roda.pdf"),
    summary: "Ensemble sheet for samba de roda layering across palms, agogo, pandeiro, surdo, and allied parts.",
    topics: ["samba-de-roda", "ensemble", "palmas", "agogo", "surdo"],
    relatedPatternIds: ["brazil_samba_de_roda"],
  },
  {
    id: "lesson_se_abre_el_porton",
    title: "Se Abre el Porton",
    region: "uruguay",
    country: "Uruguay",
    materialType: "pdf",
    fileName: "Se-Abre-El-Porton.pdf",
    path: materialPath("Se-Abre-El-Porton.pdf"),
    summary: "Arrangement reference tied to candombe clave variants highlighted in the Uruguay materials.",
    topics: ["candombe", "arrangement", "clave-variation"],
    relatedPatternIds: ["uruguay_candombe_porton"],
  },
  {
    id: "lesson_brazilian_swing",
    title: "The Brazilian Swing",
    region: "brazil",
    country: "Brazil",
    materialType: "pdf",
    fileName: "The Brazilian swing.pdf",
    path: materialPath("The Brazilian swing.pdf"),
    summary: "Triplet-emptying and hand-to-hand studies for Brazilian forward motion and micro-timing.",
    topics: ["swing", "triplet-feel", "microtiming", "brazil"],
    relatedPatternIds: ["brazil_baiao", "brazil_xote", "brazil_coco", "brazil_samba_de_roda", "brazil_bossa_nova"],
  },
  {
    id: "lesson_triplet_reading",
    title: "Triplet Reading",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "Triplet reading.pdf",
    path: materialPath("Triplet reading.pdf"),
    summary: "Triplet-reading page for fluency between binary and ternary subdivisions.",
    topics: ["triplets", "reading", "ternary-feel"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_zabumba",
    title: "Zabumba Patterns",
    region: "brazil",
    country: "Brazil",
    materialType: "pdf",
    fileName: "Zabumba.pdf",
    path: materialPath("Zabumba.pdf"),
    summary: "Northeastern Brazil pattern sheet covering Baiao and zabumba-led groove vocabulary.",
    topics: ["zabumba", "baiao", "forro", "northeast-brazil"],
    relatedPatternIds: ["brazil_baiao", "brazil_xote"],
  },
  {
    id: "lesson_claves_in_six_refs",
    title: "Claves in Six References",
    region: "west_africa",
    materialType: "pdf",
    fileName: "claves in 6 references.pdf",
    path: materialPath("claves in 6 references.pdf"),
    summary: "Reference packet for hearing and counting six-pulse clave families across traditions.",
    topics: ["clave-in-6", "12/8", "reference"],
    relatedPatternIds: ["west_africa_timeline_in_six"],
  },
  {
    id: "lesson_ostinato_coordination",
    title: "Coordination with Ostinato",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "coordinacion con ostinato.pdf",
    path: materialPath("coordinacion con ostinato.pdf"),
    summary: "Coordination studies built on fixed ostinatos and layered independence work.",
    topics: ["coordination", "ostinato", "independence"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_basic_subdivisions",
    title: "Basic Rhythm Subdivisions",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "pdf#1 Basic rhythm subdivisions.pdf",
    path: materialPath("pdf#1 Basic rhythm subdivisions.pdf"),
    summary: "Core 16th-note subdivision worksheet used as foundational reading material.",
    topics: ["16th-notes", "subdivision", "reading"],
    relatedPatternIds: [],
  },
  {
    id: "lesson_triplet_subdivision",
    title: "Triplet Subdivision",
    region: "fundamentals",
    materialType: "pdf",
    fileName: "triplet subdivision.pdf",
    path: materialPath("triplet subdivision.pdf"),
    summary: "Triplet-subdivision worksheet for alternate clicks and ternary internalization.",
    topics: ["triplets", "subdivision", "reading"],
    relatedPatternIds: [],
  },
];

export const RHYTHM_WEB_SOURCES: RhythmReferenceSource[] = [
  {
    id: "source_african_music_britannica",
    title: "African Music",
    publisher: "Britannica",
    url: "https://www.britannica.com/art/African-music",
    region: "west_africa",
    summary: "Overview of African musical practice, instrumentation, and collective rhythm-making.",
    relatedPatternIds: [
      "west_africa_kuku",
      "west_africa_kpanlogo",
      "west_africa_soli",
      "west_africa_foli",
      "west_africa_timeline_in_six",
    ],
  },
  {
    id: "source_timeline_patterns_britannica",
    title: "Time-line Patterns in African Music",
    publisher: "Britannica",
    url: "https://www.britannica.com/art/African-music/Time-line-patterns",
    region: "west_africa",
    summary: "Reference on asymmetrical time-line patterns and their role in African dance music.",
    relatedPatternIds: ["west_africa_kuku", "west_africa_soli", "west_africa_foli", "west_africa_timeline_in_six"],
  },
  {
    id: "source_flamenco_unesco",
    title: "Flamenco",
    publisher: "UNESCO Intangible Cultural Heritage",
    url: "https://ich.unesco.org/en/RL/00363",
    region: "flamenco",
    country: "Spain",
    summary: "UNESCO entry on flamenco's cante, baile, and toque traditions in Andalusia.",
    relatedPatternIds: [
      "flamenco_buleria",
      "flamenco_solea",
      "flamenco_alegria",
      "flamenco_seguiriya",
      "flamenco_tangos",
      "flamenco_tanguillos",
    ],
  },
  {
    id: "source_cuban_son_unesco",
    title: "La practica del son cubano",
    publisher: "UNESCO Intangible Cultural Heritage",
    url: "https://ich.unesco.org/es/RL/la-practica-del-son-cubano-02299",
    region: "afro_cuban",
    country: "Cuba",
    summary: "UNESCO entry describing son cubano as a practice blending African and European musical inheritance.",
    relatedPatternIds: [
      "afro_cuban_son_23",
      "afro_cuban_son_32",
      "afro_cuban_guaguanco",
      "afro_cuban_cha_cha_cha",
      "afro_cuban_mozambique",
    ],
  },
  {
    id: "source_puerto_rico_bomba_plena",
    title: "Viento de Agua Unplugged: Materia Prima",
    publisher: "Smithsonian Folkways",
    url: "https://folkways.si.edu/viento-de-agua/unplugged-materia-prima/latin-world/music/album/smithsonian",
    region: "afro_cuban",
    country: "Puerto Rico",
    summary: "Smithsonian Folkways release notes framing bomba and plena as core Afro-Puerto Rican traditions.",
    relatedPatternIds: ["afro_cuban_bomba_sica", "afro_cuban_bomba_yuba", "afro_cuban_plena"],
  },
  {
    id: "source_samba_de_roda_unesco",
    title: "Samba de Roda of the Reconcavo of Bahia",
    publisher: "UNESCO Intangible Cultural Heritage",
    url: "https://ich.unesco.org/en/RL/Samba%20de%20Roda-of-the-reconcavo-of-bahia-00101",
    region: "brazil",
    country: "Brazil",
    summary: "UNESCO entry on samba de roda as a circle-based practice linking music, dance, poetry, and Afro-Brazilian memory.",
    relatedPatternIds: ["brazil_samba_de_roda", "brazil_baiao", "brazil_xote", "brazil_coco", "brazil_bossa_nova"],
  },
  {
    id: "source_candombe_uruguay",
    title: "Candombe",
    publisher: "Comision UNESCO Uruguay",
    url: "https://comisionunesco.org.uy/rutas-unesco/candombe/",
    region: "uruguay",
    country: "Uruguay",
    summary: "Uruguayan UNESCO commission page describing candombe as a core Afro-Uruguayan music-and-dance practice.",
    relatedPatternIds: ["uruguay_candombe_base", "uruguay_candombe_llamada", "uruguay_candombe_porton"],
  },
  {
    id: "source_tala_britannica",
    title: "Tala",
    publisher: "Britannica",
    url: "https://www.britannica.com/art/tala",
    region: "india",
    country: "India",
    summary: "Reference on tala as metric cycle and its major beat-group structures in Indian music.",
    relatedPatternIds: ["india_teentaal", "india_keharwa", "india_rupak", "india_jhaptaal", "india_adi_tala"],
  },
  {
    id: "source_afro_peruvian_cajon",
    title: "Dia del Cajon Peruano",
    publisher: "TVPeru",
    url: "https://www.tvperu.gob.pe/noticias/cultural/dia-del-cajon-peruano-hoy-se-celebra-a-este-emblematico-instrumento",
    region: "afro_peruvian",
    country: "Peru",
    summary: "TVPeru overview of the cajon's Afro-Peruvian roots and its use in festejo, lando, and marinera.",
    relatedPatternIds: [
      "afro_peruvian_marinera_limenia",
      "afro_peruvian_marinera_nortena",
      "afro_peruvian_festejo",
      "afro_peruvian_lando",
    ],
  },
  {
    id: "source_argentina_chacarera",
    title: "Las fiestas mas antiguas",
    publisher: "Argentina.gob.ar",
    url: "https://www.argentina.gob.ar/noticias/las-fiestas-mas-antiguas",
    region: "argentina",
    country: "Argentina",
    summary: "Government article highlighting chacarera as a defining folk dance of Santiago del Estero.",
    relatedPatternIds: ["argentina_vidala", "argentina_zamba", "argentina_chacarera", "argentina_malambo"],
  },
  {
    id: "source_bulgarian_rhythms_pas",
    title: "Applying Bulgarian Rhythms to Drumset",
    publisher: "Percussive Arts Society",
    url: "https://pas.org/publication-articles/applying-bulgarian-rhythms-to-drumset/",
    region: "balkans",
    country: "Bulgaria",
    summary: "Percussive Arts Society article on additive Bulgarian groupings and accent flow.",
    relatedPatternIds: [
      "balkans_paidushko",
      "balkans_ruchenitsa",
      "balkans_daychovo",
      "balkans_kopanitsa",
      "balkans_buchimish",
    ],
  },
];

const lessonsById = new Map(RHYTHM_LESSONS.map((lesson) => [lesson.id, lesson]));
const sourcesById = new Map(RHYTHM_WEB_SOURCES.map((source) => [source.id, source]));

const patternLessonIndex = new Map<string, string[]>();
const patternSourceIndex = new Map<string, string[]>();

for (const lesson of RHYTHM_LESSONS) {
  lesson.relatedPatternIds.forEach((patternId) => {
    const existing = patternLessonIndex.get(patternId) ?? [];
    existing.push(lesson.id);
    patternLessonIndex.set(patternId, existing);
  });
}

for (const source of RHYTHM_WEB_SOURCES) {
  source.relatedPatternIds.forEach((patternId) => {
    const existing = patternSourceIndex.get(patternId) ?? [];
    existing.push(source.id);
    patternSourceIndex.set(patternId, existing);
  });
}

export function getPatternResearchIds(patternId: string) {
  return {
    lessonIds: [...new Set(patternLessonIndex.get(patternId) ?? [])],
    sourceIds: [...new Set(patternSourceIndex.get(patternId) ?? [])],
  };
}

export function getLessonsByIds(ids: string[]) {
  return ids
    .map((id) => lessonsById.get(id))
    .filter((lesson): lesson is RhythmLessonMaterial => Boolean(lesson));
}

export function getSourcesByIds(ids: string[]) {
  return ids
    .map((id) => sourcesById.get(id))
    .filter((source): source is RhythmReferenceSource => Boolean(source));
}
