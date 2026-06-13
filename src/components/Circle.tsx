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
  onSelect: (index: number) => void;
}

export function Circle({ view, onSelect }: Props) {
  const slots = useMemo(() => circleSlots(view), [view]);

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
        // El grado 0 (I o i) es la tónica: se resalta más.
        const majorTonic = majorDeg === 0;
        const minorTonic = minorDeg === 0;
        return (
          <g
            key={index}
            className="group cursor-pointer focus:outline-none"
            role="button"
            tabIndex={0}
            aria-label={`Tonalidad de ${key.tonic} mayor`}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(index);
              }
            }}
          >
            <path
              d={majorPath}
              fill={majorColor ?? undefined}
              fillOpacity={majorColor ? (majorTonic ? 0.8 : 0.45) : undefined}
              className={`transition group-hover:brightness-125 ${
                majorTonic ? "stroke-slate-50 stroke-[3]" : "stroke-slate-950 stroke-2"
              } ${majorColor ? "" : "fill-slate-800"}`}
            />
            <path
              d={minorPath}
              fill={minorColor ?? undefined}
              fillOpacity={minorColor ? (minorTonic ? 0.8 : 0.45) : undefined}
              className={`transition group-hover:brightness-125 ${
                minorTonic ? "stroke-slate-50 stroke-[3]" : "stroke-slate-950 stroke-2"
              } ${minorColor ? "" : "fill-slate-700"}`}
            />
            <text
              x={majorLabel.x}
              y={majorLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-slate-50 text-[17px] font-bold"
            >
              {prettyEnglish(key.tonic)}
            </text>
            <text
              x={majorLabel.x}
              y={majorLabel.y + 13}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-slate-300 text-[9px] font-medium"
            >
              {toLatin(key.tonic)}
            </text>
            <text
              x={minorLabel.x}
              y={minorLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-slate-200 text-[11px] font-semibold"
            >
              {prettyEnglish(key.relative)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
