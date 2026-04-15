export interface TransitStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lines: string[];
  degree: number;
  connections: string[];
}

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  stations: string[];
}

export type TransitStyleMode =
  | "cartographic"
  | "berlin-techno"
  | "nyc-jazz-chaos"
  | "tokyo-minimal-precision"
  | "cinematic-drift";

export interface TransitNetwork {
  id: string;
  city: string;
  network: string;
  shortLabel: string;
  defaultStyleMode: TransitStyleMode;
  description: string;
  stations: TransitStation[];
  lines: TransitLine[];
}

interface RawTransitStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface RawTransitNetwork {
  id: string;
  city: string;
  network: string;
  shortLabel: string;
  defaultStyleMode: TransitStyleMode;
  description: string;
  stations: RawTransitStation[];
  lines: TransitLine[];
}

function hydrateTransitNetwork(raw: RawTransitNetwork): TransitNetwork {
  const stationLookup = new Map(raw.stations.map((station) => [station.id, station]));
  const connectionLookup = new Map<string, Set<string>>();
  const lineMembershipLookup = new Map<string, Set<string>>();

  raw.stations.forEach((station) => {
    connectionLookup.set(station.id, new Set());
    lineMembershipLookup.set(station.id, new Set());
  });

  raw.lines.forEach((line) => {
    line.stations.forEach((stationId, index) => {
      lineMembershipLookup.get(stationId)?.add(line.id);

      if (index > 0) {
        connectionLookup.get(stationId)?.add(line.stations[index - 1]);
      }

      if (index < line.stations.length - 1) {
        connectionLookup.get(stationId)?.add(line.stations[index + 1]);
      }
    });
  });

  return {
    ...raw,
    stations: raw.stations.map((station) => ({
      ...station,
      lines: [...(lineMembershipLookup.get(station.id) ?? new Set())],
      connections: [...(connectionLookup.get(station.id) ?? new Set())],
      degree: (connectionLookup.get(station.id) ?? new Set()).size,
    })),
  };
}

