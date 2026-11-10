// Diapasón en SVG (guitarra/bajo). Cuerda aguda arriba, como en la TAB.
// Distingue la digitación elegida (puntos) de lo que suena (anillo "playing") para
// no iluminar todos los unísonos. Cada casilla es pulsable con clic o teclado.

import { useRef, useState } from "react";
import { INSTRUMENTS, fretMidi, prettySpelling, type FretPos, type InstrumentId } from "../lib/fretboard";

export type FretMark = "correct" | "wrong" | "target";

export interface FretboardProps {
  instrument: InstrumentId;
  /** Trastes visibles [desde, hasta]. Por defecto [0, 12]. */
  fretRange?: [number, number];
  /** Digitación elegida (puntos de la posición). */
  fingering?: FretPos[];
  /** Lo que suena ahora (cuerda/traste exactos, no todos los unísonos). */
  sounding?: FretPos[];
  /** Clases de altura (0–11) de la escala, para reveal="all". */
  scalePcs?: number[];
  /** Clase de altura de la tónica (se marca con el acento). */
  tonicPc?: number;
  /** Qué mostrar: todas las notas de la escala, sólo la digitación o nada (ejercicios). */
  reveal?: "all" | "fingering" | "none";
  /** Mostrar nombres de nota sobre los puntos. */
  showNames?: boolean;
  /** Ortografía por clase de altura para los nombres (p.ej. {6: "F#"}); si falta, se usa ♯. */
  spellings?: Record<number, string>;
  /** Marcas de ejercicio sobre posiciones concretas. */
  marks?: { pos: FretPos; kind: FretMark }[];
  /** Pulsar una posición (clic o teclado). midi = altura real. */
  onPress?: (pos: FretPos & { midi: number }) => void;
}

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const INLAYS = new Set([3, 5, 7, 9, 15]);
const MARK_FILL: Record<FretMark, string> = {
  correct: "#34d399",
  wrong: "#f87171",
  target: "var(--color-accent)",
};

const same = (a: FretPos, b: FretPos) => a.string === b.string && a.fret === b.fret;

