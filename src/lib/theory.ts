// Teoría aplicada: frecuencias, tríadas y construcción de la vista activa.

import type { ChordTone, DegreeView, Quality, ScaleDef, View } from "./types";
import { DEGREES, KEYS, MINOR_DEGREES, MODES, SCALE_DEFS } from "./data";
import { toLatin } from "./music";

// Clase de altura (pitch class) de cada nombre de nota, incluyendo enarmónicos.
const PITCH_CLASS: Record<string, number> = {
  C: 0, "B#": 0,
  "C#": 1, Db: 1,
  D: 2,
  "D#": 3, Eb: 3,
  E: 4, Fb: 4,
  "E#": 5, F: 5,
  "F#": 6, Gb: 6,
  G: 7,
  "G#": 8, Ab: 8,
  A: 9,
  "A#": 10, Bb: 10,
  B: 11, Cb: 11,
};

/** Devuelve la clase de altura (0–11) de un nombre de nota. */
export function pitchClass(note: string): number {
  return PITCH_CLASS[note] ?? 0;
}

/** Número MIDI de una nota en una octava dada (C4 = 60). */
export function noteToMidi(note: string, octave: number): number {
  return (octave + 1) * 12 + pitchClass(note);
}

/** Frecuencia en Hz de un número MIDI (A4 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Frecuencia de una nota en una octava dada. */
export function noteToFreq(note: string, octave: number): number {
  return midiToFreq(noteToMidi(note, octave));
}

/**
 * Desplazamientos en semitonos, estrictamente ascendentes, de las notas de una
 * escala respecto a su tónica. Sirve para construir acordes en cualquier escala.
 */
export function ascendingOffsets(notes: string[]): number[] {
  const base = pitchClass(notes[0]);
  let prev = -1;
  return notes.map((n) => {
    let semi = (pitchClass(n) - base + 12) % 12;
    while (semi <= prev) semi += 12;
    prev = semi;
    return semi;
  });
}

/**
 * Frecuencias de la tríada (1ª, 3ª, 5ª) construida sobre el grado `i`
 * de una escala dada por sus notas.
 */
export function triadFreqs(notes: string[], i: number, octave = 4): number[] {
  const offsets = ascendingOffsets(notes);
  const tonicMidi = noteToMidi(notes[0], octave);
  return [i, i + 2, i + 4].map((idx) => {
    const oct = Math.floor(idx / notes.length);
    const off = offsets[idx % notes.length] + 12 * oct;
    return midiToFreq(tonicMidi + off);
  });
}

// --- Construcción de escalas para el explorador ---

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Convierte una diferencia en semitonos a accidentes (♯/♭/♭♭/♯♯). */
function accidental(diff: number): string {
  switch (diff) {
    case 0: return "";
    case 1: return "#";
    case 2: return "##";
    case -1: return "b";
    case -2: return "bb";
    default: return "";
  }
}

/**
 * Deletrea una escala dando a cada grado una letra consecutiva (A–G) y el
 * accidente necesario para alcanzar la altura objetivo. Garantiza ortografía
 * correcta (cada letra una vez) en escalas de hasta 7 notas.
 */
function spellFrom(root: string, intervals: number[]): string[] {
  const li = LETTERS.indexOf(root[0]);
  const rootPc = pitchClass(root);
  return intervals.map((semi, i) => {
    const letter = LETTERS[(li + i) % 7];
    const target = (rootPc + semi) % 12;
    let diff = (target - LETTER_PC[letter] + 12) % 12;
    if (diff > 6) diff -= 12; // elige el accidente más cercano (♯ o ♭)
    return letter + accidental(diff);
  });
}

/** Construye las notas de una escala a partir de su raíz y definición. */
export function buildScale(root: string, def: ScaleDef): string[] {
  if (def.intervals) return spellFrom(root, def.intervals);

  if (def.parent && def.pick) {
    const parent = SCALE_DEFS.find((d) => d.id === def.parent);
    const full = spellFrom(root, parent!.intervals!);
    return def.pick.map((i) => full[i]);
  }

  if (def.blues) {
    // Pentatónica menor (1 ♭3 4 5 ♭7) + la "blue note" ♭5.
    const minor = spellFrom(root, [0, 2, 3, 5, 7, 8, 10]);
    const penta = [0, 2, 3, 4, 6].map((i) => minor[i]);
    const fifthLetter = penta[3][0];
    const target = (pitchClass(root) + 6) % 12;
    let diff = (target - LETTER_PC[fifthLetter] + 12) % 12;
    if (diff > 6) diff -= 12;
    const flat5 = fifthLetter + accidental(diff);
    return [penta[0], penta[1], penta[2], flat5, penta[3], penta[4]];
  }

  return [];
}

/** Deletrea las notas de un acorde a partir de su raíz y sus tonos. */
export function buildChord(root: string, tones: ChordTone[]): string[] {
  const li = LETTERS.indexOf(root[0]);
  const rootPc = pitchClass(root);
  return tones.map(({ step, semi }) => {
    const letter = LETTERS[(li + step) % 7];
    const target = (rootPc + semi) % 12;
    let diff = (target - LETTER_PC[letter] + 12) % 12;
    if (diff > 6) diff -= 12;
    return letter + accidental(diff);
  });
}

/** Frecuencias de las notas de un acorde desde una octava base. */
export function chordFreqs(root: string, tones: ChordTone[], octave = 4): number[] {
  const rootMidi = noteToMidi(root, octave);
  return tones.map(({ semi }) => midiToFreq(rootMidi + semi));
}

/**
 * Frecuencias de un acorde invertido: sube una octava las `inversion` notas
 * más graves y ordena de grave a aguda. inversion 0 = posición fundamental.
 */
