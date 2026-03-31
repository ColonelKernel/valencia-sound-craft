import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import spiralArt from "@/assets/SpiralofDoubt.png";

interface Track {
  title: string;
  src: string;
}

interface AudioPlaylistProps {
  title: string;
  tracks: Track[];
}

const AudioPlaylist = ({ title, tracks }: AudioPlaylistProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = tracks[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (currentIndex < tracks.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentIndex, tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (isPlaying) audio.play();
  }, [currentIndex]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-sm overflow-hidden border border-border bg-card relative">
      <div
        className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${spiralArt})` }}
      />
      <p className="relative px-4 py-3 text-sm font-display font-semibold border-b border-border flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-primary" />
        {title}
      </p>
      <audio ref={audioRef} src={current.src} preload="metadata" />

      {/* Now playing + controls */}
      <div className="relative px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
        <p className="text-sm font-medium text-foreground mb-3">{current.title}</p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(tracks.length - 1, i + 1))}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-8 text-right">{fmt(progress)}</span>
            <div
              className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer group"
              onClick={seek}
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8">{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="divide-y divide-border">
        {tracks.map((track, i) => (
          <button
            key={track.src}
            onClick={() => {
              setCurrentIndex(i);
              setIsPlaying(true);
              setTimeout(() => audioRef.current?.play(), 50);
            }}
            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-accent/50 transition-colors ${
              i === currentIndex ? "bg-accent/30" : ""
            }`}
          >
            <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
            <span className={`text-sm ${i === currentIndex ? "text-primary font-medium" : "text-foreground"}`}>
              {track.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AudioPlaylist;
