// Tipos compartidos de notación: eventos que dibuja <Staff> (notas y silencios).

import type { FretPos, InstrumentId } from "./fretboard";

/** Figuras soportadas en el MVP: redonda, blanca, negra, corchea. */
export type Duration = "w" | "h" | "q" | "8";

export interface StaffEvent {
  /** Identificador estable (para resaltar, marcar y clicar). */
  id: string;
  kind: "note" | "rest";
  /** Ortografía inglesa ("F#", "Bb", "F##"). Requerida si kind = "note". */
  spelling?: string;
  /** Altura ESCRITA en MIDI (la octava la deriva Staff junto con la alteración). */
  writtenMidi?: number;
  duration: Duration;
  /** Posición en TAB (sólo se usa si el Staff dibuja tablatura). */
  tab?: FretPos;
  /** Texto bajo la nota (p.ej. "Do", "1", "T"). */
  label?: string;
}

/** Marca visual de una nota (ejercicios). */
export type NoteMark = "playing" | "correct" | "wrong" | "target";

export interface StaffProps {
  events: StaffEvent[];
  /** Clave cuando no hay instrumento (lecciones generales). Por defecto "treble". */
  clef?: "treble" | "bass";
  /**
   * Instrumento de cuerda: fija la clave del instrumento con "8" debajo (suena
   * 8va baja) y habilita la TAB de 6 (guitarra) o 4 (bajo) cuerdas.
   */
  instrument?: InstrumentId;
  /** Muestra la TAB bajo el pentagrama (sólo con instrument). Por defecto true. */
  showTab?: boolean;
  /** Compás, p.ej. "4/4". Sin compás = notas sueltas sin barras (escalas). */
  timeSignature?: string;
  /** Marcas por id de evento (la nota que suena, aciertos, errores...). */
  marks?: Record<string, NoteMark>;
  /** Clic o Enter/Espacio sobre una nota (foco itinerante con flechas). */
  onNoteClick?: (id: string) => void;
  /** Descripción accesible del pentagrama completo. */
  ariaLabel?: string;
}