export function invertChordFreqs(
  root: string,
  tones: ChordTone[],
  inversion: number,
  octave = 4,
): number[] {
  const rootMidi = noteToMidi(root, octave);
  const semis = tones.map((t, i) => t.semi + (i < inversion ? 12 : 0));
  semis.sort((a, b) => a - b);
  return semis.map((s) => midiToFreq(rootMidi + s));
}

/** Frecuencias de las notas de una escala, ascendentes desde la tónica. */
export function scaleFreqs(notes: string[], octave = 4): number[] {
  const offsets = ascendingOffsets(notes);
  const tonicMidi = noteToMidi(notes[0], octave);
  return offsets.map((off) => midiToFreq(tonicMidi + off));
}

/** Rota un arreglo `n` posiciones a la izquierda (sin mutar). */
function rotate<T>(arr: T[], n: number): T[] {
  return arr.map((_, i) => arr[(i + n) % arr.length]);
}

/** Quita la "m" final de un relativo menor: "Am" -> "A". */
function stripMinor(label: string): string {
  return label.replace(/m$/, "");
}

/**
 * Construye la vista activa (tonalidad mayor o su relativa menor) con sus
 * 7 grados, calidades y modos correspondientes.
 */
export function buildView(keyIndex: number, isMinor: boolean): View {
  const key = KEYS[keyIndex];

  if (!isMinor) {
    // Vista mayor: escala tal cual, modos en orden directo desde el grado.
    const degrees: DegreeView[] = key.notes.map((note, i) =>
      makeDegree(i, note, DEGREES[i].roman, DEGREES[i].quality, key.notes, i),
    );
    return {
      keyIndex,
      isMinor: false,
      tonic: key.tonic,
      tonicEs: toLatin(key.tonic),
      notes: key.notes,
      degrees,
      relativeTonic: stripMinor(key.relative),
      relativeTonicEs: toLatin(stripMinor(key.relative)),
      relativeLabel: key.relative,
    };
  }

  // Vista menor: escala natural relativa = mayor rotada para empezar en el VI.
  const minorNotes = rotate(key.notes, 5);
  const minorTonic = stripMinor(key.relative);
  const degrees: DegreeView[] = minorNotes.map((note, i) => {
    // El modo de cada grado se mide desde el grado mayor equivalente (5 + i).
    const majorDegree = (5 + i) % 7;
    return makeDegree(i, note, MINOR_DEGREES[i].roman, MINOR_DEGREES[i].quality, minorNotes, majorDegree);
  });

  return {
    keyIndex,
    isMinor: true,
    tonic: minorTonic,
    tonicEs: toLatin(minorTonic),
    notes: minorNotes,
    degrees,
    relativeTonic: key.tonic,
    relativeTonicEs: toLatin(key.tonic),
    relativeLabel: key.tonic,
  };
}

function makeDegree(
  index: number,
  note: string,
  roman: string,
  quality: Quality,
  scaleNotes: string[],
  modeIndex: number,
): DegreeView {
  return {
    index,
    note,
    noteEs: toLatin(note),
    roman,
    quality,
    mode: MODES[modeIndex],
    // Las notas del modo = la escala empezando en esta raíz.
    modeNotes: rotate(scaleNotes, index),
  };
}

/** Un paso entre dos notas consecutivas de una escala. */
export interface ScaleStep {
  /** Distancia en semitonos (1, 2, 3...). */
  semis: number;
  /** Abreviatura: S (semitono), T (tono), T½ (tono y medio). */
  short: string;
  /** Nombre completo en español. */
  name: string;
}

const STEP_NAMES: Record<number, [string, string]> = {
  1: ["S", "semitono"],
  2: ["T", "tono"],
  3: ["T½", "tono y medio"],
  4: ["2T", "dos tonos"],
};

/**
 * Fórmula de pasos de una escala (incluye el salto final hasta la octava):
 * mayor -> T T S T T T S.
 */
export function scaleSteps(notes: string[]): ScaleStep[] {
  const offsets = [...ascendingOffsets(notes), 12];
  return offsets.slice(1).map((off, i) => {
    const semis = off - offsets[i];
    const [short, name] = STEP_NAMES[semis] ?? [`${semis}S`, `${semis} semitonos`];
    return { semis, short, name };
  });
}

/** Intervalo de una nota respecto a la tónica. */
export interface Interval {
  /** Símbolo de grado: 1, 2, ♭3, ♯4... */
  symbol: string;
  /** Nombre en español: "3ª menor", "5ª justa"... */
  name: string;
  /** Semitonos desde la tónica. */
  semis: number;
}

// Semitonos de los intervalos mayores/justos para 1ª..7ª.
const NATURAL_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const PERFECT = new Set([1, 4, 5]);

/** Intervalo de cada nota de la escala respecto a su tónica (según su letra). */
export function scaleIntervals(notes: string[]): Interval[] {
  const offsets = ascendingOffsets(notes);
  const rootLetter = LETTERS.indexOf(notes[0][0]);
  return notes.map((n, i) => {
    const num = ((LETTERS.indexOf(n[0]) - rootLetter + 7) % 7) + 1;
    const semis = offsets[i];
    const diff = semis - NATURAL_SEMIS[num - 1];
    const symbol = (diff < 0 ? "♭".repeat(-diff) : "♯".repeat(diff)) + num;
    let quality: string;
    if (num === 1) quality = "tónica";
    else if (PERFECT.has(num)) quality = diff === 0 ? "justa" : diff < 0 ? "disminuida" : "aumentada";
    else quality = diff === 0 ? "mayor" : diff === -1 ? "menor" : diff < -1 ? "disminuida" : "aumentada";
    const name = num === 1 ? "Tónica" : `${num}ª ${quality}`;
    return { symbol, name, semis };
  });
}
