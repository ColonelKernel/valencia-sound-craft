import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { morphPatterns, velocityMorph, fuseRhythms } from './rhythmTranslator';
import StepSequencer from './StepSequencer';

interface PatternSource {
  name: string;
  midiPattern: number[];
  velocityPattern?: number[];
}

interface PatternMorpherProps {
  sources: PatternSource[];
  onResult?: (pattern: number[], velocity: number[]) => void;
}

const PatternMorpher = ({ sources, onResult }: PatternMorpherProps) => {
  const [selectedA, setSelectedA] = useState(0);
  const [selectedB, setSelectedB] = useState(Math.min(1, sources.length - 1));
  const [blendAmount, setBlendAmount] = useState(0.5);
  const [mode, setMode] = useState<'morph' | 'fuse'>('morph');

  const result = useMemo(() => {
    const a = sources[selectedA];
    const b = sources[selectedB];
    if (!a || !b) return null;

    if (mode === 'fuse') {
      return fuseRhythms(a, b);
    }

    const midiPattern = morphPatterns(a.midiPattern, b.midiPattern, blendAmount);
    const velA = a.velocityPattern || a.midiPattern.map(s => s ? 100 : 0);
    const velB = b.velocityPattern || b.midiPattern.map(s => s ? 100 : 0);
    const velocityPattern = velocityMorph(velA, velB, blendAmount);

    return {
      name: `${a.name} ↔ ${b.name}`,
      midiPattern,
      velocityPattern,
    };
  }, [sources, selectedA, selectedB, blendAmount, mode]);

  if (sources.length < 2) {
    return (
      <div className="text-xs text-muted-foreground p-3 text-center">
        Need at least 2 patterns to morph
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Mode:</span>
        {(['morph', 'fuse'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'text-[10px] px-2 py-1 rounded transition-colors capitalize',
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:bg-accent'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Pattern A</label>
          <select
            value={selectedA}
            onChange={e => setSelectedA(Number(e.target.value))}
            className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground"
          >
            {sources.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground block mb-1">Pattern B</label>
          <select
            value={selectedB}
            onChange={e => setSelectedB(Number(e.target.value))}
            className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground"
          >
            {sources.map((s, i) => (
              <option key={i} value={i}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'morph' && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground shrink-0">A</span>
          <Slider
            value={[blendAmount * 100]}
            onValueChange={([v]) => setBlendAmount(v / 100)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground shrink-0">B</span>
          <span className="text-[10px] text-muted-foreground w-8">{Math.round(blendAmount * 100)}%</span>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-foreground">{result.name}</span>
            {onResult && (
              <button
                onClick={() => onResult(result.midiPattern, result.velocityPattern || [])}
                className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Use Result
              </button>
            )}
          </div>
          <StepSequencer
            pattern={result.midiPattern}
            velocityPattern={result.velocityPattern}
            readOnly
          />
        </div>
      )}
    </div>
  );
};

export default PatternMorpher;
