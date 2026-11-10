// Progresiones comunes para la tonalidad activa: reproducir/detener, repetir en loop
// y un cursor que marca el acorde que está sonando.

import { useState } from "react";
import type { View } from "../lib/types";
import { MAJOR_PROGRESSIONS, MINOR_PROGRESSIONS } from "../lib/data";

/** Tag de secuencia de una progresión (lo usa App para los eventos de audio). */
export const progressionTag = (name: string) => `prog:${name}`;

interface Props {
  view: View;
  /** Reproduce la progresión; `loop` la repite varias vueltas. */
  onPlay: (name: string, degrees: number[], loop: boolean) => void;
  onStop: () => void;
  /** Pasos activos por tag (de usePlayingNotes). */
  steps: Record<string, number>;
}

export function Progressions({ view, onPlay, onStop, steps }: Props) {
  const list = view.isMinor ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;
  const [loop, setLoop] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-2 self-end text-xs text-muted">
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
          className="accent-accent"
        />
        Repetir en loop
      </label>
      {list.map((p) => {
        const step = steps[progressionTag(p.name)];
        const active = step !== undefined;
        const current = active ? step % p.degrees.length : -1;
        return (
          <div
            key={p.name}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
              active ? "border-playing/60 bg-playing/5" : "border-border bg-surface-2"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-1 font-mono text-sm font-semibold">
                {p.degrees.map((d, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted">–</span>}
                    <span
                      className={`rounded px-1 transition-colors ${
                        i === current ? "bg-playing text-slate-950" : "text-text"
                      }`}
                    >
                      {view.degrees[d].roman}
                    </span>
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted">{p.name}</div>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text transition hover:bg-surface"
              onClick={() => (active ? onStop() : onPlay(p.name, p.degrees, loop))}
              aria-label={`${active ? "Detener" : "Reproducir"} progresión ${p.name}`}
            >
              {active ? "■" : "▶"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
