// Diapasón en SVG (guitarra/bajo). PROVISIONAL: placeholder mientras se implementa.

import type { FretPos, InstrumentId } from "../lib/fretboard";

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
  /** Marcas de ejercicio sobre posiciones concretas. */
  marks?: { pos: FretPos; kind: FretMark }[];
  /** Pulsar una posición (clic o teclado). midi = altura real. */
  onPress?: (pos: FretPos & { midi: number }) => void;
}

export function Fretboard({ instrument }: FretboardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
      [diapasón de {instrument === "guitar" ? "guitarra" : "bajo"}]
    </div>
  );
}
