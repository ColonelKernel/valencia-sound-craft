import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SiteLanguage = "en" | "es";

const STORAGE_KEY = "valencia-sound-craft-language";

const translations = {
  en: {
    "common.home": "Home",
    "common.services": "Services",
    "common.tools": "Tools",
    "common.interactiveTools": "Interactive Tools",
    "common.work": "Work",
    "common.about": "About",
    "common.contact": "Contact",
    "common.analytics": "Analytics",
    "common.loadingRoute": "Loading route…",
    "common.language": "Language",
    "common.switchToSpanish": "Ver en español",
    "common.switchToEnglish": "View in English",
    "common.english": "EN",
    "common.spanish": "ES",
    "common.rights": "All rights reserved.",
    "nav.toggleMenu": "Toggle menu",
    "hero.eyebrow": "Creative Technologist",
    "hero.titleLine1": "Music, Data, and",
    "hero.titleLine2": "Interactive Systems",
    "hero.description":
      "I design and build systems for understanding, generating, and interacting with music — from intelligent recommendation engines to playable audiovisual instruments.",
    "hero.exploreTools": "Explore Tools",
    "hero.viewAnalytics": "View Analytics",
    "hero.listen": "Listen",
    "services.eyebrow": "Capabilities",
    "services.title": "What I Build",
    "services.data.title": "Data Analysis",
    "services.data.point1": "Streaming analytics dashboards and catalog intelligence",
    "services.data.point2": "Recommendation systems and behavioral modeling",
    "services.data.point3": "Time-series forecasting and reporting tools",
    "services.music.title": "Digital Music Tools",
    "services.music.point1": "Generative engines and real-time audiovisual instruments",
    "services.music.point2": "Playable interfaces — maps, rhythm engines, synthesis systems",
    "services.music.point3": "Position-constrained improvisation and fretboard intelligence",
    "services.web.title": "Web Design",
    "services.web.point1": "Editorial, product-grade interfaces with motion and interaction",
    "services.web.point2": "Custom React + TypeScript applications and design systems",
    "services.web.point3": "Performance-tuned, responsive, and SEO-ready builds",
    "systems.eyebrow": "Systems",
    "systems.title": "Interactive Music Tools, Routed as One System",
    "systems.description":
      "Open each workspace directly, share links to exact tools, and keep rhythm, harmony, and transport state connected across the app.",
    "systems.featuredBadge": "Responsive Groove Atlas",
    "systems.openGroove": "Open Groove Atlas",
    "systems.openTool": "Open tool",
    "systems.card.groove.title": "Groove Intelligence Lab",
    "systems.card.groove.description":
      "Browse a lightweight groove atlas with responsive feel cards, quick playback previews, and an optional desktop field view.",
    "systems.card.amie.title": "Adaptive Music Intelligence Engine",
    "systems.card.amie.description":
      "Hybrid music recommendation demo blending audio features, listening behavior, explainability, and artist-style controls.",
    "systems.card.transit.title": "TransitSynth",
    "systems.card.transit.description":
      "Playable cities engine that maps transit graphs to pitch, rhythm, sequencing, and real-time synthesis.",
    "systems.card.rhythm.title": "Rhythm Engine",
    "systems.card.rhythm.description":
      "Atlas-backed sequencing, cultural rhythm identity, and direct-play composition tools.",
    "systems.card.harmony.title": "Harmony Lab",
    "systems.card.harmony.description": "Mode visualization, chord building, notation, and practice tools in one workspace.",
    "systems.card.map.title": "Rhythm Map",
    "systems.card.map.description": "Go from geographic selection to playable rhythm state without hidden UI steps.",
    "systems.card.circle.title": "Circle of Fifths",
    "systems.card.circle.description": "Interactive key relationships with shared global key and mode state.",
    "systems.card.tonnetz.title": "Tonnetz",
    "systems.card.tonnetz.description":
      "Neo-Riemannian harmonic motion with shared tempo, transport, and tonal center.",
    "analytics.eyebrow": "Analytics Lab",
    "analytics.title": "Music Catalog Intelligence",
    "analytics.description":
      "A collection of tools and dashboards for analyzing music performance, audience behavior, and catalog dynamics. Designed to simulate real-world music platform and catalog analytics environments.",
    "analytics.open": "Open Dashboard",
    "analytics.metric.acquisition.label": "Acquisition Scoring",
    "analytics.metric.acquisition.value": "0–100",
    "analytics.metric.acquisition.desc": "Weighted model evaluating growth, volatility, longevity & momentum",
    "analytics.metric.revenue.label": "Revenue Forecasting",
    "analytics.metric.revenue.value": "Linear Regression",
    "analytics.metric.revenue.desc": "Stream-to-revenue projections with confidence bands",
    "analytics.metric.risk.label": "Risk Analysis",
    "analytics.metric.risk.value": "Rolling Variance",
    "analytics.metric.risk.desc": "Volatility tracking and catalog diversification scoring",
    "analytics.metric.catalog.label": "Catalog Depth",
    "analytics.metric.catalog.value": "Album Distribution",
    "analytics.metric.catalog.desc": "Playcount concentration across discography",
    "portfolio.eyebrow": "Audio",
    "portfolio.title": "Selected Audio Work",
    "about.approach.eyebrow": "Approach",
    "about.approach.copy":
      "My work focuses on music as a system — something that can be modeled, transformed, and reimagined through computation. I build tools that bridge artistic intuition with data-driven structure, creating new ways to explore and interact with sound.",
    "about.direction.eyebrow": "Current Direction",
    "about.direction.copy":
      "Currently developing systems at the intersection of music technology, data infrastructure, and creative tooling — with a focus on scalable, interactive applications.",
    "about.background.eyebrow": "Background",
    "about.berklee.degree": "M.A. Music Production, Technology & Innovation",
    "about.ucla.degree": "Master of Public Policy",
    "about.mit.degree": "Applied Data Science Program",
    "about.grinnell.degree": "Bachelor of Arts",
    "contact.eyebrow": "Contact",
    "contact.title": "Get in Touch",
    "contact.copy": "Open to collaborations, technical roles, and projects in music, media, and data.",
    "contact.thanks": "Thank you!",
    "contact.sent": "Your message has been sent. I'll be in touch soon.",
    "contact.name": "Name",
    "contact.namePlaceholder": "Your name",
    "contact.email": "Email",
    "contact.projectType": "Project Type",
    "contact.selectProject": "Select a project type",
    "contact.technical": "Technical Collaboration",
    "contact.data": "Data / Analytics Project",
    "contact.musicTech": "Music Technology",
    "contact.audio": "Audio / Sound Design",
    "contact.other": "Other",
    "contact.message": "Message",
    "contact.messagePlaceholder": "Tell me about your project...",
    "footer.tagline": "Building at the intersection of music, data, and interaction.",
    "notFound.message": "Oops! Page not found",
    "notFound.return": "Return to Home",
    "seo.home.title": "ZS — Music, Data & Interactive Systems",
    "seo.home.description":
      "Creative technologist building systems for understanding, generating, and interacting with music — from intelligent engines to playable audiovisual instruments.",
    "seo.home.schemaName": "ZS — Music, Data & Interactive Systems",
    "seo.home.schemaDescription":
      "A creative music technology site featuring interactive rhythm and harmony systems, analytics dashboards, and sound design tools.",
    "tools.overview.label": "Overview",
    "tools.overview.title": "Tools Overview",
    "tools.rhythm.label": "Rhythm",
    "tools.rhythm.title": "Rhythm Engine",
    "tools.rhythm.description": "Play, browse, and sequence global rhythm structures from a shared atlas-backed state.",
    "tools.harmony.label": "Harmony",
    "tools.harmony.title": "Harmony Lab",
    "tools.harmony.description": "Visualize scales, build progressions, and practice against the shared transport.",
    "tools.map.label": "Map",
    "tools.map.title": "Rhythm Map",
    "tools.map.description": "Jump straight into the atlas and keep region, rhythm, and playback aligned.",
    "tools.circle.label": "Circle",
    "tools.circle.title": "Circle of Fifths",
    "tools.circle.description": "Explore related keys while updating the shared tonal center.",
    "tools.tonnetz.label": "Tonnetz",
    "tools.tonnetz.title": "Tonnetz",
    "tools.tonnetz.description":
      "Navigate harmonic space with the same key, tempo, and transport as the rest of the app.",
    "tools.chordAtlas.label": "Chord Atlas",
    "tools.chordAtlas.title": "Chord Atlas",
    "tools.chordAtlas.description":
      "Map every chord in any key to the guitar neck with voicings, functions, and interval colors.",
    "tools.index.seoTitle": "Music Tools | Valencia Sound Craft",
    "tools.index.seoDescription":
      "Explore the full Valencia Sound Craft tool system through direct routes for rhythm, harmony, map, circle, and Tonnetz workspaces.",
    "tools.index.heading": "One Music System, Multiple Direct Routes",
    "tools.index.copy":
      "Open the exact workspace you need without going through a page-level dropdown. The routes below share musical state so key, rhythm, tempo, and transport stay coherent across the app.",
    "tools.index.summary":
      "The tool system now exposes semantic pages for rhythm, harmony, atlas navigation, the circle of fifths, and Tonnetz exploration. Each page includes readable content, metadata, and direct-link routing so the experience is easier to navigate and index.",
    "tools.index.openRoute": "Open route",
    "tools.breadcrumb.home": "Home",
    "tools.breadcrumb.tools": "Tools",
    "tools.rhythm.routeDescription":
      "A routed, shared-state rhythm workspace that keeps the atlas, browser, tempo, and transport in sync.",
    "tools.rhythm.summary1":
      "This route keeps the rhythm browser, map selection, sequencer, and playback transport on one shared state model.",
    "tools.rhythm.summary2":
      "Rhythm selection updates the global region and rhythm identifiers directly, so the map and sequencer describe the same musical object instead of competing states.",
    "tools.rhythm.activePrefix": "The active rhythm is",
    "tools.rhythm.at": "at",
    "tools.rhythm.uiTitle": "Unified Rhythm Engine",
    "tools.rhythm.current": "Current rhythm",
    "tools.rhythm.sharedTempo": "Shared tempo",
    "tools.rhythm.sourceThread": "Source thread",
    "tools.rhythm.classicTitle": "Classic Groove Workspace",
    "tools.rhythm.classicCopy":
      "The original drum-machine editor remains available inside the new route structure so legacy workflows stay intact.",
    "tools.harmony.routeDescription":
      "A direct harmony route for visualizing scales, building progressions, and practicing with shared tempo and transport.",
    "tools.harmony.summary1": "The harmony workspace is centered on",
    "tools.harmony.summary2":
      "The active chord progression is stored globally, so other harmony routes can reflect the same musical context without requiring the old one-page tool switcher.",
    "tools.harmony.uiTitle": "Shared Harmony Workspace",
    "tools.harmony.uiCopy":
      "Key, mode, tempo, and transport now come from the shared store, while the existing visualizer and builders keep their established workflow.",
    "tools.map.eyebrow": "Atlas",
    "tools.map.routeDescription":
      "A direct URL into the atlas-first experience, backed by the same rhythm state and playback transport as the sequencer.",
    "tools.map.summary1":
      "The map route exposes readable rhythm metadata alongside the interactive atlas so search engines and musicians can both understand the current state without opening hidden controls.",
    "tools.map.summary2Prefix": "The selected region is",
    "tools.map.summary2Suffix":
      "and the active rhythm stays synchronized with the rhythm route through the shared store.",
    "tools.map.loading": "Loading atlas…",
    "tools.map.uiTitle": "Atlas-Driven Rhythm Selection",
    "tools.map.uiCopy":
      "Country selection, browser filters, and the active sequencer all resolve to one shared rhythm identity.",
    "tools.circle.routeDescription":
      "A dedicated harmony route that shares the current key and mode with the rest of the music system.",
    "tools.circle.summary1Prefix": "The current shared tonal center is",
    "tools.circle.summary1In": "in",
    "tools.circle.summary2":
      "Any key choice made in this route propagates to the harmony workspace and the Tonnetz, keeping the system musically coherent across direct links.",
    "tools.circle.uiTitle": "Shared Harmonic Center",
    "tools.circle.uiCopy":
      "Selecting a key here updates the harmony route and Tonnetz immediately through the global music store.",
    "tools.tonnetz.routeDescription": "A direct harmonic-space route with shared key, tempo, and transport state.",
    "tools.tonnetz.summary1Prefix": "The Tonnetz is currently aligned to",
    "tools.tonnetz.summary2":
      "Shared tempo and transport let Tonnetz playback cooperate with the rhythm and harmony routes instead of running as an isolated subsystem.",
    "tools.tonnetz.uiTitle": "Harmonic Space",
    "tools.tonnetz.uiCopy":
      "Tonnetz transformations now follow the shared tonal center and transport timing used across the rest of the tool suite.",
    "tools.chordAtlas.routeDescription":
      "Navigate every chord in any key. See harmonic functions, voicings, interval colors, and hand-position intelligence mapped to the guitar neck.",
    "tools.chordAtlas.summaryPrefix": "Exploring chords in",
    "tools.chordAtlas.handActive": "Hand Mapping Engine active — finger assignments and position zones are locked on.",
    "tools.chordAtlas.improvActive": "Improvisation engine active.",
    "tools.chordAtlas.selectAny": "Select any chord to see voicings, intervals, and fretboard mapping.",
    "tools.chordAtlas.handEyebrow": "Biomechanical layer",
    "tools.chordAtlas.handTitle": "Hand Mapping Engine",
    "tools.chordAtlas.handCopy": "Finger numbers, active position zones, and stay-in-position guidance are now active.",
    "tools.chordAtlas.learning": "Learning Mode",
    "tools.chordAtlas.transitionFallbackSelected":
      "Select another chord to see transition analysis, or enable Learning Mode above.",
    "tools.chordAtlas.transitionFallbackEmpty":
      "Pick a chord to start. Enable Learning Mode for step-by-step finger placement.",
    "tools.chordAtlas.mode.atlas": "Chord Atlas",
    "tools.chordAtlas.mode.hand": "Hand Mapping Engine",
    "tools.chordAtlas.mode.improv": "Improvisation Engine",
    "tools.chordAtlas.mode.navigator": "Mode Navigator",
    "tools.chordAtlas.loadingImprov": "Loading improvisation engine…",
    "tools.loadingWorkspace": "Loading tool workspace…",
  },
  es: {
    "common.home": "Inicio",
    "common.services": "Servicios",
    "common.tools": "Herramientas",
    "common.interactiveTools": "Herramientas interactivas",
    "common.work": "Trabajos",
    "common.about": "Acerca de",
    "common.contact": "Contacto",
    "common.analytics": "Analítica",
    "common.loadingRoute": "Cargando ruta…",
    "common.language": "Idioma",
    "common.switchToSpanish": "Ver en español",
    "common.switchToEnglish": "View in English",
    "common.english": "EN",
    "common.spanish": "ES",
    "common.rights": "Todos los derechos reservados.",
    "nav.toggleMenu": "Abrir o cerrar menú",
    "hero.eyebrow": "Tecnólogo creativo",
    "hero.titleLine1": "Música, datos y",
    "hero.titleLine2": "sistemas interactivos",
    "hero.description":
      "Diseño y construyo sistemas para entender, generar e interactuar con la música: desde motores inteligentes de recomendación hasta instrumentos audiovisuales tocables.",
    "hero.exploreTools": "Explorar herramientas",
    "hero.viewAnalytics": "Ver analítica",
    "hero.listen": "Escuchar",
    "services.eyebrow": "Capacidades",
    "services.title": "Lo que construyo",
    "services.data.title": "Análisis de datos",
    "services.data.point1": "Dashboards de streaming e inteligencia de catálogos",
    "services.data.point2": "Sistemas de recomendación y modelado de comportamiento",
    "services.data.point3": "Pronóstico de series temporales y herramientas de informes",
    "services.music.title": "Herramientas musicales digitales",
    "services.music.point1": "Motores generativos e instrumentos audiovisuales en tiempo real",
    "services.music.point2": "Interfaces tocables: mapas, motores rítmicos y sistemas de síntesis",
    "services.music.point3": "Improvisación con restricciones de posición e inteligencia de diapasón",
    "services.web.title": "Diseño web",
    "services.web.point1": "Interfaces editoriales y de producto con movimiento e interacción",
    "services.web.point2": "Aplicaciones React + TypeScript y sistemas de diseño a medida",
    "services.web.point3": "Sitios responsivos, optimizados para rendimiento y preparados para SEO",
    "systems.eyebrow": "Sistemas",
    "systems.title": "Herramientas musicales interactivas, conectadas como un solo sistema",
    "systems.description":
      "Abre cada espacio de trabajo directamente, comparte enlaces a herramientas exactas y mantiene conectados el ritmo, la armonía y el transporte en toda la app.",
    "systems.featuredBadge": "Atlas de groove responsivo",
    "systems.openGroove": "Abrir atlas de groove",
    "systems.openTool": "Abrir herramienta",
    "systems.card.groove.title": "Laboratorio de inteligencia de groove",
    "systems.card.groove.description":
      "Explora un atlas ligero de grooves con tarjetas de feel responsivas, preescuchas rápidas y una vista de campo opcional para escritorio.",
    "systems.card.amie.title": "Motor adaptativo de inteligencia musical",
    "systems.card.amie.description":
      "Demo híbrida de recomendación musical que combina rasgos de audio, hábitos de escucha, explicabilidad y controles de estilo de artista.",
    "systems.card.transit.title": "TransitSynth",
    "systems.card.transit.description":
      "Motor de ciudades tocable que convierte grafos de transporte en altura, ritmo, secuenciación y síntesis en tiempo real.",
    "systems.card.rhythm.title": "Motor rítmico",
    "systems.card.rhythm.description":
      "Secuenciación basada en atlas, identidad rítmica cultural y herramientas de composición con reproducción directa.",
    "systems.card.harmony.title": "Laboratorio de armonía",
    "systems.card.harmony.description":
      "Visualización de modos, construcción de acordes, notación y práctica en un solo espacio.",
    "systems.card.map.title": "Mapa rítmico",
    "systems.card.map.description":
      "Pasa de una selección geográfica a un estado rítmico reproducible sin pasos de interfaz ocultos.",
    "systems.card.circle.title": "Círculo de quintas",
    "systems.card.circle.description": "Relaciones tonales interactivas con estado global compartido de tonalidad y modo.",
    "systems.card.tonnetz.title": "Tonnetz",
    "systems.card.tonnetz.description":
      "Movimiento armónico neo-riemanniano con tempo, transporte y centro tonal compartidos.",
    "analytics.eyebrow": "Laboratorio de analítica",
    "analytics.title": "Inteligencia de catálogos musicales",
    "analytics.description":
      "Una colección de herramientas y dashboards para analizar rendimiento musical, comportamiento de audiencia y dinámicas de catálogo. Diseñada para simular entornos reales de analítica de plataformas y catálogos musicales.",
    "analytics.open": "Abrir dashboard",
    "analytics.metric.acquisition.label": "Puntuación de adquisición",
    "analytics.metric.acquisition.value": "0–100",
    "analytics.metric.acquisition.desc":
      "Modelo ponderado que evalúa crecimiento, volatilidad, longevidad e impulso",
    "analytics.metric.revenue.label": "Pronóstico de ingresos",
    "analytics.metric.revenue.value": "Regresión lineal",
    "analytics.metric.revenue.desc": "Proyecciones de streams a ingresos con bandas de confianza",
    "analytics.metric.risk.label": "Análisis de riesgo",
    "analytics.metric.risk.value": "Varianza móvil",
    "analytics.metric.risk.desc": "Seguimiento de volatilidad y puntuación de diversificación del catálogo",
    "analytics.metric.catalog.label": "Profundidad del catálogo",
    "analytics.metric.catalog.value": "Distribución por álbum",
    "analytics.metric.catalog.desc": "Concentración de reproducciones en la discografía",
    "portfolio.eyebrow": "Audio",
    "portfolio.title": "Trabajos de audio seleccionados",
    "about.approach.eyebrow": "Enfoque",
    "about.approach.copy":
      "Mi trabajo se centra en la música como sistema: algo que puede modelarse, transformarse y reimaginarse mediante computación. Construyo herramientas que conectan la intuición artística con estructuras basadas en datos, creando nuevas formas de explorar e interactuar con el sonido.",
    "about.direction.eyebrow": "Dirección actual",
    "about.direction.copy":
      "Actualmente desarrollo sistemas en la intersección entre tecnología musical, infraestructura de datos y herramientas creativas, con foco en aplicaciones escalables e interactivas.",
    "about.background.eyebrow": "Formación",
    "about.berklee.degree": "M.A. Producción musical, tecnología e innovación",
    "about.ucla.degree": "Máster en políticas públicas",
    "about.mit.degree": "Programa de ciencia de datos aplicada",
    "about.grinnell.degree": "Bachelor of Arts",
    "contact.eyebrow": "Contacto",
    "contact.title": "Ponte en contacto",
    "contact.copy": "Abierto a colaboraciones, roles técnicos y proyectos en música, medios y datos.",
    "contact.thanks": "¡Gracias!",
    "contact.sent": "Tu mensaje se ha enviado. Me pondré en contacto pronto.",
    "contact.name": "Nombre",
    "contact.namePlaceholder": "Tu nombre",
    "contact.email": "Correo electrónico",
    "contact.projectType": "Tipo de proyecto",
    "contact.selectProject": "Selecciona un tipo de proyecto",
    "contact.technical": "Colaboración técnica",
    "contact.data": "Proyecto de datos / analítica",
    "contact.musicTech": "Tecnología musical",
    "contact.audio": "Audio / diseño sonoro",
    "contact.other": "Otro",
    "contact.message": "Mensaje",
    "contact.messagePlaceholder": "Cuéntame sobre tu proyecto...",
    "footer.tagline": "Construyendo en la intersección de música, datos e interacción.",
    "notFound.message": "¡Ups! Página no encontrada",
    "notFound.return": "Volver al inicio",
    "seo.home.title": "ZS — Música, datos y sistemas interactivos",
    "seo.home.description":
      "Tecnólogo creativo que construye sistemas para entender, generar e interactuar con la música: desde motores inteligentes hasta instrumentos audiovisuales tocables.",
    "seo.home.schemaName": "ZS — Música, datos y sistemas interactivos",
    "seo.home.schemaDescription":
      "Sitio de tecnología musical creativa con sistemas interactivos de ritmo y armonía, dashboards de analítica y herramientas de diseño sonoro.",
    "tools.overview.label": "Resumen",
    "tools.overview.title": "Resumen de herramientas",
    "tools.rhythm.label": "Ritmo",
    "tools.rhythm.title": "Motor rítmico",
    "tools.rhythm.description":
      "Reproduce, explora y secuencia estructuras rítmicas globales desde un estado compartido basado en atlas.",
    "tools.harmony.label": "Armonía",
    "tools.harmony.title": "Laboratorio de armonía",
    "tools.harmony.description": "Visualiza escalas, crea progresiones y practica con el transporte compartido.",
    "tools.map.label": "Mapa",
    "tools.map.title": "Mapa rítmico",
    "tools.map.description": "Entra directamente al atlas y mantén región, ritmo y reproducción alineados.",
    "tools.circle.label": "Círculo",
    "tools.circle.title": "Círculo de quintas",
    "tools.circle.description": "Explora tonalidades relacionadas mientras actualizas el centro tonal compartido.",
    "tools.tonnetz.label": "Tonnetz",
    "tools.tonnetz.title": "Tonnetz",
    "tools.tonnetz.description":
      "Navega el espacio armónico con la misma tonalidad, tempo y transporte del resto de la app.",
    "tools.chordAtlas.label": "Atlas de acordes",
    "tools.chordAtlas.title": "Atlas de acordes",
    "tools.chordAtlas.description":
      "Mapea cada acorde en cualquier tonalidad al mástil de la guitarra con voicings, funciones y colores de intervalo.",
    "tools.index.seoTitle": "Herramientas musicales | Valencia Sound Craft",
    "tools.index.seoDescription":
      "Explora todo el sistema de herramientas de Valencia Sound Craft mediante rutas directas para ritmo, armonía, mapa, círculo y Tonnetz.",
    "tools.index.heading": "Un sistema musical, múltiples rutas directas",
    "tools.index.copy":
      "Abre el espacio exacto que necesitas sin pasar por un desplegable de página. Las rutas siguientes comparten estado musical para que tonalidad, ritmo, tempo y transporte se mantengan coherentes en toda la app.",
    "tools.index.summary":
      "El sistema de herramientas ahora expone páginas semánticas para ritmo, armonía, navegación del atlas, círculo de quintas y exploración Tonnetz. Cada página incluye contenido legible, metadatos y rutas directas para que la experiencia sea más fácil de navegar e indexar.",
    "tools.index.openRoute": "Abrir ruta",
    "tools.breadcrumb.home": "Inicio",
    "tools.breadcrumb.tools": "Herramientas",
    "tools.rhythm.routeDescription":
      "Un espacio rítmico con ruta propia y estado compartido que mantiene sincronizados atlas, navegador, tempo y transporte.",
    "tools.rhythm.summary1":
      "Esta ruta mantiene el navegador de ritmos, la selección de mapa, el secuenciador y el transporte de reproducción sobre un único modelo de estado compartido.",
    "tools.rhythm.summary2":
      "La selección rítmica actualiza directamente la región global y los identificadores de ritmo, de modo que el mapa y el secuenciador describen el mismo objeto musical en vez de estados enfrentados.",
    "tools.rhythm.activePrefix": "El ritmo activo es",
    "tools.rhythm.at": "a",
    "tools.rhythm.uiTitle": "Motor rítmico unificado",
    "tools.rhythm.current": "Ritmo actual",
    "tools.rhythm.sharedTempo": "Tempo compartido",
    "tools.rhythm.sourceThread": "Hilo fuente",
    "tools.rhythm.classicTitle": "Espacio clásico de groove",
    "tools.rhythm.classicCopy":
      "El editor original de caja de ritmos sigue disponible dentro de la nueva estructura de rutas para mantener los flujos de trabajo existentes.",
    "tools.harmony.routeDescription":
      "Una ruta directa de armonía para visualizar escalas, crear progresiones y practicar con tempo y transporte compartidos.",
    "tools.harmony.summary1": "El espacio de armonía está centrado en",
    "tools.harmony.summary2":
      "La progresión de acordes activa se guarda globalmente, para que otras rutas de armonía reflejen el mismo contexto musical sin depender del antiguo selector de una sola página.",
    "tools.harmony.uiTitle": "Espacio de armonía compartido",
    "tools.harmony.uiCopy":
      "Tonalidad, modo, tempo y transporte ahora vienen del estado compartido, mientras el visualizador y los constructores existentes conservan su flujo de trabajo.",
    "tools.map.eyebrow": "Atlas",
    "tools.map.routeDescription":
      "Una URL directa a la experiencia centrada en el atlas, respaldada por el mismo estado rítmico y transporte de reproducción que el secuenciador.",
    "tools.map.summary1":
      "La ruta del mapa expone metadatos rítmicos legibles junto al atlas interactivo para que motores de búsqueda y músicos entiendan el estado actual sin abrir controles ocultos.",
    "tools.map.summary2Prefix": "La región seleccionada es",
    "tools.map.summary2Suffix":
      "y el ritmo activo permanece sincronizado con la ruta de ritmo mediante el estado compartido.",
    "tools.map.loading": "Cargando atlas…",
    "tools.map.uiTitle": "Selección rítmica basada en atlas",
    "tools.map.uiCopy":
      "La selección de país, los filtros del navegador y el secuenciador activo resuelven una sola identidad rítmica compartida.",
    "tools.circle.routeDescription":
      "Una ruta dedicada de armonía que comparte la tonalidad y el modo actuales con el resto del sistema musical.",
    "tools.circle.summary1Prefix": "El centro tonal compartido actual es",
    "tools.circle.summary1In": "en",
    "tools.circle.summary2":
      "Cualquier tonalidad elegida en esta ruta se propaga al espacio de armonía y al Tonnetz, manteniendo el sistema musicalmente coherente entre enlaces directos.",
    "tools.circle.uiTitle": "Centro armónico compartido",
    "tools.circle.uiCopy":
      "Seleccionar una tonalidad aquí actualiza de inmediato la ruta de armonía y el Tonnetz mediante el estado musical global.",
    "tools.tonnetz.routeDescription": "Una ruta directa de espacio armónico con tonalidad, tempo y transporte compartidos.",
    "tools.tonnetz.summary1Prefix": "El Tonnetz está alineado actualmente con",
    "tools.tonnetz.summary2":
      "El tempo y el transporte compartidos permiten que la reproducción del Tonnetz coopere con las rutas de ritmo y armonía en lugar de funcionar como subsistema aislado.",
    "tools.tonnetz.uiTitle": "Espacio armónico",
    "tools.tonnetz.uiCopy":
      "Las transformaciones Tonnetz ahora siguen el centro tonal compartido y el tiempo de transporte usado en el resto del conjunto de herramientas.",
    "tools.chordAtlas.routeDescription":
      "Navega todos los acordes en cualquier tonalidad. Consulta funciones armónicas, voicings, colores de intervalo e inteligencia de posición de mano mapeada al mástil.",
    "tools.chordAtlas.summaryPrefix": "Explorando acordes en",
    "tools.chordAtlas.handActive":
      "Motor de mapeo de mano activo: asignaciones de dedos y zonas de posición bloqueadas.",
    "tools.chordAtlas.improvActive": "Motor de improvisación activo.",
    "tools.chordAtlas.selectAny": "Selecciona cualquier acorde para ver voicings, intervalos y mapeo en el mástil.",
    "tools.chordAtlas.handEyebrow": "Capa biomecánica",
    "tools.chordAtlas.handTitle": "Motor de mapeo de mano",
    "tools.chordAtlas.handCopy": "Los números de dedos, las zonas de posición activas y la guía de permanecer en posición están activos.",
    "tools.chordAtlas.learning": "Modo de aprendizaje",
    "tools.chordAtlas.transitionFallbackSelected":
      "Selecciona otro acorde para ver el análisis de transición, o activa el modo de aprendizaje arriba.",
    "tools.chordAtlas.transitionFallbackEmpty":
      "Elige un acorde para empezar. Activa el modo de aprendizaje para colocar los dedos paso a paso.",
    "tools.chordAtlas.mode.atlas": "Atlas de acordes",
    "tools.chordAtlas.mode.hand": "Motor de mapeo de mano",
    "tools.chordAtlas.mode.improv": "Motor de improvisación",
    "tools.chordAtlas.mode.navigator": "Navegador de modos",
    "tools.chordAtlas.loadingImprov": "Cargando motor de improvisación…",
    "tools.loadingWorkspace": "Cargando espacio de herramienta…",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: SiteLanguage;
  setLanguage: (language: SiteLanguage) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): SiteLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }

  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SiteLanguage>(getInitialLanguage);

  const setLanguage = (nextLanguage: SiteLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "es" : "en"),
      t: (key) => translations[language][key] ?? translations.en[key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

