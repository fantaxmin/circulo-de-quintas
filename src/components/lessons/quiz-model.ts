import {
  INSTRUMENTS, fretMidi, letterOctave, spellingToMidi,
  type InstrumentId,
} from "../../lib/fretboard";

export const NOTE_NAMES = [
  { letter: "C", name: "Do" }, { letter: "D", name: "Re" },
  { letter: "E", name: "Mi" }, { letter: "F", name: "Fa" },
  { letter: "G", name: "Sol" }, { letter: "A", name: "La" },
  { letter: "B", name: "Si" },
];
export type Clef = "treble" | "bass";
export interface QuizNote { spelling: string; midi: number }
export const ROUND_LENGTH = 10;

export function readingPool(clef: Clef, accidentals: boolean): QuizNote[] {
  const [low, high] = clef === "treble" ? [60, 81] : [40, 60];
  // Primer contacto con alteraciones: cinco alturas cromáticas, con ambas grafías.
  const spellings = NOTE_NAMES.map(({ letter }) => letter).concat(
    accidentals ? ["C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb"] : [],
  );
  return [1, 2, 3, 4, 5].flatMap((octave) => spellings.map((spelling) => ({
    spelling, midi: spellingToMidi(spelling, octave),
  }))).filter(({ midi }) => midi >= low && midi <= high);
}

export function fretPool(instrument: InstrumentId, maxFret: number): QuizNote[] {
  const inst = INSTRUMENTS[instrument];
  const naturalPcs = new Map(NOTE_NAMES.map(({ letter }) => [spellingToMidi(letter, 0) % 12, letter]));
  const midis = new Set(inst.tuning.flatMap((_, i) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => fretMidi(inst, { string: i + 1, fret })),
  ));
  return [...midis].sort((a, b) => a - b).flatMap((midi) => {
    const spelling = naturalPcs.get(midi % 12);
    return spelling ? [{ spelling, midi }] : [];
  });
}

/** Se llama tras un gesto del usuario para que SSR e hidratación coincidan. */
export function pickNote(pool: QuizNote[], previous?: QuizNote | null): QuizNote {
  const choices = pool.filter((note) => note.midi !== previous?.midi);
  const available = choices.length ? choices : pool;
  return available[Math.floor(Math.random() * available.length)];
}

/** Describe el lugar escrito sin dar el nombre que el alumno debe identificar. */
export function staffLocation(note: QuizNote, clef: Clef): string {
  const letter = NOTE_NAMES.findIndex(({ letter }) => letter === note.spelling[0]);
  const diatonic = letterOctave(note.spelling, note.midi) * 7 + letter;
  const bottom = clef === "treble" ? 4 * 7 + 2 : 2 * 7 + 4; // Mi4 / Sol2.
  const offset = diatonic - bottom;
  const place = offset >= 0 && offset <= 8
    ? offset % 2 === 0 ? `línea ${offset / 2 + 1} contando desde abajo` : `espacio ${(offset + 1) / 2} contando desde abajo`
    : offset < 0
      ? offset % 2 === 0 ? `línea adicional ${-offset / 2} por debajo` : `espacio ${(-offset + 1) / 2} por debajo`
      : offset % 2 === 0 ? `línea adicional ${(offset - 8) / 2} por encima` : `espacio ${(offset - 7) / 2} por encima`;
  const accidental = note.spelling.endsWith("#") ? "sostenido" : note.spelling.endsWith("b") ? "bemol" : "sin alteración";
  return `Nota en ${place}, ${accidental}. Clave de ${clef === "treble" ? "sol" : "fa"}.`;
}

export interface ReadingState {
  question: QuizNote | null;
  round: number;
  score: number;
  answer: string | null;
}
export const INITIAL_READING: ReadingState = { question: null, round: 0, score: 0, answer: null };
export type ReadingAction =
  | { type: "start"; question: QuizNote }
  | { type: "next"; question: QuizNote }
  | { type: "answer"; spelling: string };

export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  if (action.type === "start") return { question: action.question, round: 1, score: 0, answer: null };
  if (action.type === "next") {
    if (state.answer === null || state.round >= ROUND_LENGTH) return state;
    return { ...state, question: action.question, round: state.round + 1, answer: null };
  }
  if (!state.question || state.answer !== null) return state;
  return { ...state, answer: action.spelling, score: state.score + Number(action.spelling === state.question.spelling) };
}
