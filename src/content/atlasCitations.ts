/**
 * Ethnomusicological scholarship for the Groove Atlas, keyed by the atlas
 * rhythm id (`Rhythm.id` in globalRhythmAtlas.ts).
 *
 * Every citation here was found by fetching the URL and confirming it
 * substantively documents the tradition, then independently re-verified by an
 * adversarial review pass. Traditions that could not be credibly sourced carry
 * no entry — an absent citation is honest; a fabricated one is disqualifying.
 */

export type AtlasCitationKind =
  | "encyclopedia"
  | "unesco-ich"
  | "liner-notes"
  | "academic"
  | "museum"
  | "cultural-institute"
  | "other";

export interface AtlasCitation {
  title: string;
  author?: string;
  publisher: string;
  year?: number;
  url: string;
  kind: AtlasCitationKind;
}

export interface TraditionScholarship {
  /** 1–2 sentence cultural note, grounded in the cited sources. */
  note?: string;
  citations: AtlasCitation[];
}

export const ATLAS_CITATIONS: Record<string, TraditionScholarship> = {
  "argentina-chacarera": {
    note:
      "The chacarera is a couple dance of Argentina's gaucho tradition, its heartland in Santiago del Estero and its name derived from \"chacra\" (farm); it spread from the rural northwest into the cities as a rural counterpart to the tango. Its signature drive is a hemiola: a melody felt in 6/8 riding over the 3/4 base of the bombo legüero and guitar.",
    citations: [
      { title: "Chacarrera (dance)", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/chacarrera", kind: "encyclopedia" },
      { title: "Dance Traditions of Argentina: A Smithsonian Folkways Lesson", author: "Beth Gibbs", publisher: "Smithsonian Folkways Recordings", url: "https://folkways-media.si.edu/docs/lesson_plans/FLP10012_argentina_dance.pdf", kind: "cultural-institute" },
      { title: "Chacarera, zamba y chamamé: tres géneros de las músicas populares tradicionales argentinas y su interpretación en la guitarra", author: "Leonardo Romero García", publisher: "Universidad Distrital Francisco José de Caldas (Facultad de Artes ASAB), Bogotá", year: 2017, url: "https://repository.udistrital.edu.co/server/api/core/bitstreams/93dc736a-5ea1-4a81-935e-05710525a03f/content", kind: "academic" },
    ],
  },
  "brazil-samba-de-roda": {
    note:
      "Samba de roda is a circle-dance gathering of music, dance and poetry from Bahia's Recôncavo, developed from the 17th century by enslaved Africans and their descendants and blended with Portuguese elements such as the viola machete; dancers take turns in the center of the roda, invited by the umbigada belly-push. Registered by IPHAN as Brazilian Cultural Heritage in 2004 and inscribed by UNESCO in 2008, it is widely regarded as a root of Rio de Janeiro's urban samba.",
    citations: [
      { title: "Samba de Roda of the Recôncavo of Bahia", publisher: "UNESCO Intangible Cultural Heritage", year: 2008, url: "https://ich.unesco.org/en/RL/samba-de-roda-of-the-reconcavo-of-bahia-00101", kind: "unesco-ich" },
      { title: "Samba de Roda do Recôncavo Baiano — Bens Culturais Registrados", publisher: "IPHAN (Instituto do Patrimônio Histórico e Artístico Nacional)", url: "https://bcr.iphan.gov.br/bens-culturais/samba-de-roda-do-reconcavo-baiano/", kind: "cultural-institute" },
      { title: "Samba de Roda do Recôncavo Baiano: obra-prima do patrimônio oral e imaterial da humanidade", author: "Raiana Alves Maciel Leal do Carmo", publisher: "Ictus — Periódico do PPGMUS-UFBA (Universidade Federal da Bahia)", year: 2012, url: "https://periodicos.ufba.br/index.php/ictus/article/view/34412", kind: "academic" },
    ],
  },
  "cuba-son-clave-32": {
    note:
      "The son clave is a five-stroke timeline of West African ancestry, played in Cuba on two hardwood sticks (claves), that repeats as the fixed rhythmic foundation for the whole ensemble in son and most Afro-Cuban popular styles. Toussaint calls it the clave rhythm most similar to all the others — one reason it spread worldwide, surfacing as the \"Bo Diddley beat\" in 1950s rock and roll.",
    citations: [
      { title: "A Mathematical Analysis of African, Brazilian and Cuban Clave Rhythms", author: "Godfried Toussaint (School of Computer Science, McGill University)", publisher: "Bridges: Mathematical Connections in Art, Music, and Science (conference proceedings archive)", year: 2002, url: "https://archive.bridgesmathart.org/2002/bridges2002-157.pdf", kind: "academic" },
      { title: "The 3-2 Son Clave — Music Theory for the 21st-Century Classroom", author: "Robert Hutchinson", publisher: "University of Puget Sound", url: "https://musictheory.pugetsound.edu/mt21c/ThreeTwoClave.html", kind: "academic" },
      { title: "The Clave (PULSE lesson 14)", publisher: "Berklee PULSE, Berklee College of Music", url: "https://pulse.berklee.edu/?id=4&lesson=14", kind: "academic" },
    ],
  },
  "ghana-kpanlogo": {
    note:
      "Kpanlogo is a recreational dance-drumming genre of the Ga people of Accra, created by urban youth around Ghana's independence era (late 1950s-early 1960s) and played at parties, festivals, and funerals. The lead kpanlogo hand drum \"calls\" the dancers over an iron-bell timeline supported by gourd shaker, support drums, and handclaps.",
    citations: [
      { title: "Kpanlogo: A Celebration Through Dance", publisher: "African Studies Center, University of North Carolina at Chapel Hill", year: 2023, url: "https://teachingafrica.unc.edu/wp-content/uploads/sites/1308/2023/12/Kpanlogo_-A-Celebration-Through-Dance.pdf", kind: "academic" },
      { title: "West African Drum and Dance Ensemble concert program (Kpanlogo dance-drumming notes)", author: "Julie Hunter", publisher: "Crane School of Music, SUNY Potsdam", year: 2019, url: "https://www.potsdam.edu/sites/default/files/inline-files/West%20African%20Drum%20and%20Dance%20Ensemble%2011%2023%2019PDF.pdf", kind: "academic" },
      { title: "Ago/Ame: Co-Teaching Community Cultural Knowledge with a Local Expert", author: "Avalon Brimat Nemec with Jeannine Osayande", publisher: "Journal of Folklore and Education", year: 2020, url: "https://jfepublications.org/article/ago-ame/", kind: "academic" },
    ],
  },
  "guinea-kuku": {
    note:
      "Kuku originated among the Konianka (Manian) people of Guinea's forest region around Beyla as a women's circle dance celebrating the return from fishing, played originally on djembes alone before dundun parts evolved. Today it is one of West Africa's most popular celebration rhythms, danced at festivals and harvest-season festivities across the region.",
    citations: [
      { title: "Roots of Life – Intro to West African Dance and Drumming (Vocabulary)", publisher: "WPSU, Penn State University public media", year: 2021, url: "https://wpsu.psu.edu/wp-content/uploads/2021/07/Roots-of-Life-Intro-to-West-African-Dance.pdf", kind: "other" },
      { title: "Kuku – djembe and dundun parts (KS3 Music: Djembe drumming and rhythms from the regions of West Africa)", publisher: "Oak National Academy", year: 2026, url: "https://www.thenational.academy/teachers/programmes/music-secondary-ks3/units/djembe-drumming-and-rhythms-from-the-regions-of-west-africa/lessons/kuku-djembe-and-dundun-parts", kind: "other" },
      { title: "West-African Percussion: rhythms from Guinea and surrounding countries (collected WAP-Pages transcriptions, Kuku section)", author: "Paul Nas", publisher: "Paul Nas / WAP-Pages (hosted by DjembeFoley)", url: "https://djembefoley.ca/wp-content/uploads/2012/03/african-rhythms.pdf", kind: "other" },
    ],
  },
  "india-teentaal": {
    note:
      "Teentaal (tīntāl) is the most common tala of Hindustani classical music: a 16-beat cycle in four vibhāgs of four, marked by claps on beats 1 (sam), 5, and 13 and a wave of the hand (khālī) on beat 9, with the tabla theka \"dha dhin dhin dha…\" underpinning khyal, instrumental, and Kathak performance. Documented by the NCPA Mumbai / University of Amsterdam Music in Motion project and UPF's CompMusic research corpus.",
    citations: [
      { title: "Music in Motion: The Automated Transcription for Indian Music (AUTRIM) — Rhythm", publisher: "National Centre for the Performing Arts, Mumbai / University of Amsterdam", url: "https://autrimncpa.wordpress.com/rhythm/", kind: "cultural-institute" },
      { title: "Tāl in Hindustani Music: Examples (CompMusic)", publisher: "Music Technology Group, Universitat Pompeu Fabra", url: "https://compmusic.upf.edu/examples-taal-hindustani", kind: "academic" },
      { title: "North Indian Classical Music: Shujaat Khan, sitar; Abhiman Kaushal, tabla", publisher: "Smithsonian National Museum of Asian Art (Freer Gallery concert archive)", url: "https://asia-archive.si.edu/podcast/north-indian-classical-music-shujaat-khan-sitar-abhiman-kaushal-tabla/", kind: "museum" },
    ],
  },
  "japan-matsuri-bayashi": {
    note:
      "Matsuri-bayashi is the lively flute-and-drum music that accompanies Shinto festival processions, typically combining a bamboo flute with two shime-daiko stick drums, an o-daiko barrel drum, and a kane hand gong. The Edo (Tokyo) tradition performs a suite of five pieces (yatai, shoden, kamakura, shichome, yatai) kept alive by preservation societies such as the Edobayashi Hozonkai, and its interlocking rhythms underpin much of modern kumi-daiko.",
    citations: [
      { title: "Matsuri-bayashi | Japanese music", publisher: "Encyclopaedia Britannica", year: 2026, url: "https://www.britannica.com/art/matsuri-bayashi", kind: "encyclopedia" },
      { title: "Wakayama Ryū Edo Bayashi in the United States: Intercultural History, Transmission, Authenticity, and Relationship with Contemporary Taiko (M.A. thesis, Ethnomusicology)", author: "Sean Shibata", publisher: "University of Hawaiʻi at Mānoa ScholarSpace", year: 2019, url: "https://scholarspace.manoa.hawaii.edu/handle/10125/66252", kind: "academic" },
    ],
  },
  "nigeria-timeline-six": {
    note:
      "Yoruba ensembles are anchored by a seven-stroke bell ostinato spanning twelve pulses — singers, drummers, and dancers find their bearings by its strokes, repeated at a steady tempo throughout the performance. Smithsonian Folkways traces this same Yoruba bell pattern into Afro-Cuban music, where it survived the transatlantic slave trade.",
    citations: [
      { title: "African music: Time-line patterns", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/African-music/Time-line-patterns", kind: "encyclopedia" },
      { title: "Braiding Rhythms: The Role of Bell Patterns in West African and Afro-Caribbean Music", author: "Jonathan Saxon", publisher: "Smithsonian Folkways Recordings", url: "https://folkways-media.si.edu/docs/lesson_plans/FLP10117_braiding_rhythms.pdf", kind: "museum" },
      { title: "Inside a Master Drummer's Mind: A Quantitative Theory of Structures in African Music", author: "Willie Anku", publisher: "TRANS - Revista Transcultural de Musica", year: 2007, url: "https://www.sibetrans.com/trans/article/122/inside-a-master-drummer-s-mind-a-quantitative-theory-of-structures-in-african-music", kind: "academic" },
    ],
  },
  "peru-festejo": {
    note:
      "Festejo is a fast, festive Afro-Peruvian music-and-dance genre of Peru's central-southern coast, classically performed with guitar, cajón, and handclaps (later adding the quijada de burro), whose lyrics carry testimonial memory of Afro-descendant life from slavery to the present. Revived and standardized in the mid-20th century by José Durand and by Nicomedes and Victoria Santa Cruz, it became the most widely diffused vehicle of Afro-Peruvian musical expression.",
    citations: [
      { title: "Patrimonio Cultural Inmaterial Afroperuano", author: "Rodrigo Chocano Paredes and Sandra Rospigliosi Navarrete", publisher: "Ministerio de Cultura del Perú", year: 2016, url: "https://centroderecursos.cultura.pe/sites/default/files/rb/pdf/PATRIMONIO%20CULTURAL%20INMATERIAL%20AFROPERUANO%20MINCU.pdf", kind: "cultural-institute" },
      { title: "Afro-Peruvian Jazz Education", author: "Noah Mercil", publisher: "University of Minnesota Duluth (MINDS@UW repository)", year: 2019, url: "https://minds.wisc.edu/bitstream/handle/1793/79280/Afro-Peruvian%20Jazz%20Education.pdf?sequence=6&isAllowed=y", kind: "academic" },
      { title: "Afro-Peruvian Music and Dance", publisher: "Smithsonian Folklife Festival", year: 2015, url: "https://festival.si.edu/2015/peru/performing-and-visual-arts/afro-peruvian-music/smithsonian", kind: "museum" },
    ],
  },
  "senegal-sabar": {
    note:
      "Sabar is the drum-and-dance tradition of the Wolof people of Senegal, played with one bare hand and one stick by hereditary gewel (griot) percussionists at baptisms, weddings, wrestling matches, political events, and neighborhood dance parties. Its interlocking ensemble parts are also the rhythmic backbone of mbalax, the popular genre made famous by Youssou N'Dour.",
    citations: [
      { title: "Twenty-First Century Sabar Drums: Innovations in Organology and Performance Practices in Senegal and the Diaspora", author: "Patricia Tang", publisher: "African Music: Journal of the International Library of African Music (MIT-hosted PDF)", year: 2019, url: "https://mta.mit.edu/sites/default/files/public/tangilamarticle.pdf", kind: "academic" },
      { title: "Senegal (Wolof/Sabar) — Drum Languages Project", publisher: "Utrecht University", url: "https://drumlanguages.sites.uu.nl/senegal-wolof-sabar/", kind: "academic" },
      { title: "Sabar Drumming: Puzzling Rhythms From Senegal", publisher: "DRUM! Magazine", url: "https://drummagazine.com/sabar-drumming-puzzling-rhythms-from-senegal/", kind: "other" },
    ],
  },
  "spain-buleria": {
    note:
      "The buleria is a fast, festive palo of Andalusian flamenco closely tied to Gitano (Roma) communities, driven by a 12-pulse hand-clapping compas that scholars classify among flamenco's aperiodic 12/8 meters. Flamenco — its song (cante), dance (baile), and musicianship (toque) — was inscribed on UNESCO's Representative List of the Intangible Cultural Heritage of Humanity in 2010.",
    citations: [
      { title: "Flamenco — Representative List of the Intangible Cultural Heritage of Humanity (00363)", publisher: "UNESCO Intangible Cultural Heritage", year: 2010, url: "https://ich.unesco.org/en/RL/flamenco-00363", kind: "unesco-ich" },
      { title: "El Compas Flamenco: A Phylogenetic Analysis", author: "J. Miguel Diaz-Banez, Giovanna Farigu, Francisco Gomez, David Rappaport, Godfried T. Toussaint", publisher: "Bridges: Mathematical Connections in Art, Music, and Science (2004 conference proceedings)", year: 2004, url: "https://archive.bridgesmathart.org/2004/bridges2004-61.pdf", kind: "academic" },
      { title: "Mathematics and Flamenco: An Unexpected Partnership", author: "Jose-Miguel Diaz-Banez", publisher: "The Mathematical Intelligencer (Springer)", year: 2017, url: "https://link.springer.com/article/10.1007/s00283-016-9688-4", kind: "academic" },
    ],
  },
  "uruguay-candombe": {
    note:
      "Candombe is the drum-based music of Uruguay's Afro-descendant communities, performed by marching \"cuerdas\" of chico, repique, and piano drums through Montevideo's Sur, Palermo, and Cordón districts, where each neighborhood's piano patterns signal its distinct identity. UNESCO inscribed candombe and its socio-cultural space on the Representative List of the Intangible Cultural Heritage of Humanity in 2009.",
    citations: [
      { title: "Candombe and its socio-cultural space: a community practice", publisher: "UNESCO Intangible Cultural Heritage", year: 2009, url: "https://ich.unesco.org/en/RL/candombe-and-its-socio-cultural-space-a-community-practice-00182", kind: "unesco-ich" },
      { title: "An Afrocentric Approach to Musical Performance in the Black South Atlantic: The Candombe Drumming in Uruguay", author: "Luis Ferreira", publisher: "Trans. Revista Transcultural de Música (Sociedad de Etnomusicología), via Redalyc", year: 2007, url: "https://www.redalyc.org/pdf/822/82201112.pdf", kind: "academic" },
      { title: "From Candombe to N2: A Tradition of Uruguayan Music Taking the Street, Virtually or Otherwise", author: "Óscar A. Ulloa", publisher: "Ethnomusicology Review, UCLA", year: 2017, url: "https://ethnomusicologyreview.ucla.edu/content/candombe-n2-tradition-uruguayan-music-taking-street-virtually-or-otherwise", kind: "academic" },
    ],
  },
};

/**
 * Atlas rhythm ids are `${templateId}-${countrySlug}` (hydrateTemplate in
 * globalRhythmAtlas.ts); citations are keyed by template id so one entry
 * covers every country sharing the template. Strip the country suffix first.
 */
export function getScholarshipForRhythm(
  rhythmId: string,
  country: string,
): TraditionScholarship | undefined {
  const countrySlug = country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const templateId = rhythmId.endsWith(`-${countrySlug}`)
    ? rhythmId.slice(0, -(countrySlug.length + 1))
    : rhythmId;
  return ATLAS_CITATIONS[templateId];
}
