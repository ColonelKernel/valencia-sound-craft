interface ArtistPickerProps {
  label: string;
  artists: string[];
  selected: string[];
  onToggle: (artist: string) => void;
  /** Prefix selected artists with a checkmark (portfolio style). */
  checkmark?: boolean;
}

const ArtistPicker = ({ label, artists, selected, onToggle, checkmark = false }: ArtistPickerProps) => (
  <div className="rounded-xl border border-border/50 bg-card p-4">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
      {label}
    </p>
    <div className="flex flex-wrap gap-2">
      {artists.map((artist) => {
        const isSelected = selected.includes(artist);

        return (
          <button
            key={artist}
            onClick={() => onToggle(artist)}
            aria-pressed={isSelected}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
            }`}
          >
            {checkmark && isSelected ? `✓ ${artist}` : artist}
          </button>
        );
      })}
    </div>
  </div>
);

export default ArtistPicker;
