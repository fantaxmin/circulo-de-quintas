// Tarjeta de un grado: nota, calidad y botón de acorde.
// Al seleccionarla, el detalle del modo se muestra en un panel ancho aparte.

import type { CSSProperties } from "react";
import type { DegreeView } from "../lib/types";
import { prettyEnglish } from "../lib/music";
import { degreeColor } from "../lib/colors";
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
  // Color propio del grado, compartido con su segmento en el círculo de quintas.
  const color = degreeColor(d.index);
  const style: CSSProperties = {
    "--deg": color,
    ...(selected ? { borderColor: color, boxShadow: `0 0 0 2px ${color}40` } : {}),
  } as CSSProperties;
  return (
    <div
      className={`flex min-w-24 flex-1 cursor-pointer flex-col items-center gap-1.5 overflow-hidden rounded-xl border bg-slate-800/60 p-3 text-center transition-colors ${
        selected ? "" : "border-slate-700 hover:[border-color:var(--deg)]"
      }`}
      style={style}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span
        className="-mt-3 mb-0.5 h-1.5 w-full rounded-b-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className="flex items-center text-sm font-bold tracking-wide"
        style={{ color }}
      >
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
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        aria-label={`Reproducir acorde ${d.roman}`}
      >
        ▶ Acorde
      </button>
      <span className="mt-0.5 text-[10px] text-slate-500">{selected ? "▴ modo" : "▾ ver modo"}</span>
    </div>
  );
}
