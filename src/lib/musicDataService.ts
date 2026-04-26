export interface ArtistMonthly {
  artist: string;
  month: string;
  streams: number;
}

interface MusicAnalyticsDataset {
  monthly: ArtistMonthly[];
  topArtists: string[];
}

const MONTHS = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
] as const;

const ARTIST_SERIES: Record<string, readonly number[]> = {
  "Streetcar Scandal": [
    2_140_000, 2_180_000, 2_230_000, 2_260_000, 2_320_000, 2_410_000,
    2_500_000, 2_640_000, 2_590_000, 2_680_000, 2_740_000, 2_810_000,
    2_880_000, 2_940_000, 3_060_000, 3_140_000, 3_220_000, 3_310_000,
  ],
  "Valencia Echo": [
    1_720_000, 1_760_000, 1_850_000, 1_940_000, 2_050_000, 2_160_000,
    2_280_000, 2_360_000, 2_430_000, 2_520_000, 2_610_000, 2_690_000,
    2_740_000, 2_820_000, 2_900_000, 2_980_000, 3_080_000, 3_180_000,
  ],
  "Midnight Transit": [
    1_980_000, 2_040_000, 2_110_000, 2_180_000, 2_240_000, 2_320_000,
    2_450_000, 2_580_000, 2_520_000, 2_610_000, 2_700_000, 2_760_000,
    2_820_000, 2_900_000, 2_960_000, 3_040_000, 3_120_000, 3_200_000,
  ],
  "Costa Current": [
    1_320_000, 1_360_000, 1_400_000, 1_470_000, 1_520_000, 1_610_000,
    1_700_000, 1_750_000, 1_840_000, 1_900_000, 1_950_000, 2_030_000,
    2_120_000, 2_180_000, 2_260_000, 2_340_000, 2_410_000, 2_500_000,
  ],
  "Neon Rambler": [
    1_540_000, 1_500_000, 1_630_000, 1_580_000, 1_720_000, 1_670_000,
    1_820_000, 1_760_000, 1_930_000, 1_880_000, 2_020_000, 1_980_000,
    2_140_000, 2_090_000, 2_250_000, 2_210_000, 2_360_000, 2_330_000,
  ],
  "Pacific Receiver": [
    1_160_000, 1_240_000, 1_300_000, 1_360_000, 1_430_000, 1_510_000,
    1_590_000, 1_640_000, 1_720_000, 1_790_000, 1_860_000, 1_940_000,
    2_010_000, 2_090_000, 2_170_000, 2_240_000, 2_320_000, 2_390_000,
  ],
  "Solar Motel": [
    980_000, 1_020_000, 1_060_000, 1_150_000, 1_210_000, 1_260_000,
    1_330_000, 1_390_000, 1_470_000, 1_550_000, 1_620_000, 1_700_000,
    1_760_000, 1_830_000, 1_910_000, 2_000_000, 2_080_000, 2_160_000,
  ],
  "Harbor Phase": [
    870_000, 910_000, 960_000, 1_010_000, 1_070_000, 1_150_000,
    1_210_000, 1_260_000, 1_340_000, 1_420_000, 1_500_000, 1_580_000,
    1_650_000, 1_710_000, 1_790_000, 1_870_000, 1_950_000, 2_020_000,
  ],
};

function buildMonthlyDataset(): ArtistMonthly[] {
  return Object.entries(ARTIST_SERIES).flatMap(([artist, streams]) =>
    MONTHS.map((month, index) => ({
      artist,
      month,
      streams: streams[index] ?? 0,
    })),
  );
}

function getTopArtists(monthly: ArtistMonthly[], limit = 5): string[] {
  const totals = new Map<string, number>();

  for (const point of monthly) {
    totals.set(point.artist, (totals.get(point.artist) ?? 0) + point.streams);
  }

  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([artist]) => artist);
}

const LOCAL_DATASET: MusicAnalyticsDataset = (() => {
  const monthly = buildMonthlyDataset();
  return {
    monthly,
    topArtists: getTopArtists(monthly),
  };
})();

export function getMusicAnalyticsData(): MusicAnalyticsDataset {
  return LOCAL_DATASET;
}
