// Teclado de piano visual (2 octavas) que resalta las notas de una escala.
// La tónica (primera nota) se distingue del resto de notas de la escala.

import { pitchClass } from "../lib/theory";

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const WHITE_LABELS = ["C", "D", "E", "F", "G", "A", "B"];
// Tras qué índice blanco (dentro de la octava) hay tecla negra, y su pitch class.
const BLACK_AFTER: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
const OCTAVES = 2;

interface Props {
  notes: string[];
  /** Texto de la leyenda para las notas resaltadas (por defecto "Notas de la escala"). */
  legend?: string;
}

export function Keyboard({ notes, legend = "Notas de la escala" }: Props) {
  const scale = new Set(notes.map(pitchClass));
  const tonicPc = pitchClass(notes[0]);
  const whiteCount = WHITE_PCS.length * OCTAVES;
  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;

  const whites: React.ReactNode[] = [];
  const blacks: React.ReactNode[] = [];

  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < WHITE_PCS.length; i++) {
      const w = o * WHITE_PCS.length + i;
      const pc = WHITE_PCS[i];
      whites.push(
        <div
          key={`w${w}`}
          className={`relative flex flex-1 items-end justify-center rounded-b-md border border-slate-400 pb-1 text-[10px] font-semibold ${whiteClass(pc, tonicPc, scale)}`}
        >
          {WHITE_LABELS[i]}
        </div>,
      );

      const blackPc = BLACK_AFTER[i];
      if (blackPc !== undefined) {
        const left = (w + 1) * whiteW - blackW / 2;
        blacks.push(
          <div
            key={`b${w}`}
            className={`absolute top-0 z-10 h-[62%] rounded-b-md border border-slate-700 ${blackClass(blackPc, tonicPc, scale)}`}
            style={{ left: `${left}%`, width: `${blackW}%` }}
          />,
        );
      }
    }
  }

  return (
    <div>
      <div className="relative flex h-28 w-full select-none gap-px">
        {whites}
        {blacks}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-400 ring-2 ring-amber-200"></span>
          Tónica
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400"></span>
          {legend}
        </span>
      </div>
    </div>
  );
}

function whiteClass(pc: number, tonicPc: number, scale: Set<number>): string {
  if (pc === tonicPc) return "bg-amber-400 text-amber-950 ring-2 ring-inset ring-amber-200";
  if (scale.has(pc)) return "bg-emerald-400 text-emerald-950";
  return "bg-slate-200 text-slate-500";
}

function blackClass(pc: number, tonicPc: number, scale: Set<number>): string {
  if (pc === tonicPc) return "bg-amber-500 ring-2 ring-inset ring-amber-200";
  if (scale.has(pc)) return "bg-emerald-600";
  return "bg-slate-900";
}
