// Controles del backing track: estilo, BPM y play/stop.

import type { Genre } from "../lib/audio";
import { InstrumentPicker } from "./InstrumentPicker";

interface Props {
  genre: Genre;
  bpm: number;
  isPlaying: boolean;
  onGenre: (g: Genre) => void;
  onBpm: (bpm: number) => void;
  onToggle: () => void;
  /** Pulso activo del compás (0–3) mientras suena, para el indicador. */
  beat?: number;
}

const GENRES: { value: Genre; label: string }[] = [
  { value: "pop", label: "Pop/Rock" },
  { value: "jazz", label: "Jazz (swing)" },
  { value: "funk", label: "Funk" },
];

export function BackingControls({ genre, bpm, isPlaying, onGenre, onBpm, onToggle, beat }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-end">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
          isPlaying
            ? "border-playing text-playing hover:bg-playing/10"
            : "border-accent bg-accent text-surface hover:bg-accent/90"
        }`}
        aria-pressed={isPlaying}
      >
        {isPlaying ? "■ Detener" : "▶ Play"}
      </button>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Estilo
        <select
          value={genre}
          onChange={(e) => onGenre(e.target.value as Genre)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-accent"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
        Tempo: <span className="font-semibold text-text">{bpm} BPM</span>
        <input
          type="range"
          min={60}
          max={140}
          step={1}
          value={bpm}
          onChange={(e) => onBpm(Number(e.target.value))}
          className="accent-accent"
        />
      </label>

      <InstrumentPicker />

      {/* Indicador de los 4 pulsos del compás */}
      <div className="flex items-center gap-1.5 self-center sm:pb-2.5" aria-hidden="true">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-75 ${
              isPlaying && beat === b
                ? b === 0
                  ? "bg-accent"
                  : "bg-playing"
                : "bg-surface"
            } ring-1 ring-border`}
          />
        ))}
      </div>
    </div>
  );
}
