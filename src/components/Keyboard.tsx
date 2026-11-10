// Teclado de piano (2 octavas, C4–B5) que resalta las notas de una escala/acorde,
// se ilumina con lo que está sonando y se puede tocar con el mouse/touch o el teclado.

import { useRef } from "react";
import { pitchClass, midiToFreq } from "../lib/theory";
import { playChord } from "../lib/audio";

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const WHITE_LABELS = ["C", "D", "E", "F", "G", "A", "B"];
// Tras qué índice blanco (dentro de la octava) hay tecla negra, y su pitch class.
const BLACK_AFTER: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
const OCTAVES = 2;
const BASE_MIDI = 60; // C4
const TOP_MIDI = BASE_MIDI + OCTAVES * 12 - 1;

// Teclado de la computadora -> semitonos desde C4 (fila A = blancas, fila Q = negras).
const KEYMAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, "ñ": 16, ";": 16,
};

/** Lleva una nota fuera de rango a la octava visible más cercana. */
function fold(midi: number): number {
  let m = midi;
  while (m > TOP_MIDI) m -= 12;
  while (m < BASE_MIDI) m += 12;
  return m;
}

function playNote(midi: number): void {
  playChord([midiToFreq(midi)], 0.9);
}

interface Props {
  notes: string[];
  /** Texto de la leyenda para las notas resaltadas (por defecto "Notas de la escala"). */
  legend?: string;
  /** Números MIDI que están sonando (de usePlayingNotes). */
  playing?: Set<number>;
}

export function Keyboard({ notes, legend = "Notas de la escala", playing }: Props) {
  const scale = new Set(notes.map(pitchClass));
  const tonicPc = pitchClass(notes[0]);
  const lit = new Set([...(playing ?? [])].map(fold));
  const held = useRef(new Set<string>());

  const whiteCount = WHITE_PCS.length * OCTAVES;
  const whiteW = 100 / whiteCount;
  const blackW = whiteW * 0.62;

  const keyProps = (midi: number, label: string) => ({
    type: "button" as const,
    "aria-label": label,
    // Solo el contenedor entra en el orden de Tab; las teclas se activan con
    // tecnología asistiva (click sin puntero, detail === 0).
    tabIndex: -1,
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) playNote(midi);
    },
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      playNote(midi);
    },
    // Glissando: arrastrar con el botón presionado toca cada tecla.
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.buttons === 1) playNote(midi);
    },
  });

  const whites: React.ReactNode[] = [];
  const blacks: React.ReactNode[] = [];

  for (let o = 0; o < OCTAVES; o++) {
    for (let i = 0; i < WHITE_PCS.length; i++) {
      const w = o * WHITE_PCS.length + i;
      const pc = WHITE_PCS[i];
      const midi = BASE_MIDI + o * 12 + pc;
      whites.push(
        <button
          key={`w${w}`}
          {...keyProps(midi, `${WHITE_LABELS[i]}${4 + o}`)}
          className={`relative flex flex-1 cursor-pointer touch-none items-end justify-center rounded-b-md border border-slate-400 pb-1 text-[11px] font-semibold transition-[background-color,transform] duration-75 ${whiteClass(
            pc,
            tonicPc,
            scale,
            lit.has(midi),
          )}`}
        >
          {WHITE_LABELS[i]}
        </button>,
      );

      const blackPc = BLACK_AFTER[i];
      if (blackPc !== undefined) {
        const left = (w + 1) * whiteW - blackW / 2;
        const bMidi = BASE_MIDI + o * 12 + blackPc;
        blacks.push(
          <button
            key={`b${w}`}
            {...keyProps(bMidi, `${WHITE_LABELS[i]}♯${4 + o}`)}
            className={`absolute top-0 z-10 h-[62%] cursor-pointer touch-none rounded-b-md border border-slate-700 transition-[background-color,transform] duration-75 ${blackClass(
              blackPc,
              tonicPc,
              scale,
              lit.has(bMidi),
            )}`}
            style={{ left: `${left}%`, width: `${blackW}%` }}
          />,
        );
      }
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const off = KEYMAP[k];
    if (off === undefined || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (held.current.has(k)) return;
    held.current.add(k);
    e.preventDefault();
    playNote(BASE_MIDI + off);
  };

  return (
    <div>
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => held.current.delete(e.key.toLowerCase())}
        onBlur={() => held.current.clear()}
        aria-label="Teclado de piano. Con foco, toca con las teclas A W S E D F T G Y H U J K"
        className="group relative flex h-28 w-full select-none gap-px rounded-md"
      >
        {whites}
        {blacks}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-accent"></span>
          Tónica
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-200"></span>
          {legend}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-playing"></span>
          Sonando
        </span>
        <span className="hidden text-muted/70 sm:inline">
          · Haz clic o enfoca el teclado y toca con A S D F…
        </span>
      </div>
    </div>
  );
}

function whiteClass(pc: number, tonicPc: number, scale: Set<number>, on: boolean): string {
  if (on) return "bg-playing text-slate-950 translate-y-0.5";
  if (pc === tonicPc) return "bg-accent text-slate-950";
  if (scale.has(pc)) return "bg-amber-100 text-slate-800 hover:bg-amber-50";
  return "bg-slate-300 text-slate-500 hover:bg-slate-200";
}

function blackClass(pc: number, tonicPc: number, scale: Set<number>, on: boolean): string {
  if (on) return "bg-playing translate-y-0.5";
  if (pc === tonicPc) return "bg-accent";
  if (scale.has(pc)) return "bg-amber-700 hover:bg-amber-600";
  return "bg-slate-900 hover:bg-slate-800";
}
