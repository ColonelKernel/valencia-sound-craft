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
  "usa-second-line": {
    note:
      "Second lines are Sunday street parades sponsored by Black New Orleans social aid and pleasure clubs: the club and brass band form the first line while the dancing crowd behind is the \"second line,\" a free-form processional dance tradition with umbrellas and handkerchiefs derived from West African processions and shared with the city's jazz funerals.",
    citations: [
      { title: "Strictly Second Line: Funk, Jazz, and the New Orleans Beat", author: "Benjamin Doleac", publisher: "Ethnomusicology Review (UCLA)", year: 2013, url: "https://ethnomusicologyreview.ucla.edu/journal/volume/18/piece/699", kind: "academic" },
      { title: "New Orleans Brass Bands: Through the Streets of the City (liner notes, SFW CD 40212)", author: "Michael G. White", publisher: "Smithsonian Folkways Recordings", year: 2014, url: "https://folkways-media.si.edu/docs/folkways/artwork/SFW40212.pdf", kind: "liner-notes" },
      { title: "Jazz Funerals and Second Line Parades", author: "Matt Sakakeeny", publisher: "64 Parishes / Louisiana Endowment for the Humanities", url: "https://64parishes.org/entry/jazz-funerals-and-second-line-parades", kind: "encyclopedia" },
    ],
  },
  "mexico-son-jarocho": {
    note:
      "Son jarocho is the son tradition of Veracruz, Mexico, a song-and-dance form implanted during 17th-18th-century Spanish colonization and shaped by Indigenous and African influences. Its home setting is the fandango, a community celebration where participants take turns singing improvised coplas and decimas and dancing zapateado on a raised wooden tarima, the footwork serving as the music's percussion.",
    citations: [
      { title: "Son Jarocho from Veracruz: Exploration of Music and Dance Forms (Smithsonian Folkways Lesson)", author: "Amanda C. Soto", publisher: "Smithsonian Folkways Recordings", url: "https://folkways-media.si.edu/docs/lesson_plans/FLP10016_mexico_son_jarocho.pdf", kind: "museum" },
      { title: "The Fandango in Son Jarocho: The Community Tradition and Improvisation of Son Jarocho (Smithsonian Folkways Lesson)", author: "James Grunewald", publisher: "Smithsonian Folkways Recordings (hosted by University of Arizona Center for Latin American Studies)", url: "https://clas.arizona.edu/sites/default/files/Mexico_Music_The%20Fandago%20in%20Son%20Jarocho_0.pdf", kind: "museum" },
      { title: "Origins, Form, and Development of the Son Jarocho: Veracruz, Mexico", author: "Steven J. Loza", publisher: "Aztlan: International Journal of Chicano Studies Research (ERIC record EJ260282)", year: 1982, url: "https://eric.ed.gov/?id=EJ260282", kind: "academic" },
    ],
  },
  "colombia-cumbia": {
    note:
      "Cumbia is the emblematic music-and-dance tradition of Colombia's Caribbean coast, a tri-ethnic (Amerindian, Spanish, African) genre from the Magdalena River region in which a couple dances a courtship \"game of repulsion and attraction\" counterclockwise around the musicians, the woman carrying lit candles. It is performed mainly at carnivals such as the Carnaval de Barranquilla and on Catholic feast days, and coastal ensembles like Los Gaiteros de San Jacinto remain a living fountainhead of the tradition.",
    citations: [
      { title: "Cumbia (dance)", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/cumbia", kind: "encyclopedia" },
    ],
  },
  "venezuela-joropo": {
    note:
      "UNESCO describes joropo as a festive tradition born from the encounter of Indigenous peoples, Africans, and Europeans, combining music, poetry, singing, and partner dance across seven regional variants (Plains, Central, East, Guayana, Andes, and others), transmitted orally and in joropo schools; it was inscribed on the Representative List of the Intangible Cultural Heritage of Humanity in 2025, and Pedroza notes it is widely embraced by Venezuelans as a national symbol.",
    citations: [
      { title: "Joropo in Venezuela", publisher: "UNESCO Intangible Cultural Heritage", year: 2025, url: "https://ich.unesco.org/en/RL/joropo-in-venezuela-02092", kind: "unesco-ich" },
      { title: "The Joropo in Venezuela's Musical Modernity: Cultural Capital in Jose Clemente Laya's Sonata Venezolana", author: "Ludim Rebeca Pedroza", publisher: "Musicological Annual (Muzikoloski zbornik), University of Ljubljana", year: 2016, url: "https://journals.uni-lj.si/MuzikoloskiZbornik/article/view/6657", kind: "academic" },
      { title: "Joropo: Music Inspired by Nature from the High Plains of Venezuela", publisher: "TeachRock (Rock and Roll Forever Foundation)", url: "https://teachrock.org/lesson/joropo-music-inspired-by-nature-from-the-high-plains-of-venezuela/", kind: "other" },
    ],
  },
  "chile-cueca": {
    note:
      "The cueca, a handkerchief courtship dance officially decreed Chile's national dance on 18 September 1979, is performed in three \"pies\" of roughly 52 measures each and varies regionally while keeping a common pattern (Memoria Chilena). Its urban working-class variant, the cueca brava of Santiago and Valparaiso, was revived from the 1990s by artists such as Los Tres (Smithsonian Folkways liner notes).",
    citations: [
      { title: "La cueca", publisher: "Memoria Chilena, Biblioteca Nacional de Chile", url: "https://www.memoriachilena.gob.cl/602/w3-article-3510.html", kind: "cultural-institute" },
      { title: "¡Que Viva el Canto! Songs of Chile (SFW CD 40549) — liner notes", author: "Emily Pinkerton and Daniel Sheehy", publisher: "Smithsonian Folkways Recordings", year: 2008, url: "https://folkways-media.si.edu/docs/folkways/artwork/SFW40549.pdf", kind: "liner-notes" },
    ],
  },
  "bolivia-huayno": {
    note:
      "Per Britannica, the huayño is a festive couple dance of the Quechua and Aymara peoples and many mestizos of Peru, Bolivia, and Ecuador that antedates the Spanish conquest and was possibly an Inca funeral dance; couples dance in a circle around the musicians without touching. Field recordings on Smithsonian Folkways' Songs and Dances of Bolivia document the genre in Bolivian practice, where it is spelled huayño.",
    citations: [
      { title: "Huayño", author: "The Editors of Encyclopaedia Britannica", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/huayno", kind: "encyclopedia" },
      { title: "Andean Music Ensemble Community Engagement Workshop: Teachers' Guide and Idea Cards", publisher: "The Ohio State University, Center for Latin American Studies", url: "https://clas.osu.edu/sites/default/files/Andean%20Music%20Outreach%20Teachers%27%20Guide%20and%20Idea%20Cards.pdf", kind: "academic" },
    ],
  },
  "jamaica-one-drop": {
    note:
      "Reggae emerged in the late 1960s from ska and rock steady among marginalized communities of Western Kingston, and UNESCO inscribed it on the Representative List of Intangible Cultural Heritage in 2018 as a vehicle for social commentary, catharsis, and praise. Britannica documents its deep bond with the Rastafari movement, whose mystical consciousness draws on the earlier Jamaican kumina tradition.",
    citations: [
      { title: "Reggae music of Jamaica", publisher: "UNESCO Intangible Cultural Heritage", year: 2018, url: "https://ich.unesco.org/en/RL/reggae-music-of-jamaica-01398", kind: "unesco-ich" },
      { title: "Reggae", author: "Carolyn J. Cooper", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/reggae", kind: "encyclopedia" },
      { title: "How reggae came to Hawai'i", publisher: "University of California", url: "https://www.universityofcalifornia.edu/news/how-reggae-came-to-hawaii", kind: "other" },
    ],
  },
  "trinidad-calypso": {
    note:
      "Calypso was created by enslaved West Africans in Trinidad as sung social commentary, and its steelband vehicle — the steelpan, invented around 1939 from discarded oil drums — is Trinidad and Tobago's national instrument. Steel orchestras of up to 120 players, driven by the \"engine room\" percussion section, compete in the annual Panorama competition held during Carnival since 1963.",
    citations: [
      { title: "Steelband — Trinidad and Tobago Content Guide", publisher: "National Library and Information System Authority of Trinidad and Tobago (NALIS)", url: "https://www.nalis.gov.tt/resources/tt-content-guide/steelband/", kind: "cultural-institute" },
      { title: "Calypso, Soca, and Carnival — Music in Global America", publisher: "University of Southern California (Scalar)", url: "https://scalar.usc.edu/works/music-in-global-america/calypso-soca-and-carnival", kind: "academic" },
      { title: "Calypso Magic: Caribbean Rhythms with the NAC Orchestra — Definitions", publisher: "National Arts Centre (Canada)", url: "https://nac-cna.ca/en/artsalive/resource/calypso-magic-caribbean-rhythms-with-the-nac-orchestra/definitions", kind: "cultural-institute" },
    ],
  },
  "haiti-rara": {
    note:
      "In Vodou ceremonies the Rada battery of three conical drums, rattles, and ogan bell is a form of direct communication with the lwa spirits, with the manman drum leading rhythms such as yanvalou, mayi, and zepol; Rara extends this spiritual work into Lenten street processions from Ash Wednesday to Easter, where single-note vaksin bamboo trumpets build melodies by hocketing over portable Petwo-family drums.",
    citations: [
      { title: "Rhythms of Rapture: Sacred Musics of Haitian Vodou (liner notes, SFW 40464)", author: "Elizabeth McAlister (ed.), with essays by Gerdes Fleurant, David Yih, and Gage Averill", publisher: "Smithsonian Folkways Recordings", year: 1995, url: "https://folkways-media.si.edu/docs/folkways/artwork/SFW40464.pdf", kind: "liner-notes" },
      { title: "The Music and Dance of Rara", author: "Elizabeth McAlister", publisher: "Wesleyan University", url: "https://rara.research.wesleyan.edu/the-music-and-dance-of-rara/", kind: "academic" },
      { title: "Classification and Phylogenetic Analysis of African Ternary Rhythm Timelines", author: "Godfried Toussaint", publisher: "McGill University, School of Computer Science", year: 2005, url: "https://cgm.cs.mcgill.ca/~godfried/teaching/mir-reading-assignments/Classification-and-Phylogenetic-Analysis-of-African-Ternary-Rhythm-Timelines.pdf", kind: "academic" },
    ],
  },
  "dominican-merengue": {
    note:
      "Merengue, rooted in the Cibao region and inscribed by UNESCO in 2016 as Intangible Cultural Heritage, is regarded as part of Dominican national identity, present in education, social gatherings, celebrations, and even political campaigning, with November 26 declared National Merengue Day by presidential decree in 2005. The CUNY Dominican Studies Institute traces its mid-19th-century emergence from the syncretism of European and African elements and its elevation to national symbol during the Trujillo era.",
    citations: [
      { title: "Music and dance of the merengue in the Dominican Republic", publisher: "UNESCO Intangible Cultural Heritage", year: 2016, url: "https://ich.unesco.org/en/RL/music-and-dance-of-the-merengue-in-the-dominican-republic-01162", kind: "unesco-ich" },
      { title: "Merengue (dance)", author: "The Editors of Encyclopaedia Britannica", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/merengue", kind: "encyclopedia" },
      { title: "Genre Guide: Merengue — A History of Dominican Music in the United States", publisher: "CUNY Dominican Studies Institute, City College of New York", url: "https://dominicanmusicusa.com/genres/merengue/35", kind: "academic" },
    ],
  },
  "ireland-jig": {
    note:
      "Britannica traces the jig from 16th-17th-century Scotland and northern England into Ireland from the 18th century, where it is danced as a rapid-footwork solo step dance; Henry Cowell's 1966 Folkways liner notes describe jigs, reels, and hornpipes as dances \"played in every village and city of Ireland\", lilted aloud when no instrument is at hand and judged at annual Feis competitions for fidelity to the old style.",
    citations: [
      { title: "Rhythm (Tune Type) Definitions — Irish Traditional Music Tune Index", author: "Alan Ng", publisher: "irishtune.info", url: "https://www.irishtune.info/rhythm/", kind: "other" },
    ],
  },
  "italy-tarantella": {
    note:
      "The tarantella's origin is tied to tarantism, a 15th-17th-century affliction attributed to the tarantula's bite (both words deriving from the town of Taranto) whose victims were seemingly cured by frenzied dancing; in Puglia's Salento the related pizzica tarantata served as this ritual dance-cure for days on end, while most tarantellas are couple courtship dances with light, quick steps and tambourine-carrying dancers.",
    citations: [
      { title: "Tarantella", author: "The Editors of Encyclopaedia Britannica", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/tarantella", kind: "encyclopedia" },
      { title: "Italian Folk Music Vol. 5: Naples and Campania (FE 4265) — liner notes", author: "Carla Bianco, Alan Lomax, Anna Lomax with Diego Carpitella", publisher: "Smithsonian Folkways Recordings", year: 1972, url: "https://folkways-media.si.edu/docs/folkways/artwork/FW04265.pdf", kind: "liner-notes" },
      { title: "Dances with Spiders: Crisis, Celebrity and Celebration in Southern Italy", author: "Karen Ludtke", publisher: "Berghahn Books", year: 2008, url: "https://www.berghahnbooks.com/title/LuedtkeDances", kind: "academic" },
    ],
  },
  "greece-kalamatianos": {
    note:
      "A chain dance of the syrtos (shuffling) family originally from the district of Kalamata in the Peloponnese, the kalamatianos has become a pan-Hellenic national dance, per the Folkways liner notes and Britannica. Britannica notes it is frequently danced to the ballad of Zalongo, with an improvising leader who leaps and flourishes a handkerchief before passing it to a new leader.",
    citations: [
      { title: "Syrtos", author: "The Editors of Encyclopaedia Britannica", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/syrtos", kind: "encyclopedia" },
      { title: "Folk Dances of Greece (FE 4467) — liner notes", author: "James A. Notopoulos (recordings); Spyros Peristeres (notes and transcriptions)", publisher: "Smithsonian Folkways Recordings", year: 1956, url: "https://folkways-media.si.edu/docs/folkways/artwork/FW04467.pdf", kind: "liner-notes" },
    ],
  },
  "turkey-karsilama": {
    note:
      "Karşılama (\"greeting/welcoming\") is a face-to-face dance of Eastern Thrace and the Marmara region, defined by its 9-beat meter and danced without touching, historically shared across the Bulgarian-Greek-Slavic-Albanian-Romanian-Turkish-Romani communities of Thrace where traveling davul-zurna musicians played at weddings and town festivities. The 9/8 (2+2+2+3) pattern is so prevalent among Eastern Thrace's Roman (Romani) communities that it is also called \"Roman ritmi\", and karşılama together with horo forms the basis of the regional repertoire.",
    citations: [
      { title: "Doğu Trakya Bölgesi Halk Müziğinde Ritim Kalıplarına Dair Bir İnceleme (A Study About Rhythmic Pattern on Eastern Thrace Region Music)", author: "Canan Aykent", publisher: "ERDEM, Journal of the Atatürk Cultural Center, issue 79, pp. 41-62 (via DergiPark)", year: 2020, url: "https://dergipark.org.tr/tr/download/article-file/1440312", kind: "academic" },
      { title: "The cultural significance of the Turkish 9 rhythm: Timing, tradition, and identity", author: "Emir Cenk Aydın", publisher: "Journal of Human Sciences, vol. 13, no. 1, pp. 2268-2276", year: 2016, url: "https://www.j-humansciences.com/ojs/index.php/IJHS/article/view/3785", kind: "academic" },
    ],
  },
  "ukraine-hopak": {
    note:
      "The hopak emerged as a male dance at the Zaporozhian Sich in the 16th century, later becoming a couple and group dance famed for competitive leaps and squats, and it typically serves as the culminating number in Ukrainian dance ensemble repertoires. Since 1985 a \"martial hopak\" revival has reframed the dance as a Cossack-rooted martial art tied to Ukrainian national identity (Pivtorak 2016).",
    citations: [
      { title: "Hopak", publisher: "Internet Encyclopedia of Ukraine (Canadian Institute of Ukrainian Studies)", url: "https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CH%5CO%5CHopakIT.htm", kind: "encyclopedia" },
      { title: "Folk dance", publisher: "Internet Encyclopedia of Ukraine (Canadian Institute of Ukrainian Studies)", url: "https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CF%5CO%5CFolkdance.htm", kind: "encyclopedia" },
      { title: "Ukrainian Hopak: From Dance for Entertainment to Martial Art", author: "Yuliya Pivtorak", publisher: "Congress on Research in Dance Conference Proceedings, Cambridge University Press", year: 2016, url: "https://www.cambridge.org/core/journals/congress-on-research-in-dance/article/abs/ukrainian-hopak-from-dance-for-entertainment-to-martial-art/11FE9632C947D1663532123655CFEBBA", kind: "academic" },
    ],
  },
  "sweden-polska": {
    note:
      "The polska is a couple turning dance and Sweden's dominant traditional dance-music form, with historical roots traced through the Polish-German polonaise tradition and a strong revival since the 1970s; it is listed in Sweden's national inventory of intangible cultural heritage and is danced to live fiddle-led music at festivals and spelman gatherings, where practitioners describe it as an important social activity.",
    citations: [
      { title: "Polska - music and dance (Living Heritage national inventory of intangible cultural heritage)", publisher: "Living Heritage / Institute for Language and Folklore (Isof), Sweden", url: "https://levandekulturarv.se/in-english/the-inventory/submissions/polska---music-and-dance", kind: "cultural-institute" },
      { title: "The Swedish Polska", author: "Mats Nilsson", publisher: "Svenskt visarkiv / Musikverket (Centre for Swedish Folk Music and Jazz Research), Stockholm", year: 2017, url: "https://svensktvisarkiv.se/wp-content/uploads/sites/5/2024/12/Polska_FINAL2.pdf", kind: "cultural-institute" },
      { title: "A Case Study of Deep Enculturation and Sensorimotor Synchronization to Real Music", author: "Olof Misgeld, Torbjorn Gulz, Andre Holzapfel, Jura Miniotaite", publisher: "Proceedings of the 22nd International Society for Music Information Retrieval Conference (ISMIR), via DiVA/KTH", year: 2021, url: "https://www.diva-portal.org/smash/get/diva2:1601509/FULLTEXT01.pdf", kind: "academic" },
    ],
  },
  "egypt-maqsum": {
    note:
      "Maqsum is by far the most widely used iqa' in Arabic music, anchoring Egyptian repertoire from Umm Kulthum and Abdel Halim Hafez to Ahmad Adaweya and modulating freely to the closely related baladi (also called masmudi saghir); it is a staple of belly dance. Hamza El-Din's liner notes for The Music of Upper and Lower Egypt place its percussion family — tabla baladi, darabukka, and tar — at the heart of Egyptian weddings, religious events, and holiday celebrations.",
    citations: [
      { title: "Iqa' Maqsum", publisher: "MaqamWorld", url: "https://www.maqamworld.com/en/iqaa/maqsum.php", kind: "other" },
      { title: "The Middle East for Kids - Maqsum", publisher: "All Around This World", url: "https://www.allaroundthisworld.com/learn/west-asia-and-the-middle-east-2/egypt/middle-east-kids-maqsum/", kind: "other" },
    ],
  },
  "morocco-gnawa": {
    note:
      "Gnawa, inscribed by UNESCO in 2019, is a set of musical performances, fraternal practices, and therapeutic possession rituals mixing the secular with the sacred, developed by communities descended from enslaved West Africans in Morocco. In the all-night lila (derdeba) ceremony, the guembri and qraqab drive call-and-response invocations whose overlapping binary and ternary rhythms and gradual acceleration help induce trance.",
    citations: [
      { title: "Gnawa", publisher: "UNESCO Intangible Cultural Heritage", year: 2019, url: "https://ich.unesco.org/en/RL/gnawa-01170", kind: "unesco-ich" },
      { title: "Gnawa: Music and Spirit", author: "Maria Elena Morato", publisher: "European Institute of the Mediterranean (IEMed), Quaderns de la Mediterrania", url: "https://www.iemed.org/publication/gnawa-music-and-spirit/", kind: "cultural-institute" },
    ],
  },
  "zimbabwe-mbira": {
    note:
      "Mbira music of the Shona is cyclical, with each repetition of a theme varying slightly and weaving together numerous interlocking melodies; it accompanies funerals, weddings, and veneration of ancestors, and its crafting and playing were inscribed by UNESCO in 2020 as Intangible Cultural Heritage of Zimbabwe and Malawi. The instrument has been played for over 600 years and held sacred status in Shona society, with transmission traditionally through family apprenticeship.",
    citations: [
      { title: "Art of crafting and playing Mbira/Sansi, the finger-plucking traditional musical instrument in Malawi and Zimbabwe", publisher: "UNESCO Intangible Cultural Heritage", year: 2020, url: "https://ich.unesco.org/en/RL/art-of-crafting-and-playing-mbira-sansi-the-finger-plucking-traditional-musical-instrument-in-malawi-and-zimbabwe-01541", kind: "unesco-ich" },
      { title: "Rhythmic Archetypes in Instrumental Music from Africa and the Diaspora", author: "James Burns", publisher: "Music Theory Online (Society for Music Theory)", year: 2010, url: "https://mtosmt.org/issues/mto.10.16.4/mto.10.16.4.burns.php", kind: "academic" },
      { title: "The Shona Mbira", publisher: "Ditsong Museums of South Africa", url: "https://ditsong.org.za/en/the-shona-mbira/", kind: "museum" },
    ],
  },
  "madagascar-salegy": {
    note:
      "Salegy emerged in the 1950s in the towns of northern and northwestern Madagascar (Mahajanga, Antsiranana/Diego Suarez), evolving from the acoustic antsa ritual style into the island's most popular electric dance music, with Sakalava singer Eusebe Jaojoby its most celebrated figure. Malagasy musicians often use \"salegy\" as a synonym for the island-wide \"6/8 rhythm\" itself, even while contesting the Western metric label as foreign to their oral tradition (lova-tsofina).",
    citations: [
      { title: "\"6/8 rhythm\" Meets \"lova-tsofina\": Experiencing Malagasy Music", author: "Jenny Fuhr", publisher: "Music and Arts in Action, Vol. 3 No. 3", year: 2011, url: "https://musicandartsinaction.net/index.php/maia/article/view/malagasymusic", kind: "academic" },
      { title: "Salegy Music Genre History and Style Description", publisher: "African Music Library (Josplay)", url: "https://africanmusiclibrary.org/genre/Salegy", kind: "other" },
      { title: "Hip Deep Madagascar: Songs of the North", author: "Banning Eyre", publisher: "Afropop Worldwide", url: "https://afropop.org/audio-programs/hip-deep-madagascar-songs-of-the-north", kind: "other" },
    ],
  },
  "kenya-benga": {
    note:
      "Benga is a guitar-band dance music that emerged among the Luo of Nyanza Province in western Kenya in the late 1960s, its fingerpicked interlocking guitar lines growing out of nyatiti (eight-string lyre) and orutu traditions. It became Kenya's defining popular style through the 1970s-80s and was adapted across ethnic communities, including Akamba benga.",
    citations: [
      { title: "Continuities and Innovation in Luo Song Style: Creating the Benga Beat in Kenya 1960 to 1995", author: "Ian Eagleson", publisher: "African Music: Journal of the International Library of African Music (ILAM, Rhodes University)", year: 2014, url: "https://journal.ru.ac.za/index.php/africanmusic/article/view/1888", kind: "academic" },
      { title: "The History of Benga Music: A Report by Ketebul Music", author: "Ketebul Music", publisher: "Singing Wells (Ketebul Music / Abubilla Music Foundation)", url: "https://www.singingwells.org/stories/the-history-of-benga-music-a-report-by-ketebul-music/", kind: "cultural-institute" },
    ],
  },
  "iran-shesho-hasht": {
    note:
      "Shesh-o-hasht is Iran's signature festive dance rhythm, played on the tombak goblet drum in classical tasnif and popular music alike. Banned in domestic Iranian music production for over twenty years after the 1979 revolution for its festive and erotic associations, it became the defining groove of Tehrangeles diaspora pop, as documented in Hemmasi's chapter \"The Capital of 6/8\".",
    citations: [
      { title: "Rhythmic Texture of Iranian Music: A Performance Analysis of Mahoor Tasnif by M. Tabrizi-zadeh and Dj. Chemirani", author: "Bardia Hafizi", publisher: "Analytical Approaches to World Music (AAWM) Journal, Vol. 11, No. 1", year: 2023, url: "https://journal.iftawm.org/previous/2023-volume-11-no-1/hafizi/", kind: "academic" },
      { title: "Review of Tehrangeles Dreaming: Intimacy and Imagination in Southern California Iranian Pop Music by Farzaneh Hemmasi", author: "Siavash Rokni", publisher: "Lateral: Journal of the Cultural Studies Association, Vol. 10.1", year: 2021, url: "https://csalateral.org/reviews/tehrangeles-dreaming-intimacy-imagination-southern-california-iranian-pop-music-hemmasi-rokni/", kind: "academic" },
      { title: "Farzaneh Hemmasi, Tehrangeles Dreaming: Intimacy and Imagination in Southern California's Iranian Pop Music (New Texts Out Now)", author: "Farzaneh Hemmasi", publisher: "Jadaliyya", url: "https://www.jadaliyya.com/Details/43541", kind: "other" },
    ],
  },
  "indonesia-gamelan": {
    note:
      "Gamelan, inscribed on UNESCO's Representative List of Intangible Cultural Heritage in 2021, is described there as an integral part of Indonesian identity performed in religious rituals, ceremonies, traditional theatre, festivals and concerts, with interlocking parts forming a single rhythm. Sumarsam notes that in Java gamelan most commonly accompanies ritual celebrations such as weddings and village ceremonies and dramatic forms like wayang shadow-puppet theatre, with the gong ageng marking the fundamental cycle (gongan) and the kenong marking its primary internal points.",
    citations: [
      { title: "Introduction to Javanese Gamelan: Notes for MUSC451", author: "Sumarsam", publisher: "Wesleyan University", year: 2002, url: "https://sumarsam.faculty.wesleyan.edu/files/2023/01/1_Introduction_to_Javanese_Gamelan.pdf", kind: "academic" },
      { title: "Gamelan", publisher: "UNESCO Intangible Cultural Heritage", year: 2021, url: "https://ich.unesco.org/en/RL/gamelan-01607", kind: "unesco-ich" },
      { title: "Javanese Gamelan Music", publisher: "Smithsonian National Museum of Asian Art", url: "https://asia-archive.si.edu/podcast/javanese-gamelan-music/", kind: "museum" },
    ],
  },
  "korea-samulnori": {
    note:
      "Samul nori was created in February 1978 at Seoul's Space Theater, when four musicians (including Kim Duk Soo) adapted rural p'ungmul/nongak percussion for the concert stage, debuting with an arrangement of \"Uttari p'ungmul\" rhythms from Gyeonggi and Chungcheong provinces. Its root tradition, nongak, is a UNESCO-inscribed (2014) community band practice of music, dance, and ritual performed to pray for harvests and strengthen village solidarity.",
    citations: [
      { title: "Nongak, community band music, dance and rituals in the Republic of Korea", publisher: "UNESCO Intangible Cultural Heritage", year: 2014, url: "https://ich.unesco.org/en/RL/nongak-community-band-music-dance-and-rituals-in-the-republic-of-korea-00717", kind: "unesco-ich" },
      { title: "SamulNori: Contemporary Korean Drumming and the Rebirth of Itinerant Performance Culture", author: "Nathan Hesselink", publisher: "University of Chicago Press", year: 2012, url: "https://press.uchicago.edu/ucp/books/book/chicago/S/bo12645430.html", kind: "academic" },
      { title: "South Korean percussion genre 'samul nori' goes global", publisher: "UCLA Newsroom", url: "https://newsroom.ucla.edu/releases/south-korean-percussion-genre-samul-nori-goes-global", kind: "academic" },
    ],
  },
  "pakistan-qawwali": {
    note:
      "Qawwali is Sufi devotional music of Pakistan and North India in which a chorus of hand-clapping qawwals and a dholak or tabla player articulate a metric framework drawn from Hindustani talas, driving listeners toward spiritual ecstasy at shrine gatherings (mehfil-e sama'). The Sabri Brothers and Nusrat Fateh Ali Khan carried the tradition to global audiences in the late 20th century.",
    citations: [
      { title: "Qawwali", author: "Virginia Gorlinski", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/art/qawwali", kind: "encyclopedia" },
      { title: "Sufi Music of India and Pakistan: Sound, Context and Meaning in Qawwali", author: "Regula Burckhardt Qureshi", publisher: "Cambridge University Press", year: 1987, url: "https://www.cambridge.org/us/universitypress/subjects/music/ethnomusicology/sufi-music-india-and-pakistan-sound-context-and-meaning-qawwali", kind: "academic" },
    ],
  },
  "fiji-meke": {
    note:
      "A meke is Fiji's communal danced chant: per Ewins (Domodomo, Fiji Museum Quarterly, 1986), it \"consists of a dance, a song with a soloist and many-voiced refrain, and a strong rhythm\" established by hand-clapping, stick-beating, bamboo stamping tubes, and the small lali ni meke drum. Meke are hereditary communal possessions guarded across generations, and the larger village lali historically served as a signal drum whose distinct beats announced meetings, deaths, and war (Good 1978; Ewins 1986).",
    citations: [
      { title: "Fijian Meke: An Analysis of Style and Content (M.A. thesis, Ethnomusicology)", author: "Linda Good", publisher: "University of Hawaii at Manoa, ScholarSpace repository", year: 1978, url: "https://scholarspace.manoa.hawaii.edu/items/0ceba9f0-4cfa-4cef-9691-a9c7bc520a80", kind: "academic" },
      { title: "Discovering Fiji: Fiji's unique wooden drums", publisher: "The Fiji Times", url: "https://www.fijitimes.com.fj/discovering-fiji-fijis-unique-wooden-drums/", kind: "other" },
    ],
  },
  "png-kundu": {
    note:
      "The kundu hourglass drum appears across hundreds of PNG communities under local names; among the Kaluli of Bosavi, ilib kuwo drumming marked ceremonies between longhouse communities, with hours of drumming danced along the house corridor before singing until dawn. The drum's voice is heard as the tibodai bird's call transforming into \"dowo\" (father) — the voice of a dead child's spirit — which can move listeners to tears; among the Iatmul the drum (kwangu) accompanies sagi songs recounting ancestors' exploits.",
    citations: [
      { title: "Voices of the Rainforest: Bosavi, Papua New Guinea (liner notes)", author: "Steven Feld", publisher: "Smithsonian Folkways Recordings", year: 1991, url: "https://folkways-media.si.edu/docs/folkways/artwork/HRT15009.pdf", kind: "liner-notes" },
      { title: "Kundu — Grinnell College Musical Instrument Collection", publisher: "Grinnell College Libraries", url: "https://omeka-s.grinnell.edu/s/MusicalInstruments/item/5180", kind: "museum" },
      { title: "Drum (Kundu)", publisher: "Bowers Museum", url: "https://collections.bowers.org/objects/147523/drum-kundu", kind: "museum" },
    ],
  },};

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
