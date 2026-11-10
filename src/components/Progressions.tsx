// Progresiones comunes para la tonalidad activa, con reproducción.

import type { View } from "../lib/types";
import { MAJOR_PROGRESSIONS, MINOR_PROGRESSIONS } from "../lib/data";

interface Props {
  view: View;
  onPlay: (degrees: number[]) => void;
}

export function Progressions({ view, onPlay }: Props) {
  const list = view.isMinor ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;

  return (
    <div className="flex flex-col gap-2">
      {list.map((p) => {
        const romans = p.degrees.map((i) => view.degrees[i].roman).join(" – ");
        return (
          <div
            key={p.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
          >
            <div>
              <div className="font-mono text-sm font-semibold text-text">{romans}</div>
              <div className="text-xs text-muted">{p.name}</div>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text transition hover:bg-surface"
              onClick={() => onPlay(p.degrees)}
              aria-label={`Reproducir progresión ${p.name}`}
            >
              ▶
            </button>
          </div>
        );
      })}
    </div>
  );
}
