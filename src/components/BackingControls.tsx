// Controles del backing track: estilo, BPM y play/stop.

import type { Genre } from "../lib/audio";

interface Props {
  genre: Genre;
  bpm: number;
  isPlaying: boolean;
  onGenre: (g: Genre) => void;
  onBpm: (bpm: number) => void;
  onToggle: () => void;
}

const GENRES: { value: Genre; label: string }[] = [
  { value: "pop", label: "Pop/Rock" },
  { value: "jazz", label: "Jazz (swing)" },
  { value: "funk", label: "Funk" },
];

export function BackingControls({ genre, bpm, isPlaying, onGenre, onBpm, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-end">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          isPlaying
            ? "bg-rose-500 text-white hover:bg-rose-400"
            : "bg-amber-500 text-slate-900 hover:bg-amber-400"
        }`}
        aria-pressed={isPlaying}
      >
        {isPlaying ? "■ Detener" : "▶ Play"}
      </button>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Estilo
        <select
          value={genre}
          onChange={(e) => onGenre(e.target.value as Genre)}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
        Tempo: <span className="font-semibold text-amber-300">{bpm} BPM</span>
        <input
          type="range"
          min={60}
          max={140}
          step={1}
          value={bpm}
          onChange={(e) => onBpm(Number(e.target.value))}
          className="accent-amber-500"
        />
      </label>
    </div>
  );
}
