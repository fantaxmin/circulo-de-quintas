// Ejemplos compartidos por las lecciones (Do mayor / La menor, cuerdas al aire...).
// Se derivan del mismo modelo que el explorador de escalas.

import { SCALE_DEFS } from "./data";
import { INSTRUMENTS, scalePositions, type InstrumentId, type Position } from "./fretboard";
import type { StaffEvent } from "./notation";
import { toLatin } from "./music";

const def = (id: string) => SCALE_DEFS.find((d) => d.id === id)!;

/** Posición por defecto (la más cómoda) de una escala en un instrumento. */
export function defaultPosition(root: string, scaleId: string, inst: InstrumentId): Position | undefined {
  return scalePositions(root, def(scaleId), INSTRUMENTS[inst])[0];
}

/** Eventos de pentagrama (negras) para una posición de escala, con TAB y nombre latino. */
export function positionEvents(pos: Position, duration: StaffEvent["duration"] = "q"): StaffEvent[] {
  return pos.tones.map((t, i) => ({
    id: `n${i}`,
    kind: "note",
    spelling: t.spelling,
    writtenMidi: t.writtenMidi,
    duration,
    tab: { string: t.string, fret: t.fret },
    label: toLatin(t.spelling.replace(/##|bb/, (m) => m[0])),
  }));
}

/** Cuerdas al aire del instrumento como eventos (grave → aguda). */
export function openStringEvents(inst: InstrumentId): StaffEvent[] {
  const d = INSTRUMENTS[inst];
  const names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  return d.tuning.map((midi, i) => {
    const spelling = names[midi % 12];
    return {
      id: `open${i}`,
      kind: "note" as const,
      spelling,
      writtenMidi: midi + d.writtenShift,
      duration: "q" as const,
      tab: { string: d.tuning.length - i, fret: 0 },
      label: toLatin(spelling),
    };
  });
}

/** Do mayor y La menor en guitarra y bajo (posición por defecto de cada una). */
export const LESSON_SCALES = {
  guitar: {
    cMajor: defaultPosition("C", "major", "guitar")!,
    aMinor: defaultPosition("A", "natural-minor", "guitar")!,
  },
  bass: {
    cMajor: defaultPosition("C", "major", "bass")!,
    aMinor: defaultPosition("A", "natural-minor", "bass")!,
  },
};

/** Escala de Do mayor escrita en clave de sol (C4–C5), para las lecciones generales. */
export const C_MAJOR_TREBLE: StaffEvent[] = ["C", "D", "E", "F", "G", "A", "B", "C"].map((s, i) => ({
  id: `c${i}`,
  kind: "note",
  spelling: s,
  writtenMidi: [60, 62, 64, 65, 67, 69, 71, 72][i],
  duration: "q",
  label: toLatin(s),
}));
