export type InstrumentRole = "pulse" | "timeline" | "bass" | "slap" | "lead" | "texture";

export interface SequencerLayer {
  id: string;
  label: string;
  instrumentId: string;
  instrument: string;
  role: InstrumentRole;
  band: "low" | "mid" | "high";
  pattern: number[];
  velocity: number[];
  locked?: boolean;
}

export function buildCompositePattern(layers: SequencerLayer[]) {
  const totalSteps = layers[0]?.pattern.length ?? 0;
  const pattern = new Array(totalSteps).fill(0);
  const velocity = new Array(totalSteps).fill(0);

  layers.forEach((layer) => {
    layer.pattern.forEach((step, index) => {
      if (!step) {
        return;
      }

      pattern[index] = 1;
      velocity[index] = Math.max(velocity[index], layer.velocity[index] ?? 0);
    });
  });

  return { pattern, velocity };
}
