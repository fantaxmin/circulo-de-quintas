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

export function Circle({ keyIndex, isMinor, onSelect }: Props) {
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
        const active = index === keyIndex;
        const majorActive = active && !isMinor;
        const minorActive = active && isMinor;
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
              className={`cursor-pointer stroke-slate-950 stroke-2 transition-colors focus:outline-none focus-visible:stroke-amber-200 ${
                majorActive ? "fill-amber-500" : "fill-slate-800 hover:fill-slate-600"
              }`}
            />
            <path
              d={minorPath}
              role="button"
              tabIndex={0}
              aria-label={`${toLatin(key.relative)} (relativa menor)`}
              aria-pressed={minorActive}
              onClick={() => onSelect(index, true)}
              onKeyDown={(e) => activate(e, () => onSelect(index, true))}
              className={`cursor-pointer stroke-slate-950 stroke-2 transition-colors focus:outline-none focus-visible:stroke-amber-200 ${
                minorActive ? "fill-amber-400" : "fill-slate-700 hover:fill-slate-500"
              }`}
            />
            <text
              x={majorLabel.x}
              y={majorLabel.y - 2}
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
              className={`pointer-events-none text-[11px] font-medium ${
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
              className={`pointer-events-none text-[12px] font-semibold ${
                minorActive ? "fill-slate-900" : "fill-slate-200"
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
