// Adaptive Groove Engine
// Tracks user behavior and suggests intelligent variations

export type VariationType = 'ghost-notes' | 'syncopation' | 'accent-shift' | 'fill' | 'micro-timing' | 'subdivision-swap';

export type RegionId =
  | 'west_africa'
  | 'balkans'
  | 'flamenco'
  | 'afro_cuban'
  | 'brazil'
  | 'india'
  | 'middle_east'
  | 'argentina'
  | 'afro_peruvian'
  | 'uruguay'
  | 'general';

// Protected step indices per region — adaptive engine will never remove these
const REGION_CONSTRAINTS: Record<RegionId, number[]> = {
  west_africa: [0, 3, 6, 9],
  balkans: [0, 2, 4, 7, 9, 11, 14],
  flamenco: [0, 3, 6, 8, 10],
  afro_cuban: [0, 3, 7, 10, 12],
  brazil: [0, 4, 8, 12],
  india: [0],
  middle_east: [0, 4, 8, 12],
  argentina: [0, 3, 6, 9],
  afro_peruvian: [0, 3, 6, 9],
  uruguay: [0, 3, 7, 10, 12],
  general: [0],
};

interface EditHistory {
  densityTrend: number;
  editCount: number;
  repeatCount: number;
  lastPattern: string;
  loopCount: number;
}

export class AdaptiveEngine {
  private history: EditHistory = {
    densityTrend: 0,
    editCount: 0,
    repeatCount: 0,
    lastPattern: '',
    loopCount: 0,
  };

  trackEdit(oldPattern: number[], newPattern: number[]) {
    const oldDensity = oldPattern.filter(s => s > 0).length / oldPattern.length;
    const newDensity = newPattern.filter(s => s > 0).length / newPattern.length;
    this.history.densityTrend = (this.history.densityTrend * 0.7) + ((newDensity - oldDensity) * 0.3);
    this.history.editCount++;

    const sig = newPattern.join(',');
    if (sig === this.history.lastPattern) {
      this.history.repeatCount++;
    } else {
      this.history.repeatCount = 0;
      this.history.lastPattern = sig;
    }
  }

  incrementLoop() {
    this.history.loopCount++;
  }

  suggestVariation(
    pattern: number[],
    velocity: number[],
    region: RegionId = 'general',
    maxStrength: number = 0.5
  ): { pattern: number[]; velocity: number[]; type: VariationType } {
    this.history.loopCount++;
    let type: VariationType;

    // Early loops = subtle, later loops = more adventurous
    const maturity = Math.min(1, this.history.loopCount / 8);

    if (this.history.repeatCount >= 4) {
      type = maturity > 0.5 ? 'syncopation' : 'micro-timing';
    } else if (this.history.densityTrend > 0.05) {
      type = 'ghost-notes';
    } else if (this.history.densityTrend < -0.05) {
      type = 'accent-shift';
    } else if (maturity > 0.6 && Math.random() < 0.3) {
      type = 'subdivision-swap';
    } else {
      type = this.history.editCount % 3 === 0 ? 'fill' : 'ghost-notes';
    }

    const result = this.applyVariation(pattern, velocity, type, region, maxStrength);
    return { ...result, type };
  }

  applyVariation(
    pattern: number[],
    velocity: number[],
    type: VariationType,
    region: RegionId = 'general',
    maxStrength: number = 0.5
  ): { pattern: number[]; velocity: number[] } {
    const newPattern = [...pattern];
    const newVelocity = [...velocity];
    const len = pattern.length;
    const protectedSteps = new Set(
      REGION_CONSTRAINTS[region]?.filter(s => s < len) ?? []
    );
    // Scale probability by strength
    const prob = (base: number) => base * maxStrength;

    switch (type) {
      case 'ghost-notes': {
        for (let i = 0; i < len; i++) {
          if (pattern[i] === 1 && velocity[i] >= 90) {
            const before = (i - 1 + len) % len;
            const after = (i + 1) % len;
            if (pattern[before] === 0 && Math.random() < prob(0.4)) {
              newPattern[before] = 1;
              newVelocity[before] = 30 + Math.round(Math.random() * 15);
            }
            if (pattern[after] === 0 && Math.random() < prob(0.3)) {
              newPattern[after] = 1;
              newVelocity[after] = 25 + Math.round(Math.random() * 15);
            }
          }
        }
        break;
      }
      case 'syncopation': {
        for (let i = 0; i < len; i++) {
          if (pattern[i] === 1 && i % 4 !== 0 && !protectedSteps.has(i) && Math.random() < prob(0.35)) {
            const target = (i + 1) % len;
            if (pattern[target] === 0 && !protectedSteps.has(target)) {
              newPattern[i] = 0;
              newVelocity[i] = 0;
              newPattern[target] = 1;
              newVelocity[target] = velocity[i];
            }
          }
        }
        break;
      }
      case 'accent-shift': {
        for (let i = 0; i < len; i++) {
          if (newPattern[i] === 1 && !protectedSteps.has(i)) {
            if (newVelocity[i] >= 90 && Math.random() < prob(0.3)) {
              newVelocity[i] = 60 + Math.round(Math.random() * 20);
            } else if (newVelocity[i] < 70 && Math.random() < prob(0.25)) {
              newVelocity[i] = 100 + Math.round(Math.random() * 27);
            }
          }
        }
        break;
      }
      case 'fill': {
        const fillStart = Math.floor(len * 0.75);
        for (let i = fillStart; i < len; i++) {
          if (!protectedSteps.has(i) && Math.random() < prob(0.6)) {
            newPattern[i] = 1;
            newVelocity[i] = 80 + Math.round(Math.random() * 40);
          }
        }
        break;
      }
      case 'micro-timing': {
        // Simulate laid-back/ahead feel by shifting velocity emphasis
        // Even steps get louder (ahead), odd steps get softer (laid-back), or vice versa
        const laidBack = Math.random() < 0.5;
        for (let i = 0; i < len; i++) {
          if (newPattern[i] === 1 && !protectedSteps.has(i)) {
            const isEven = i % 2 === 0;
            const shift = Math.round(maxStrength * 15);
            if (laidBack) {
              newVelocity[i] = isEven
                ? Math.min(127, newVelocity[i] + shift)
                : Math.max(20, newVelocity[i] - shift);
            } else {
              newVelocity[i] = isEven
                ? Math.max(20, newVelocity[i] - shift)
                : Math.min(127, newVelocity[i] + shift);
            }
          }
        }
        break;
      }
      case 'subdivision-swap': {
        // Replace a beat group with different subdivision feel
        // Pick a random beat boundary and toggle neighboring steps
        const beatSize = Math.max(2, Math.floor(len / 4));
        const startBeat = Math.floor(Math.random() * 4) * beatSize;
        for (let i = startBeat; i < Math.min(startBeat + beatSize, len); i++) {
          if (protectedSteps.has(i)) continue;
          if (Math.random() < prob(0.5)) {
            // Toggle step
            if (newPattern[i] === 0) {
              newPattern[i] = 1;
              newVelocity[i] = 50 + Math.round(Math.random() * 30);
            } else {
              newPattern[i] = 0;
              newVelocity[i] = 0;
            }
          }
        }
        break;
      }
    }

    return { pattern: newPattern, velocity: newVelocity };
  }

  reset() {
    this.history = { densityTrend: 0, editCount: 0, repeatCount: 0, lastPattern: '', loopCount: 0 };
  }
}

export const adaptiveEngine = new AdaptiveEngine();
