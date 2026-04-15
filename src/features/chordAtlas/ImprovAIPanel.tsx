import { memo, useState, useCallback } from "react";
import { Sparkles, Play, Loader2, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ARTIST_PROFILES, type ImprovChord, type ImprovStyle } from "./improvEngine";
import { playChord } from "@/components/ModeVisualizer/audioSynth";
import { toast } from "@/hooks/use-toast";

interface ImprovAIPanelProps {
  progression: ImprovChord[];
  style: ImprovStyle;
  complexity: number;
  tempo: number;
  rootKey: string;
}

interface SoloNote {
  note: string;
  duration: string;
  beat: number;
  chord: string;
}

const ImprovAIPanel = memo(({ progression, style, complexity, tempo, rootKey }: ImprovAIPanelProps) => {
  const [artistId, setArtistId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [soloDescription, setSoloDescription] = useState<string | null>(null);
  const [soloNotes, setSoloNotes] = useState<SoloNote[]>([]);

  const generateSolo = useCallback(async () => {
    if (progression.length === 0) return;

    setIsGenerating(true);
    setSoloDescription(null);
    setSoloNotes([]);

    const chordNames = progression.map(c => c.name).join(" | ");
    const artist = artistId ? ARTIST_PROFILES.find(a => a.id === artistId) : null;

    try {
      const { data, error } = await supabase.functions.invoke("improv-solo", {
        body: {
          progression: chordNames,
          style,
          complexity,
          tempo,
          key: rootKey,
          artistStyle: artist ? { label: artist.label, traits: artist.traits } : null,
        },
      });

      if (error) {
        const status = (error as any)?.status;
        if (status === 429) {
          toast({ title: "Rate limited", description: "Please wait a moment and try again.", variant: "destructive" });
        } else if (status === 402) {
          toast({ title: "Credits needed", description: "Add credits in Settings → Workspace → Usage.", variant: "destructive" });
        } else {
          toast({ title: "Generation failed", description: error.message, variant: "destructive" });
        }
        return;
      }

      if (data?.description) setSoloDescription(data.description);
      if (data?.notes) setSoloNotes(data.notes);
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate solo. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [progression, style, complexity, tempo, rootKey, artistId]);

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">AI Solo Generator</h4>
        </div>
      </div>

      {/* Artist Style Transfer */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Style Transfer (optional)
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => setArtistId(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              artistId === null
                ? "border-primary/30 bg-primary/10 text-foreground"
                : "border-border bg-card/70 text-muted-foreground hover:bg-accent"
            }`}
          >
            Default
          </button>
          {ARTIST_PROFILES.map(artist => (
            <button
              key={artist.id}
              onClick={() => setArtistId(artist.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                artistId === artist.id
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:bg-accent"
              }`}
            >
              {artist.label}
            </button>
          ))}
        </div>
        {artistId && (
          <p className="mt-1.5 text-[10px] text-muted-foreground italic">
            {ARTIST_PROFILES.find(a => a.id === artistId)?.style}
          </p>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={generateSolo}
        disabled={isGenerating || progression.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating solo…
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Generate AI Solo
          </>
        )}
      </button>

      {/* Result */}
      {soloDescription && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              AI Analysis
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {soloDescription}
            </p>
          </div>

          {soloNotes.length > 0 && (
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Suggested Phrase
              </p>
              <div className="flex flex-wrap gap-1">
                {soloNotes.map((sn, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs font-mono text-foreground"
                  >
                    <Music2 className="h-2.5 w-2.5 text-primary" />
                    {sn.note}
                    <span className="text-[9px] text-muted-foreground">{sn.duration}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ImprovAIPanel.displayName = "ImprovAIPanel";

export default ImprovAIPanel;
