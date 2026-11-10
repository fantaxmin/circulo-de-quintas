// Tarjeta de un grado: nota, calidad y botón de acorde.
// Al seleccionarla, el detalle del modo se muestra en un panel ancho aparte.

import type { DegreeView } from "../lib/types";
import type { CSSProperties } from "react";
import { prettyEnglish } from "../lib/music";
import { degreeColor } from "../lib/colors";
import { QUALITY_BADGE, QUALITY_LABEL, QUALITY_TIP, romanTip } from "../lib/labels";
import { InfoIcon } from "./InfoIcon";

interface Props {
  degree: DegreeView;
  isMinor: boolean;
  selected: boolean;
  /** Si su acorde está sonando ahora (resaltado "sonando"). */
  sounding?: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

export function DegreeCard({ degree: d, isMinor, selected, sounding = false, onSelect, onPlay }: Props) {
  // Color propio del grado, compartido con su segmento en el círculo de quintas.
  const color = degreeColor(d.index);
  const style: CSSProperties = {
    "--deg": color,
    ...(selected && !sounding ? { borderColor: color, boxShadow: `0 0 0 2px ${color}40` } : {}),
  } as CSSProperties;
  return (
    <div
      style={style}
      className={`flex min-w-24 flex-1 flex-col overflow-hidden items-center gap-1.5 rounded-xl border p-3 text-center transition-colors duration-100 ${
        sounding
          ? "border-playing bg-playing/10 ring-1 ring-playing/50"
          : selected
            ? "bg-surface-2"
            : "border-border bg-surface-2 hover:[border-color:var(--deg)]"
      }`}
    >
      {/* Info del grado (los ⓘ quedan fuera de los botones para no anidar interactivos) */}
      <span
        className="-mt-3 mb-0.5 h-1.5 w-full rounded-b-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex items-center text-sm font-bold tracking-wide" style={{ color }}>
        {d.roman}
        <InfoIcon tip={romanTip(d, isMinor)} />
      </span>
      <span className="text-2xl font-bold text-text">{prettyEnglish(d.note)}</span>
      <span className="text-sm text-muted">{d.noteEs}</span>
      <span
        className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${QUALITY_BADGE[d.quality]}`}
      >
        {QUALITY_LABEL[d.quality]}
        <InfoIcon tip={QUALITY_TIP[d.quality]} />
      </span>
      <button
        type="button"
        className="mt-1 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text transition hover:border-accent hover:text-accent"
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
        className="mt-0.5 rounded px-1.5 text-xs text-muted transition hover:text-accent"
      >
        {selected ? "▴ modo" : "▾ ver modo"}
      </button>
    </div>
  );
}