const rawTransitNetworks: RawTransitNetwork[] = [
  {
    id: "bart",
    city: "San Francisco Bay Area",
    network: "Bay Area Rapid Transit",
    shortLabel: "BART",
    defaultStyleMode: "cartographic",
    description:
      "The default synth preset: broad east-west lines, a tight downtown tunnel, and clean transfer behavior that turns into sequenced harmonic arcs.",
    stations: [
      { id: "richmond", name: "Richmond", lat: 37.9369, lon: -122.3530 },
      { id: "downtown-berkeley", name: "Downtown Berkeley", lat: 37.8701, lon: -122.2681 },
      { id: "rockridge", name: "Rockridge", lat: 37.8444, lon: -122.2524 },
      { id: "macarthur", name: "MacArthur", lat: 37.8291, lon: -122.2670 },
      { id: "oakland-city-center", name: "12th St Oakland City Center", lat: 37.8037, lon: -122.2716 },
      { id: "west-oakland", name: "West Oakland", lat: 37.8048, lon: -122.2951 },
      { id: "embarcadero", name: "Embarcadero", lat: 37.7929, lon: -122.3971 },
      { id: "montgomery", name: "Montgomery St", lat: 37.7894, lon: -122.4011 },
      { id: "mission-24th", name: "24th St Mission", lat: 37.7525, lon: -122.4185 },
      { id: "balboa-park", name: "Balboa Park", lat: 37.7219, lon: -122.4474 },
      { id: "daly-city", name: "Daly City", lat: 37.7061, lon: -122.4691 },
      { id: "walnut-creek", name: "Walnut Creek", lat: 37.9057, lon: -122.0674 },
    ],
    lines: [
      {
        id: "bart-red",
        name: "Red Line",
        color: "#d92d27",
        stations: [
          "richmond",
          "downtown-berkeley",
          "macarthur",
          "oakland-city-center",
          "west-oakland",
          "embarcadero",
          "montgomery",
          "mission-24th",
          "balboa-park",
          "daly-city",
        ],
      },
      {
        id: "bart-yellow",
        name: "Yellow Line",
        color: "#f7c948",
        stations: [
          "walnut-creek",
          "rockridge",
          "macarthur",
          "oakland-city-center",
          "west-oakland",
          "embarcadero",
          "montgomery",
          "mission-24th",
          "balboa-park",
          "daly-city",
        ],
      },
      {
        id: "bart-blue",
        name: "Blue Line",
        color: "#3b82f6",
        stations: [
          "daly-city",
          "balboa-park",
          "mission-24th",
          "montgomery",
          "embarcadero",
          "west-oakland",
          "oakland-city-center",
          "macarthur",
          "rockridge",
          "walnut-creek",
        ],
      },
    ],
  },
  {
    id: "london-underground",
    city: "London",
    network: "London Underground",
    shortLabel: "London Underground",
    defaultStyleMode: "cinematic-drift",
    description:
      "Dense transfer nodes and closely packed lines create harmonic clusters that feel orchestral even before the synth takes over.",
    stations: [
      { id: "paddington", name: "Paddington", lat: 51.5154, lon: -0.1755 },
      { id: "baker-street", name: "Baker Street", lat: 51.5226, lon: -0.1571 },
      { id: "oxford-circus", name: "Oxford Circus", lat: 51.5152, lon: -0.1419 },
      { id: "green-park", name: "Green Park", lat: 51.5067, lon: -0.1428 },
      { id: "victoria", name: "Victoria", lat: 51.4965, lon: -0.1439 },
      { id: "waterloo", name: "Waterloo", lat: 51.5036, lon: -0.1143 },
      { id: "westminster", name: "Westminster", lat: 51.5010, lon: -0.1247 },
      { id: "kings-cross", name: "King's Cross St Pancras", lat: 51.5307, lon: -0.1238 },
      { id: "liverpool-street", name: "Liverpool Street", lat: 51.5186, lon: -0.0813 },
      { id: "canary-wharf", name: "Canary Wharf", lat: 51.5051, lon: -0.0209 },
    ],
    lines: [
      {
        id: "london-bakerloo",
        name: "Bakerloo Line",
        color: "#b26300",
        stations: ["paddington", "baker-street", "oxford-circus", "waterloo"],
      },
      {
        id: "london-victoria",
        name: "Victoria Line",
        color: "#0098d4",
        stations: ["kings-cross", "oxford-circus", "green-park", "victoria"],
      },
      {
        id: "london-jubilee",
        name: "Jubilee Line",
        color: "#7c878e",
        stations: ["baker-street", "green-park", "westminster", "waterloo", "canary-wharf"],
      },
      {
        id: "london-central",
        name: "Central Line",
        color: "#dc241f",
        stations: ["oxford-circus", "liverpool-street"],
      },
    ],
  },
  {
    id: "nyc-subway",
    city: "New York City",
    network: "NYC Subway",
    shortLabel: "NYC Subway",
    defaultStyleMode: "nyc-jazz-chaos",
    description:
      "Transfer-heavy geometry and diagonals create restless, syncopated traversals. It is the preset for jazz-chaos and subway-polyrhythm energy.",
    stations: [
      { id: "times-square", name: "Times Sq-42 St", lat: 40.7553, lon: -73.9870 },
      { id: "herald-square", name: "34 St-Herald Sq", lat: 40.7496, lon: -73.9879 },
      { id: "grand-central", name: "Grand Central-42 St", lat: 40.7527, lon: -73.9772 },
      { id: "union-square", name: "14 St-Union Sq", lat: 40.7359, lon: -73.9906 },
      { id: "fulton-st", name: "Fulton St", lat: 40.7104, lon: -74.0072 },
      { id: "atlantic-ave", name: "Atlantic Av-Barclays Ctr", lat: 40.6845, lon: -73.9780 },
      { id: "bedford-ave", name: "Bedford Ave", lat: 40.7173, lon: -73.9569 },
      { id: "eighth-ave", name: "8 Av", lat: 40.7399, lon: -74.0026 },
      { id: "queens-plaza", name: "Queens Plaza", lat: 40.7489, lon: -73.9372 },
      { id: "jackson-heights", name: "Jackson Hts-Roosevelt Av", lat: 40.7467, lon: -73.8913 },
    ],
    lines: [
      {
        id: "nyc-nqrw",
        name: "N/Q/R/W",
        color: "#fccc0a",
        stations: ["times-square", "herald-square", "union-square", "atlantic-ave"],
      },
      {
        id: "nyc-456",
        name: "4/5/6",
        color: "#00933c",
        stations: ["grand-central", "union-square", "fulton-st", "atlantic-ave"],
      },
      {
        id: "nyc-l",
        name: "L",
        color: "#a7a9ac",
        stations: ["eighth-ave", "union-square", "bedford-ave"],
      },
      {
        id: "nyc-7",
        name: "7",
        color: "#b933ad",
        stations: ["times-square", "grand-central", "queens-plaza", "jackson-heights"],
      },
    ],
  },
  {
    id: "tokyo-metro",
    city: "Tokyo",
    network: "Tokyo Metro",
    shortLabel: "Tokyo Metro",
    defaultStyleMode: "tokyo-minimal-precision",
    description:
      "Tightly spaced routes and highly controlled transfer logic translate into minimal, grid-locked sequences with nearly metronomic phrasing.",
    stations: [
      { id: "shibuya", name: "Shibuya", lat: 35.6580, lon: 139.7016 },
      { id: "omotesando", name: "Omotesando", lat: 35.6652, lon: 139.7123 },
      { id: "akasaka-mitsuke", name: "Akasaka-mitsuke", lat: 35.6760, lon: 139.7373 },
      { id: "kasumigaseki", name: "Kasumigaseki", lat: 35.6732, lon: 139.7502 },
      { id: "ginza", name: "Ginza", lat: 35.6717, lon: 139.7650 },
      { id: "otemachi", name: "Otemachi", lat: 35.6847, lon: 139.7666 },
      { id: "nihombashi", name: "Nihombashi", lat: 35.6837, lon: 139.7742 },
      { id: "ueno", name: "Ueno", lat: 35.7138, lon: 139.7770 },
      { id: "ikebukuro", name: "Ikebukuro", lat: 35.7289, lon: 139.7104 },
      { id: "shinjuku-sanchome", name: "Shinjuku-sanchome", lat: 35.6907, lon: 139.7069 },
    ],
    lines: [
      {
        id: "tokyo-ginza",
        name: "Ginza Line",
        color: "#f39700",
        stations: ["shibuya", "omotesando", "akasaka-mitsuke", "ginza", "ueno"],
      },
      {
        id: "tokyo-marunouchi",
        name: "Marunouchi Line",
        color: "#e60012",
        stations: ["ikebukuro", "shinjuku-sanchome", "otemachi", "ginza"],
      },
      {
        id: "tokyo-hanzomon",
        name: "Hanzomon Line",
        color: "#9b7cb6",
        stations: ["shibuya", "omotesando", "otemachi", "nihombashi"],
      },
      {
        id: "tokyo-chiyoda",
        name: "Chiyoda Line",
        color: "#00bb85",
        stations: ["omotesando", "kasumigaseki", "otemachi"],
      },
    ],
  },
  {
    id: "paris-metro",
    city: "Paris",
    network: "Paris Metro",
    shortLabel: "Paris Metro",
    defaultStyleMode: "cinematic-drift",
    description:
      "Loop-friendly spacing and elegant central transfers yield smooth repeating phrases that are ideal for melodic route cycling.",
    stations: [
      { id: "gare-du-nord", name: "Gare du Nord", lat: 48.8809, lon: 2.3553 },
      { id: "saint-lazare", name: "Saint-Lazare", lat: 48.8755, lon: 2.3245 },
      { id: "opera", name: "Opera", lat: 48.8703, lon: 2.3320 },
      { id: "concorde", name: "Concorde", lat: 48.8662, lon: 2.3227 },
      { id: "chatelet", name: "Chatelet", lat: 48.8583, lon: 2.3470 },
      { id: "bastille", name: "Bastille", lat: 48.8532, lon: 2.3692 },
      { id: "nation", name: "Nation", lat: 48.8485, lon: 2.3951 },
      { id: "montparnasse", name: "Montparnasse-Bienvenue", lat: 48.8422, lon: 2.3210 },
      { id: "republique", name: "Republique", lat: 48.8675, lon: 2.3634 },
    ],
    lines: [
      {
        id: "paris-line-1",
        name: "Line 1",
        color: "#ffcd00",
        stations: ["saint-lazare", "opera", "chatelet", "bastille", "nation"],
      },
      {
        id: "paris-line-4",
        name: "Line 4",
        color: "#be418d",
        stations: ["gare-du-nord", "chatelet", "montparnasse"],
      },
      {
        id: "paris-line-8",
        name: "Line 8",
        color: "#ceac5a",
        stations: ["concorde", "opera", "bastille", "republique"],
      },
      {
        id: "paris-line-14",
        name: "Line 14",
        color: "#62259d",
        stations: ["saint-lazare", "chatelet", "bastille"],
      },
    ],
  },
  {
    id: "madrid-metro",
    city: "Madrid",
    network: "Madrid Metro",
    shortLabel: "Madrid Metro",
    defaultStyleMode: "cartographic",
    description:
      "Balanced spacing and legible transfer geometry make Madrid a strong tonal reference map with clear stepwise movement and grounded harmonic pacing.",
    stations: [
      { id: "chamartin", name: "Chamartin", lat: 40.4723, lon: -3.6836 },
      { id: "plaza-castilla", name: "Plaza de Castilla", lat: 40.4669, lon: -3.6890 },
      { id: "nuevos-ministerios", name: "Nuevos Ministerios", lat: 40.4478, lon: -3.6924 },
      { id: "tribunal", name: "Tribunal", lat: 40.4268, lon: -3.7017 },
      { id: "gran-via", name: "Gran Via", lat: 40.4200, lon: -3.7033 },
      { id: "sol", name: "Sol", lat: 40.4169, lon: -3.7035 },
      { id: "atocha", name: "Atocha", lat: 40.4066, lon: -3.6890 },
      { id: "moncloa", name: "Moncloa", lat: 40.4345, lon: -3.7195 },
      { id: "avenida-america", name: "Avenida de America", lat: 40.4380, lon: -3.6767 },
      { id: "ventas", name: "Ventas", lat: 40.4315, lon: -3.6638 },
    ],
    lines: [
      {
        id: "madrid-line-1",
        name: "Linea 1",
        color: "#00a0e4",
        stations: ["chamartin", "plaza-castilla", "tribunal", "gran-via", "sol", "atocha"],
      },
      {
        id: "madrid-line-2",
        name: "Linea 2",
        color: "#ef3340",
        stations: ["sol", "ventas", "avenida-america"],
      },
      {
        id: "madrid-line-6",
        name: "Linea 6",
        color: "#9b26b6",
        stations: ["moncloa", "nuevos-ministerios", "avenida-america"],
      },
      {
        id: "madrid-line-10",
        name: "Linea 10",
        color: "#003da5",
        stations: ["chamartin", "nuevos-ministerios", "tribunal"],
      },
    ],
  },
  {
    id: "berlin-ubahn",
    city: "Berlin",
    network: "Berlin U-Bahn",
    shortLabel: "Berlin U-Bahn",
    defaultStyleMode: "berlin-techno",
    description:
      "Sparse geometry, sharp transfers, and direct runs make Berlin the minimal-techno preset: dry pulses, long ramps, and disciplined repetition.",
    stations: [
      { id: "zoo", name: "Zoologischer Garten", lat: 52.5072, lon: 13.3326 },
      { id: "wittenbergplatz", name: "Wittenbergplatz", lat: 52.5023, lon: 13.3432 },
      { id: "nollendorfplatz", name: "Nollendorfplatz", lat: 52.4992, lon: 13.3538 },
      { id: "potsdamer-platz", name: "Potsdamer Platz", lat: 52.5096, lon: 13.3760 },
      { id: "friedrichstrasse", name: "Friedrichstrasse", lat: 52.5204, lon: 13.3876 },
      { id: "alexanderplatz", name: "Alexanderplatz", lat: 52.5219, lon: 13.4132 },
      { id: "mehringdamm", name: "Mehringdamm", lat: 52.4936, lon: 13.3866 },
      { id: "kottbusser-tor", name: "Kottbusser Tor", lat: 52.4994, lon: 13.4186 },
      { id: "hermannplatz", name: "Hermannplatz", lat: 52.4875, lon: 13.4247 },
      { id: "warschauer-strasse", name: "Warschauer Strasse", lat: 52.5051, lon: 13.4489 },
    ],
    lines: [
      {
        id: "berlin-u1",
        name: "U1",
        color: "#7f5b3f",
        stations: ["wittenbergplatz", "nollendorfplatz", "kottbusser-tor", "warschauer-strasse"],
      },
      {
        id: "berlin-u2",
        name: "U2",
        color: "#da291c",
        stations: ["zoo", "wittenbergplatz", "potsdamer-platz", "alexanderplatz"],
      },
      {
        id: "berlin-u6",
        name: "U6",
        color: "#7c878e",
        stations: ["friedrichstrasse", "mehringdamm"],
      },
      {
        id: "berlin-u8",
        name: "U8",
        color: "#0057b8",
        stations: ["alexanderplatz", "kottbusser-tor", "hermannplatz"],
      },
    ],
  },
];

export const transitNetworks = rawTransitNetworks.map(hydrateTransitNetwork);

export const defaultTransitNetworkId = "bart";

export function getTransitNetworkById(networkId: string) {
  return transitNetworks.find((network) => network.id === networkId) ?? transitNetworks[0];
}
