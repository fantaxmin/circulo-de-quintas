// Helpers de notación inglesa <-> latina.

/** Equivalencia inglés -> latino (do, re, mi...). */
const LATIN: Record<string, string> = {
  C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si",
};

/**
 * Convierte una nota en notación inglesa a notación latina/española.
 * "F#" -> "Fa♯", "Bb" -> "Si♭", "Am" -> "La m".
 */
export function toLatin(note: string): string {
  const m = note.match(/^([A-G])(#|b)?(m)?$/);
  if (!m) return note;
  const [, letter, accidental, minor] = m;
  let out = LATIN[letter] ?? letter;
  if (accidental === "#") out += "♯";
  if (accidental === "b") out += "♭";
  if (minor) out += " m";
  return out;
}

/** Embellece los accidentes para mostrar (# -> ♯, b -> ♭). */
export function prettyEnglish(note: string): string {
  return note.replace("#", "♯").replace("b", "♭");
}
