// Tarjeta de un grado: nota, calidad y botón de acorde.
// Al seleccionarla, el detalle del modo se muestra en un panel ancho aparte.

import type { DegreeView } from "../lib/types";
import { prettyEnglish } from "../lib/music";
import { QUALITY_BADGE, QUALITY_LABEL, QUALITY_TIP, romanTip } from "../lib/labels";
import { InfoIcon } from "./InfoIcon";

interface Props {
  degree: DegreeView;
  isMinor: boolean;
  selected: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

export function DegreeCard({ degree: d, isMinor, selected, onSelect, onPlay }: Props) {
  return (
    <div
      className={`flex min-w-24 flex-1 flex-col items-center gap-1.5 rounded-xl border bg-slate-800/60 p-3 text-center transition-colors ${
        selected ? "border-amber-500 ring-1 ring-amber-500/50" : "border-slate-700 hover:border-amber-500/40"
      }`}
    >
      {/* Info del grado (los ⓘ quedan fuera de los botones para no anidar interactivos) */}
      <span className="flex items-center text-sm font-bold tracking-wide text-amber-400">
        {d.roman}
        <InfoIcon tip={romanTip(d, isMinor)} />
      </span>
      <span className="text-2xl font-bold text-slate-50">{prettyEnglish(d.note)}</span>
      <span className="text-sm text-slate-400">{d.noteEs}</span>
      <span
        className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${QUALITY_BADGE[d.quality]}`}
      >
        {QUALITY_LABEL[d.quality]}
        <InfoIcon tip={QUALITY_TIP[d.quality]} />
      </span>
      <button
        type="button"
        className="mt-1 inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-400"
        onClick={onPlay}
        aria-label={`Reproducir acorde ${d.roman}`}
      >
        ▶ Acorde
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${selected ? "Ocultar" : "Ver"} modo ${d.mode.name} del grado ${d.roman}`}
        className="mt-0.5 rounded px-1.5 text-xs text-slate-400 transition hover:text-amber-300"
      >
        {selected ? "▴ modo" : "▾ ver modo"}
      </button>
    </div>
  );
}
