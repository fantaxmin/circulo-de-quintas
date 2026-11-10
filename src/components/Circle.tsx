// Círculo de quintas en SVG. Anillo exterior = mayores, interior = relativas menores.
// Al elegir una tonalidad, los segmentos diatónicos se tiñen con el color de su
// grado (mismo código que la tablita de grados), formando la cuña característica.

import { useMemo } from "react";
import { KEYS } from "../lib/data";
import { annularSector, polar } from "../lib/geometry";
import { prettyEnglish, toLatin } from "../lib/music";
import { circleSlots } from "../lib/theory";
import { degreeColor } from "../lib/colors";
import type { View } from "../lib/types";

const CX = 200;
const CY = 200;
const R_OUTER = 195;
const R_MID = 128;
const R_INNER = 74;
const SEG = 360 / KEYS.length; // 30°

const SEGMENTS = KEYS.map((key, i) => {
  const center = i * SEG;
  const start = center - SEG / 2;
  const end = center + SEG / 2;
  return {
    index: i,
    key,
    majorPath: annularSector(CX, CY, R_MID, R_OUTER, start, end),
    minorPath: annularSector(CX, CY, R_INNER, R_MID, start, end),
    majorLabel: polar(CX, CY, (R_OUTER + R_MID) / 2, center),
    minorLabel: polar(CX, CY, (R_MID + R_INNER) / 2, center),
  };
});

interface Props {
  view: View;
  /** Selecciona una tonalidad: anillo exterior = mayor, interior = relativa menor. */
  onSelect: (index: number, minor: boolean) => void;
}

/** Activa con Enter/Espacio (accesibilidad de los sectores como botones). */
function activate(e: React.KeyboardEvent, fn: () => void): void {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

export function Circle({ view, onSelect }: Props) {
  const { keyIndex, isMinor } = view;
  const slots = useMemo(() => circleSlots(view), [view]);
  const activeKey = KEYS[keyIndex];
  const activeLabel = isMinor ? activeKey.relative : activeKey.tonic;
  return (
    <svg
      viewBox="0 0 400 400"
      className="mx-auto h-auto w-full max-w-md select-none font-sans"
      role="group"
      aria-label="Círculo de quintas"
    >
      {SEGMENTS.map(({ index, key, majorPath, minorPath, majorLabel, minorLabel }) => {
        const majorDeg = slots.get(`major-${index}`);
        const minorDeg = slots.get(`minor-${index}`);
        const majorColor = majorDeg !== undefined ? degreeColor(majorDeg) : null;
        const minorColor = minorDeg !== undefined ? degreeColor(minorDeg) : null;
        // El grado 0 (I o i) es la tónica activa: se resalta más.
        const majorActive = majorDeg === 0;
        const minorActive = minorDeg === 0;
        return (
          <g key={index}>
            <path
              d={majorPath}
              role="button"
              tabIndex={0}
              aria-label={`${toLatin(key.tonic)} mayor`}
              aria-pressed={majorActive}
              onClick={() => onSelect(index, false)}
              onKeyDown={(e) => activate(e, () => onSelect(index, false))}
              fill={majorColor ?? undefined}
              fillOpacity={majorColor ? (majorActive ? 0.85 : 0.45) : undefined}
              className={`cursor-pointer transition hover:brightness-125 focus:outline-none focus-visible:stroke-amber-200 ${
                majorActive ? "stroke-slate-50 stroke-[3]" : "stroke-slate-950 stroke-2"
              } ${majorColor ? "" : "fill-slate-800"}`}
            />
            <path
              d={minorPath}
              role="button"
              tabIndex={0}
              aria-label={`${toLatin(key.relative.replace(/m$/, ""))} menor`}
              aria-pressed={minorActive}
              onClick={() => onSelect(index, true)}
              onKeyDown={(e) => activate(e, () => onSelect(index, true))}
              fill={minorColor ?? undefined}
              fillOpacity={minorColor ? (minorActive ? 0.85 : 0.45) : undefined}
              className={`cursor-pointer transition hover:brightness-125 focus:outline-none focus-visible:stroke-amber-200 ${
                minorActive ? "stroke-slate-50 stroke-[3]" : "stroke-slate-950 stroke-2"
              } ${minorColor ? "" : "fill-slate-700"}`}
            />
            <text
              x={majorLabel.x}
              y={majorLabel.y - 2}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[17px] font-bold ${
                "fill-slate-50"
              }`}
            >
              {prettyEnglish(key.tonic)}
            </text>
            <text
              x={majorLabel.x}
              y={majorLabel.y + 13}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[11px] font-medium ${
                "fill-slate-200"
              }`}
            >
              {toLatin(key.tonic)}
            </text>
            <text
              x={minorLabel.x}
              y={minorLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[12px] font-semibold ${
                "fill-slate-100"
              }`}
            >
              {prettyEnglish(key.relative)}
            </text>
          </g>
        );
      })}

      {/* Centro: tonalidad activa */}
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none fill-amber-400 text-[26px] font-bold"
      >
        {prettyEnglish(activeLabel)}
      </text>
      <text
        x={CX}
        y={CY + 16}
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none fill-slate-300 text-[12px] font-medium"
      >
        {toLatin(activeLabel.replace(/m$/, ""))} {isMinor ? "menor" : "mayor"}
      </text>
    </svg>
  );
}
