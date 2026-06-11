// Tipos compartidos del dominio musical y de geometría.

export type Quality = "mayor" | "menor" | "disminuido";

/** Punto en el plano (coordenadas SVG). */
export interface Point {
  x: number;
  y: number;
}

export interface Degree {
  /** Cifrado romano: I, ii, iii, IV, V, vi, vii° */
  roman: string;
  /** Calidad del acorde sobre ese grado. */
  quality: Quality;
}

export interface Key {
  /** Tónica de la tonalidad mayor en notación inglesa (ej. "C", "F#", "Bb"). */
  tonic: string;
  /** Relativo menor (grado vi). */
  relative: string;
  /** Las 7 notas diatónicas de la escala mayor, en orden. */
  notes: string[];
}

export interface DegreeNote {
  /** Nota en notación inglesa (C, D, E...). */
  note: string;
  /** Nota en notación latina/española (Do, Re, Mi...). */
  noteEs: string;
  /** Grado en cifrado romano. */
  roman: string;
  /** Calidad del acorde. */
  quality: Quality;
}

/** Información estática de un modo griego. */
export interface ModeInfo {
  /** Nombre en español (Jónico, Dórico...). */
  name: string;
  /** Nombre en inglés (Ionian, Dorian...). */
  english: string;
  /** Fórmula de intervalos (ej. "1 2 ♭3 4 5 6 ♭7"). */
  formula: string;
  /** Carácter del modo y uso típico. */
  description: string;
}

/** Un grado dentro de una vista (tonalidad mayor o menor). */
export interface DegreeView {
  /** Índice del grado dentro de la escala (0–6). */
  index: number;
  /** Nota raíz en notación inglesa. */
  note: string;
  /** Nota raíz en notación latina. */
  noteEs: string;
  /** Cifrado romano (I, ii, III...). */
  roman: string;
  /** Calidad del acorde diatónico. */
  quality: Quality;
  /** Modo griego asociado a este grado. */
  mode: ModeInfo;
  /** Notas del modo (la escala empezando en esta raíz), en inglés. */
  modeNotes: string[];
}

/** Vista activa: una tonalidad mayor o su relativa menor. */
export interface View {
  /** Índice de la tonalidad en KEYS. */
  keyIndex: number;
  /** Si la vista es menor (relativa) o mayor. */
  isMinor: boolean;
  /** Tónica de la vista en inglés (ej. "C", "A"). */
  tonic: string;
  /** Tónica en latino (ej. "Do", "La"). */
  tonicEs: string;
  /** Notas de la escala de la vista, en orden desde la tónica. */
  notes: string[];
  /** Los 7 grados con su modo. */
  degrees: DegreeView[];
  /** Tónica del par opuesto (la otra vista mayor/menor) en inglés. */
  relativeTonic: string;
  /** Tónica del par opuesto en latino. */
  relativeTonicEs: string;
  /** Etiqueta del par opuesto (ej. "Am", "C"). */
  relativeLabel: string;
}

/** Progresión armónica común expresada en grados. */
export interface Progression {
  /** Nombre/estilo de la progresión. */
  name: string;
  /** Índices de grado (0–6) en orden. */
  degrees: number[];
}

/** Una nota de un acorde: paso diatónico (offset de letra) y semitonos desde la raíz. */
export interface ChordTone {
  /** Offset de letra respecto a la raíz (0 = raíz, 2 = 3ª, 4 = 5ª, 6 = 7ª, 8 = 9ª...). */
  step: number;
  /** Semitonos desde la raíz. */
  semi: number;
}

/** Definición de un tipo de acorde para el explorador. */
export interface ChordDef {
  /** Identificador único. */
  id: string;
  /** Nombre legible (ej. "Séptima mayor"). */
  name: string;
  /** Sufijo del cifrado (ej. "", "m", "dim", "maj7"). */
  symbol: string;
  /** Fórmula de intervalos (ej. "1 · 3 · 5"). */
  formula: string;
  /** Descripción del carácter/uso del acorde. */
  description: string;
  /** Notas que lo componen. */
  tones: ChordTone[];
}

/** Definición de un tipo de escala para el explorador. */
export interface ScaleDef {
  /** Identificador único. */
  id: string;
  /** Nombre legible (ej. "Menor armónica"). */
  name: string;
  /** Descripción del carácter/uso de la escala. */
  description: string;
  /** Construcción directa: semitonos desde la tónica. */
  intervals?: number[];
  /** Construcción derivada: id de la escala padre. */
  parent?: string;
  /** Índices a tomar del padre (para pentatónicas). */
  pick?: number[];
  /** Caso especial: pentatónica menor + ♭5 (escala de blues). */
  blues?: boolean;
}
