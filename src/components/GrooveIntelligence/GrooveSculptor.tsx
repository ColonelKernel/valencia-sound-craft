interface Props {
  values: { energy: number; swing: number; syncopation: number; dynamics: number };
  onChange: (v: Props["values"]) => void;
  active: boolean;
  onToggle: () => void;
}

function Slider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
        <span className="text-muted-foreground">{label}</span>
        <span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value * 100}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value * 100}%, hsl(0 0% 18%) ${value * 100}%)`,
        }}
      />
    </div>
  );
}

export default function GrooveSculptor({ values, onChange, active, onToggle }: Props) {
  const update = (key: keyof typeof values) => (v: number) => onChange({ ...values, [key]: v });

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
          active ? "bg-foreground/10 text-foreground" : "bg-secondary/40 text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>Shape a Groove</span>
        <span className={`w-2 h-2 rounded-full transition-colors ${active ? "bg-green-400" : "bg-muted-foreground/30"}`} />
      </button>

      {active && (
        <div className="mt-4 space-y-4 animate-fade-in">
          <Slider label="Energy" value={values.energy} onChange={update("energy")} color="hsl(30, 90%, 55%)" />
          <Slider label="Swing" value={values.swing} onChange={update("swing")} color="hsl(180, 70%, 50%)" />
          <Slider label="Syncopation" value={values.syncopation} onChange={update("syncopation")} color="hsl(280, 70%, 60%)" />
          <Slider label="Dynamics" value={values.dynamics} onChange={update("dynamics")} color="hsl(350, 80%, 55%)" />
        </div>
      )}
    </div>
  );
}
