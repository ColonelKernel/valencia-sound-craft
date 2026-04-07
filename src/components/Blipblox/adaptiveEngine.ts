// Adaptive Groove Engine
// Tracks user behavior and suggests intelligent variations

export type VariationType = 'ghost-notes' | 'syncopation' | 'accent-shift' | 'fill';

interface EditHistory {
  densityTrend: number; // positive = increasing, negative = decreasing
  editCount: number;
  repeatCount: number;
  lastPattern: string;
}

export class AdaptiveEngine {
  private history: EditHistory = {
    densityTrend: 0,
    editCount: 0,
    repeatCount: 0,
    lastPattern: '',
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

  suggestVariation(pattern: number[], velocity: number[]): { pattern: number[]; velocity: number[]; type: VariationType } {
    // Choose variation based on user behavior
    let type: VariationType;

    if (this.history.repeatCount >= 4) {
      type = 'syncopation';
    } else if (this.history.densityTrend > 0.05) {
      type = 'ghost-notes';
    } else if (this.history.densityTrend < -0.05) {
      type = 'accent-shift';
    } else {
      type = this.history.editCount % 3 === 0 ? 'fill' : 'ghost-notes';
    }

    const result = this.applyVariation(pattern, velocity, type);
    return { ...result, type };
  }

  applyVariation(
    pattern: number[],
    velocity: number[],
    type: VariationType
  ): { pattern: number[]; velocity: number[] } {
    const newPattern = [...pattern];
    const newVelocity = [...velocity];
    const len = pattern.length;

    switch (type) {
      case 'ghost-notes': {
        // Add ghost notes before/after accents
        for (let i = 0; i < len; i++) {
          if (pattern[i] === 1 && velocity[i] >= 90) {
            const before = (i - 1 + len) % len;
            const after = (i + 1) % len;
            if (pattern[before] === 0 && Math.random() < 0.4) {
              newPattern[before] = 1;
              newVelocity[before] = 30 + Math.round(Math.random() * 15);
            }
            if (pattern[after] === 0 && Math.random() < 0.3) {
              newPattern[after] = 1;
              newVelocity[after] = 25 + Math.round(Math.random() * 15);
            }
          }
        }
        break;
      }
      case 'syncopation': {
        // Shift some hits by one step
        for (let i = 0; i < len; i++) {
          if (pattern[i] === 1 && i % 4 !== 0 && Math.random() < 0.35) {
            const target = (i + 1) % len;
            if (pattern[target] === 0) {
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
        // Redistribute accents
        for (let i = 0; i < len; i++) {
          if (newPattern[i] === 1) {
            if (newVelocity[i] >= 90 && Math.random() < 0.3) {
              newVelocity[i] = 60 + Math.round(Math.random() * 20);
            } else if (newVelocity[i] < 70 && Math.random() < 0.25) {
              newVelocity[i] = 100 + Math.round(Math.random() * 27);
            }
          }
        }
        break;
      }
      case 'fill': {
        // Add a fill in the last quarter
        const fillStart = Math.floor(len * 0.75);
        for (let i = fillStart; i < len; i++) {
          if (Math.random() < 0.6) {
            newPattern[i] = 1;
            newVelocity[i] = 80 + Math.round(Math.random() * 40);
          }
        }
        break;
      }
    }

    return { pattern: newPattern, velocity: newVelocity };
  }

  reset() {
    this.history = { densityTrend: 0, editCount: 0, repeatCount: 0, lastPattern: '' };
  }
}

export const adaptiveEngine = new AdaptiveEngine();