export function Fretboard({
  instrument,
  fretRange = [0, 12],
  fingering = [],
  sounding = [],
  scalePcs,
  tonicPc,
  reveal = "fingering",
  showNames = true,
  spellings = {},
  marks = [],
  onPress,
}: FretboardProps) {
  const inst = INSTRUMENTS[instrument];
  const nStrings = inst.tuning.length;
  const [from, to] = fretRange;
  const showNut = from === 0;
  const frets = to - from + 1; // columnas (incluye "aire" si from = 0)

  const LEFT = 30;
  const TOP = 16;
  const COL = 52;
  const ROW = 26;
  const W = LEFT + frets * COL + 8;
  const H = TOP + (nStrings - 1) * ROW + 30;
  const gridRef = useRef<SVGSVGElement>(null);
  // Foco itinerante: una sola casilla con tabIndex 0 (la última enfocada).
  const [active, setActive] = useState({ string: 1, fret: from });

  // x del centro de la casilla de un traste (el traste 0 va a la izquierda de la cejuela).
  const cx = (fret: number) => LEFT + (fret - from) * COL + COL / 2;
  const cy = (string: number) => TOP + (string - 1) * ROW;
  const name = (pc: number) => prettySpelling(spellings[pc] ?? SHARP_NAMES[pc]);

  const cells: React.ReactNode[] = [];
  for (let s = 1; s <= nStrings; s++) {
    for (let f = from; f <= to; f++) {
      const pos = { string: s, fret: f };
      const midi = fretMidi(inst, pos);
      const pc = midi % 12;
      const inFingering = fingering.some((p) => same(p, pos));
      const isSounding = sounding.some((p) => same(p, pos));
      const mark = marks.find((m) => same(m.pos, pos));
      const inScale = scalePcs?.includes(pc) ?? false;
      const visible =
        mark || isSounding || (reveal === "all" && inScale) || (reveal !== "none" && inFingering);
      const isTonic = tonicPc === pc;

      cells.push(
        <g key={`${s}-${f}`}>
          {onPress && (
            <rect
              x={cx(f) - COL / 2}
              y={cy(s) - ROW / 2}
              width={COL}
              height={ROW}
              fill="transparent"
              role="button"
              tabIndex={s === active.string && f === Math.max(from, Math.min(to, active.fret)) ? 0 : -1}
              onFocus={() => setActive({ string: s, fret: f })}
              aria-label={`Cuerda ${s}, traste ${f}`}
              className="cursor-pointer outline-none focus-visible:fill-white/10 hover:fill-white/5"
              onClick={() => onPress({ ...pos, midi })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPress({ ...pos, midi });
                  return;
                }
                const d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
                if (!d) return;
                e.preventDefault();
                const ns = Math.min(nStrings, Math.max(1, s + d[0]));
                const nf = Math.min(to, Math.max(from, f + d[1]));
                gridRef.current
                  ?.querySelector<SVGRectElement>(`[data-cell="${ns}-${nf}"]`)
                  ?.focus();
              }}
              data-cell={`${s}-${f}`}
            />
          )}
          {visible && (
            <g className="pointer-events-none">
              {isSounding && (
                <circle cx={cx(f)} cy={cy(s)} r={13} fill="none" stroke="var(--color-playing)" strokeWidth={3} />
              )}
              <circle
                cx={cx(f)}
                cy={cy(s)}
                r={10}
                fill={
                  mark
                    ? MARK_FILL[mark.kind]
                    : isSounding
                      ? "var(--color-playing)"
                      : isTonic
                        ? "var(--color-accent)"
                        : inFingering
                          ? "#fde68a"
                          : "#475569"
                }
              />
              {showNames && (
                <text
                  x={cx(f)}
                  y={cy(s)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-slate-950 text-[10px] font-bold"
                >
                  {name(pc)}
                </text>
              )}
            </g>
          )}
        </g>,
      );
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={gridRef}
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="max-w-none select-none"
        role={onPress ? "group" : "img"}
        aria-label={`Diapasón de ${inst.name.toLowerCase()}, trastes ${from} a ${to}`}
      >
        {/* Madera */}
        <rect x={LEFT + (showNut ? COL : 0)} y={TOP - 10} width={W - LEFT - 8 - (showNut ? COL : 0)} height={(nStrings - 1) * ROW + 20} rx={4} className="fill-surface-2" />
        {/* Marcadores (inlays) */}
        {Array.from({ length: frets }, (_, i) => from + i)
          .filter((f) => f > 0 && (INLAYS.has(f) || f === 12))
          .map((f) =>
            f === 12 ? (
              <g key={f}>
                <circle cx={cx(f)} cy={TOP + ROW * 0.5} r={4} className="fill-border" />
                <circle cx={cx(f)} cy={TOP + (nStrings - 1.5) * ROW} r={4} className="fill-border" />
              </g>
            ) : (
              <circle key={f} cx={cx(f)} cy={TOP + ((nStrings - 1) * ROW) / 2} r={4} className="fill-border" />
            ),
          )}
        {/* Trastes */}
        {Array.from({ length: frets + 1 }, (_, i) => from + i).map((f) => {
          if (showNut && f === 0) return null;
          const x = LEFT + (f - from) * COL;
          const nut = showNut && f === 1;
          return (
            <line key={f} x1={x} x2={x} y1={TOP - 10} y2={TOP + (nStrings - 1) * ROW + 10} stroke={nut ? "#e2e8f0" : "#64748b"} strokeWidth={nut ? 5 : 2} />
          );
        })}
        {/* Cuerdas (más gruesas las graves) */}
        {Array.from({ length: nStrings }, (_, i) => i + 1).map((s) => (
          <line key={s} x1={LEFT} x2={W - 8} y1={cy(s)} y2={cy(s)} stroke="#cbd5e1" strokeWidth={0.8 + (s - 1) * (instrument === "bass" ? 0.6 : 0.35)} />
        ))}
        {/* Nombres de cuerdas al aire */}
        {inst.tuning.map((m, i) => (
          <text key={i} x={10} y={cy(nStrings - i)} dominantBaseline="central" className="fill-muted text-[11px] font-semibold">
            {SHARP_NAMES[m % 12]}
          </text>
        ))}
        {/* Números de traste */}
        {Array.from({ length: frets }, (_, i) => from + i).map((f) => (
          <text key={f} x={cx(f)} y={H - 6} textAnchor="middle" className="fill-muted text-[11px]">
            {f === 0 ? "aire" : f}
          </text>
        ))}
        {cells}
      </svg>
    </div>
  );
}
