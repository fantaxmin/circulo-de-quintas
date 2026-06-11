// Círculo de quintas en SVG. Anillo exterior = mayores, interior = relativas menores.

import { KEYS } from "../lib/data";
import { annularSector, polar } from "../lib/geometry";
import { prettyEnglish, toLatin } from "../lib/music";

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
  keyIndex: number;
  isMinor: boolean;
  onSelect: (index: number) => void;
}

export function Circle({ keyIndex, isMinor, onSelect }: Props) {
  return (
    <svg
      viewBox="0 0 400 400"
      className="mx-auto h-auto w-full max-w-md select-none font-sans"
      role="group"
      aria-label="Círculo de quintas"
    >
      {SEGMENTS.map(({ index, key, majorPath, minorPath, majorLabel, minorLabel }) => {
        const active = index === keyIndex;
        const majorActive = active && !isMinor;
        const minorActive = active && isMinor;
        return (
          <g
            key={index}
            className="cursor-pointer focus:outline-none"
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
              className={`stroke-slate-950 stroke-2 transition-colors ${
                majorActive ? "fill-amber-500" : "fill-slate-800 hover:fill-slate-600"
              }`}
            />
            <path
              d={minorPath}
              className={`stroke-slate-950 stroke-2 transition-colors ${
                minorActive ? "fill-amber-400" : "fill-slate-700 hover:fill-slate-500"
              }`}
            />
            <text
              x={majorLabel.x}
              y={majorLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[17px] font-bold ${
                majorActive ? "fill-slate-900" : "fill-slate-50"
              }`}
            >
              {prettyEnglish(key.tonic)}
            </text>
            <text
              x={majorLabel.x}
              y={majorLabel.y + 13}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[9px] font-medium ${
                majorActive ? "fill-slate-800" : "fill-slate-300"
              }`}
            >
              {toLatin(key.tonic)}
            </text>
            <text
              x={minorLabel.x}
              y={minorLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`pointer-events-none text-[11px] font-semibold ${
                minorActive ? "fill-slate-900" : "fill-slate-200"
              }`}
            >
              {prettyEnglish(key.relative)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
