// Modelo único para partitura, TAB, diapasón y audio de guitarra y bajo.
// Distingue siempre tres cosas: ortografía (F♯ vs G♭), altura REAL (lo que suena,
// para el audio) y altura ESCRITA (lo que se dibuja: guitarra y bajo se escriben
// una octava por encima de lo que suenan) más la posición cuerda/traste.

import type { ScaleDef } from "./types";
import { buildScale } from "./theory";

export type InstrumentId = "guitar" | "bass";

export interface InstrumentDef {
  id: InstrumentId;
  name: string;
  /** MIDI real de las cuerdas al aire, de la más grave a la más aguda. */
  tuning: number[];
  /** Clave en la que se escribe (se dibuja con un "8" debajo: suena 8va baja). */
  clef: "treble" | "bass";
  /** Semitonos que se suman a la altura real para obtener la escrita. */
  writtenShift: number;
  /** Número de trastes considerados. */
  frets: number;
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentDef> = {
  guitar: {
    id: "guitar",
    name: "Guitarra",
    tuning: [40, 45, 50, 55, 59, 64], // E2 A2 D3 G3 B3 E4
    clef: "treble",
    writtenShift: 12,
    frets: 15,
  },
  bass: {
    id: "bass",
    name: "Bajo",
    tuning: [28, 33, 38, 43], // E1 A1 D2 G2
    clef: "bass",
    writtenShift: 12,
    frets: 12,
  },
};

/** Posición en el diapasón. string 1 = la cuerda más aguda. */
export interface FretPos {
  string: number;
  fret: number;
}

export interface ScaleTone extends FretPos {
  /** Ortografía en notación inglesa: "F#", "Bb", "F##". */
  spelling: string;
  /** Altura real (audio). */
  midi: number;
  /** Altura escrita (partitura). */
  writtenMidi: number;
  /** Grado dentro de la escala (0 = tónica; la octava final vuelve a ser 0). */
  degree: number;
}

export interface Position {
  /** Identificador estable (para selects y keys). */
  id: string;
  /** Altura real de la tónica inicial. */
  startMidi: number;
  /** Trastes pisados [mín, máx] (4 trastes; 5 si hizo falta estirar). Aire si p ≤ 2. */
  window: [number, number];
  /** Una octava ascendente + tónica final, con su digitación. */
  tones: ScaleTone[];
  /** Penalización didáctica (menor = más cómoda). */
  score: number;
}

// --- Ortografía y altura (desde letra + alteraciones, nunca por tabla) ---

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Desplazamiento en semitonos de las alteraciones: "#"=1, "##"=2, "b"=-1, "bb"=-2. */
export function accidentalOffset(spelling: string): number {
  const acc = spelling.slice(1);
  let n = 0;
  for (const ch of acc) {
    if (ch === "#" || ch === "♯") n += 1;
    else if (ch === "b" || ch === "♭") n -= 1;
    else if (ch === "x" || ch === "𝄪") n += 2;
  }
  return n;
}

/** Clase de altura (0–11) de una ortografía, incluidas dobles alteraciones. */
export function spellingPc(spelling: string): number {
  return (((LETTER_PC[spelling[0]] + accidentalOffset(spelling)) % 12) + 12) % 12;
}

/**
 * MIDI de una ortografía en una octava *de letra* (la octava la fija la letra,
 * como en notación: B#3 = 60 = C4, Cb4 = 59 = B3).
 */
export function spellingToMidi(spelling: string, octave: number): number {
  return (octave + 1) * 12 + LETTER_PC[spelling[0]] + accidentalOffset(spelling);
}

/** Octava de letra de una ortografía que suena en `midi` (inversa de spellingToMidi). */
export function letterOctave(spelling: string, midi: number): number {
  return Math.floor((midi - accidentalOffset(spelling) - LETTER_PC[spelling[0]]) / 12) - 1;
}

/** Clave VexFlow: ("F#", 66) -> "f#/4"; ("B#", 60) -> "b#/3"; ("Cb", 59) -> "cb/4". */
export function vexKey(spelling: string, writtenMidi: number): string {
  return `${spelling.toLowerCase()}/${letterOctave(spelling, writtenMidi)}`;
}

/** Ortografía legible: "F##" -> "F𝄪", "Bb" -> "B♭". */
export function prettySpelling(spelling: string): string {
  return spelling[0] + spelling.slice(1).replace(/##/g, "𝄪").replace(/#/g, "♯").replace(/b/g, "♭");
}

// --- Diapasón ---

/** MIDI real de una posición. */
export function fretMidi(inst: InstrumentDef, pos: FretPos): number {
  return inst.tuning[inst.tuning.length - pos.string] + pos.fret;
}

/** Todas las posiciones (dentro de los trastes del instrumento) donde suena `midi`. */
export function positionsOf(inst: InstrumentDef, midi: number, maxFret = inst.frets): FretPos[] {
  const out: FretPos[] = [];
  inst.tuning.forEach((open, i) => {
    const fret = midi - open;
    if (fret >= 0 && fret <= maxFret) out.push({ string: inst.tuning.length - i, fret });
  });
  return out;
}

/** Alturas reales ascendentes de una octava de la escala desde `startMidi` (+ tónica final). */
function octaveMidis(spellings: string[], startMidi: number): number[] {
  const rootPc = spellingPc(spellings[0]);
  let prev = -1;
  const offs = spellings.map((s) => {
    let semi = (spellingPc(s) - rootPc + 12) % 12;
    while (semi <= prev) semi += 12;
    prev = semi;
    return semi;
  });
  return [...offs, 12].map((o) => startMidi + o);
}

/**
 * Elige la mejor digitación de `midis` dentro de la ventana [p, p+3] (búsqueda
 * exhaustiva: son pocas opciones). Penaliza volver a una cuerda más grave,
 * saltar cuerdas y usar cuerdas al aire fuera de la posición abierta.
 */
function fingerWindow(
  inst: InstrumentDef,
  midis: number[],
  p: number,
  width = 4,
): { pos: FretPos[]; score: number } | null {
  const lo = p;
  const hi = p + width - 1;
  const options = midis.map((m) =>
    positionsOf(inst, m).filter((o) => (o.fret >= lo && o.fret <= hi) || (o.fret === 0 && p <= 2)),
  );
  if (options.some((o) => o.length === 0)) return null;

  let best: { pos: FretPos[]; score: number } | null = null;
  const walk = (i: number, acc: FretPos[], score: number) => {
    if (best && score >= best.score) return;
    if (i === midis.length) {
      best = { pos: [...acc], score };
      return;
    }
    for (const o of options[i]) {
      let s = score;
      const prev = acc[i - 1];
      if (prev) {
        if (o.string > prev.string) s += 10; // volver a una cuerda más grave
        if (prev.string - o.string > 1) s += 4; // saltar una cuerda
      }
      acc.push(o);
      walk(i + 1, acc, s);
      acc.pop();
    }
  };
  walk(0, [], 0);
  return best;
}

/**
 * Posiciones candidatas (una octava) de una escala en el instrumento, ordenadas
 * de más cómoda/grave a menos. Lista vacía = sin posición válida.
 */
export function scalePositions(root: string, def: ScaleDef, inst: InstrumentDef): Position[] {
  const spellings = buildScale(root, def);
  if (!spellings.length) return [];
  const rootPc = spellingPc(spellings[0]);
  const lowest = inst.tuning[0];
  const highest = inst.tuning[inst.tuning.length - 1] + inst.frets;

  const out = collect(spellings, rootPc, lowest, highest, inst, 4);
  // Sin digitación en 4 trastes (p.ej. menor melódica en bajo): se permite estirar uno.
  return out.length ? out : collect(spellings, rootPc, lowest, highest, inst, 5);
}

function collect(
  spellings: string[],
  rootPc: number,
  lowest: number,
  highest: number,
  inst: InstrumentDef,
  width: number,
): Position[] {
  const seen = new Set<string>();
  const out: Position[] = [];
  for (let start = lowest; start + 12 <= highest; start++) {
    if (((start % 12) + 12) % 12 !== rootPc) continue;
    const midis = octaveMidis(spellings, start);
    for (let p = 0; p + width - 1 <= inst.frets; p++) {
      const r = fingerWindow(inst, midis, p, width);
      if (!r) continue;
      const sig = r.pos.map((x) => `${x.string}:${x.fret}`).join(",");
      if (seen.has(sig)) continue;
      seen.add(sig);
      const used = r.pos.filter((x) => x.fret > 0).map((x) => x.fret);
      const minFret = used.length ? Math.min(...used) : 0;
      out.push({
        id: sig,
        startMidi: start,
        window: [minFret <= 1 ? 0 : minFret, (used.length ? Math.max(...used) : 0)],
        tones: r.pos.map((x, i) => {
          const spelling = spellings[i % spellings.length];
          const midi = midis[i];
          return { ...x, spelling, midi, writtenMidi: midi + inst.writtenShift, degree: i % spellings.length };
        }),
        score: r.score + (width > 4 ? 6 : 0),
      });
    }
  }
  out.sort((a, b) => a.score - b.score || a.window[0] - b.window[0] || a.startMidi - b.startMidi);
  return out;
}
