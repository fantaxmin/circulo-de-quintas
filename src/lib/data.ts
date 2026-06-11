// Datos del círculo de quintas: tonalidades, grados, modos y progresiones.

import type { ChordDef, Degree, Key, ModeInfo, Progression, ScaleDef } from "./types";

/** Grados de una escala mayor (el patrón de calidades es siempre el mismo). */
export const DEGREES: Degree[] = [
  { roman: "I", quality: "mayor" },
  { roman: "ii", quality: "menor" },
  { roman: "iii", quality: "menor" },
  { roman: "IV", quality: "mayor" },
  { roman: "V", quality: "mayor" },
  { roman: "vi", quality: "menor" },
  { roman: "vii°", quality: "disminuido" },
];

// Orden del círculo de quintas (sentido horario empezando por Do, arriba).
export const KEYS: Key[] = [
  { tonic: "C", relative: "Am", notes: ["C", "D", "E", "F", "G", "A", "B"] },
  { tonic: "G", relative: "Em", notes: ["G", "A", "B", "C", "D", "E", "F#"] },
  { tonic: "D", relative: "Bm", notes: ["D", "E", "F#", "G", "A", "B", "C#"] },
  { tonic: "A", relative: "F#m", notes: ["A", "B", "C#", "D", "E", "F#", "G#"] },
  { tonic: "E", relative: "C#m", notes: ["E", "F#", "G#", "A", "B", "C#", "D#"] },
  { tonic: "B", relative: "G#m", notes: ["B", "C#", "D#", "E", "F#", "G#", "A#"] },
  { tonic: "F#", relative: "D#m", notes: ["F#", "G#", "A#", "B", "C#", "D#", "E#"] },
  { tonic: "Db", relative: "Bbm", notes: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"] },
  { tonic: "Ab", relative: "Fm", notes: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"] },
  { tonic: "Eb", relative: "Cm", notes: ["Eb", "F", "G", "Ab", "Bb", "C", "D"] },
  { tonic: "Bb", relative: "Gm", notes: ["Bb", "C", "D", "Eb", "F", "G", "A"] },
  { tonic: "F", relative: "Dm", notes: ["F", "G", "A", "Bb", "C", "D", "E"] },
];

// Modos griegos, indexados por grado de la escala mayor (0 = I, 1 = ii, ...).
export const MODES: ModeInfo[] = [
  {
    name: "Jónico",
    english: "Ionian",
    formula: "1 2 3 4 5 6 7",
    description: "Alegre y estable. La escala mayor clásica.",
  },
  {
    name: "Dórico",
    english: "Dorian",
    formula: "1 2 ♭3 4 5 6 ♭7",
    description: "Melancólico pero groovy. Común en jazz y funk. (Ej: So What — Miles Davis)",
  },
  {
    name: "Frigio",
    english: "Phrygian",
    formula: "1 ♭2 ♭3 4 5 ♭6 ♭7",
    description: "Oscuro y exótico. Muy usado en flamenco y metal.",
  },
  {
    name: "Lidio",
    english: "Lydian",
    formula: "1 2 3 ♯4 5 6 7",
    description: "Soñador y etéreo. (Ej: Flying — John Williams)",
  },
  {
    name: "Mixolidio",
    english: "Mixolydian",
    formula: "1 2 3 4 5 6 ♭7",
    description: "Dominante y rockero. La escala del blues-rock.",
  },
  {
    name: "Eólico",
    english: "Aeolian",
    formula: "1 2 ♭3 4 5 ♭6 ♭7",
    description: "Triste y dramático. La escala menor natural.",
  },
  {
    name: "Locrio",
    english: "Locrian",
    formula: "1 ♭2 ♭3 4 ♭5 ♭6 ♭7",
    description: "Inestable y tenso. Poco usado, crea máxima disonancia.",
  },
];

/** Calidades de los grados de una escala menor natural (i, ii°, III, iv, v, VI, VII). */
export const MINOR_DEGREES: Degree[] = [
  { roman: "i", quality: "menor" },
  { roman: "ii°", quality: "disminuido" },
  { roman: "III", quality: "mayor" },
  { roman: "iv", quality: "menor" },
  { roman: "v", quality: "menor" },
  { roman: "VI", quality: "mayor" },
  { roman: "VII", quality: "mayor" },
];

/** Progresiones comunes para tonalidad mayor (índices de grado 0–6). */
export const MAJOR_PROGRESSIONS: Progression[] = [
  { name: "Pop/Rock clásico", degrees: [0, 3, 4, 0] }, // I – IV – V – I
  { name: "Pop romántico", degrees: [0, 5, 3, 4] }, // I – vi – IV – V
  { name: "Los 4 acordes", degrees: [0, 4, 5, 3] }, // I – V – vi – IV
  { name: "Jazz (ii–V–I)", degrees: [1, 4, 0] }, // ii – V – I
];

/** Progresiones comunes para tonalidad menor (índices de grado 0–6). */
export const MINOR_PROGRESSIONS: Progression[] = [
  { name: "Menor épico", degrees: [0, 6, 5, 6] }, // i – VII – VI – VII
  { name: "Menor clásico", degrees: [0, 3, 4, 0] }, // i – iv – v – i
  { name: "Pop menor", degrees: [0, 5, 2, 6] }, // i – VI – III – VII
  { name: "Jazz menor (ii°–V–i)", degrees: [1, 4, 0] }, // ii° – v – i
];

/** Raíces disponibles en los exploradores (las 12 alturas). */
export const SCALE_ROOTS = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
];

/** Tipos de acorde del explorador. tones: [offset de letra, semitonos desde la raíz]. */
export const CHORD_DEFS: ChordDef[] = [
  {
    id: "major",
    name: "Mayor",
    symbol: "",
    formula: "1 · 3 · 5",
    description: "La tríada básica: alegre y estable.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 7 }],
  },
  {
    id: "minor",
    name: "Menor",
    symbol: "m",
    formula: "1 · ♭3 · 5",
    description: "Tríada con 3ª menor: triste o melancólica.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 3 }, { step: 4, semi: 7 }],
  },
  {
    id: "diminished",
    name: "Disminuido",
    symbol: "dim",
    formula: "1 · ♭3 · ♭5",
    description: "3ª y 5ª menores: tenso e inestable, pide resolver.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 3 }, { step: 4, semi: 6 }],
  },
  {
    id: "augmented",
    name: "Aumentado",
    symbol: "aug",
    formula: "1 · 3 · ♯5",
    description: "5ª aumentada: tenso y flotante, sin reposo.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 8 }],
  },
  {
    id: "sus2",
    name: "Suspendido 2",
    symbol: "sus2",
    formula: "1 · 2 · 5",
    description: "Sin 3ª, con la 2ª: abierto, ni mayor ni menor.",
    tones: [{ step: 0, semi: 0 }, { step: 1, semi: 2 }, { step: 4, semi: 7 }],
  },
  {
    id: "sus4",
    name: "Suspendido 4",
    symbol: "sus4",
    formula: "1 · 4 · 5",
    description: "Sin 3ª, con la 4ª: suspendido, resuelve a la 3ª.",
    tones: [{ step: 0, semi: 0 }, { step: 3, semi: 5 }, { step: 4, semi: 7 }],
  },
  {
    id: "sixth",
    name: "Sexta",
    symbol: "6",
    formula: "1 · 3 · 5 · 6",
    description: "Mayor con la 6ª añadida: dulce y retro.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 7 }, { step: 5, semi: 9 }],
  },
  {
    id: "dom7",
    name: "Séptima de dominante",
    symbol: "7",
    formula: "1 · 3 · 5 · ♭7",
    description: "Tensión que empuja a resolver. La base del blues.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 7 }, { step: 6, semi: 10 }],
  },
  {
    id: "maj7",
    name: "Séptima mayor",
    symbol: "maj7",
    formula: "1 · 3 · 5 · 7",
    description: "Suave y jazzístico, con color soñador.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 7 }, { step: 6, semi: 11 }],
  },
  {
    id: "min7",
    name: "Séptima menor",
    symbol: "m7",
    formula: "1 · ♭3 · 5 · ♭7",
    description: "Cálido y oscuro: muy usado en jazz y soul.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 3 }, { step: 4, semi: 7 }, { step: 6, semi: 10 }],
  },
  {
    id: "m7b5",
    name: "Semidisminuido",
    symbol: "m7♭5",
    formula: "1 · ♭3 · ♭5 · ♭7",
    description: "Oscuro y tenso: el ii en las tonalidades menores.",
    tones: [{ step: 0, semi: 0 }, { step: 2, semi: 3 }, { step: 4, semi: 6 }, { step: 6, semi: 10 }],
  },
  {
    id: "dom9",
    name: "Novena",
    symbol: "9",
    formula: "1 · 3 · 5 · ♭7 · 9",
    description: "Dominante con color extra: funk, jazz y soul.",
    tones: [
      { step: 0, semi: 0 }, { step: 2, semi: 4 }, { step: 4, semi: 7 },
      { step: 6, semi: 10 }, { step: 8, semi: 14 },
    ],
  },
];

/** Tipos de escala del explorador. */
export const SCALE_DEFS: ScaleDef[] = [
  {
    id: "major",
    name: "Mayor (Jónica)",
    description: "La escala alegre y estable por excelencia. Base de la música occidental.",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: "natural-minor",
    name: "Menor natural (Eólica)",
    description: "La escala menor triste y dramática. Mismas notas que su relativa mayor.",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: "harmonic-minor",
    name: "Menor armónica",
    description: "Menor con la 7ª elevada: crea una dominante fuerte y un giro exótico característico.",
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
  {
    id: "melodic-minor",
    name: "Menor melódica",
    description: "Menor con 6ª y 7ª elevadas al subir: suaviza el salto de la armónica. Clave en jazz.",
    intervals: [0, 2, 3, 5, 7, 9, 11],
  },
  {
    id: "dorian",
    name: "Dórica",
    description: "Menor pero con 6ª mayor: melancólica y groovy. Muy usada en jazz y funk.",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  {
    id: "phrygian",
    name: "Frigia",
    description: "Menor con 2ª menor: oscura y exótica. Sonido flamenco y metal.",
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  {
    id: "lydian",
    name: "Lidia",
    description: "Mayor con 4ª aumentada: soñadora y etérea. Sonido de bandas sonoras.",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  {
    id: "mixolydian",
    name: "Mixolidia",
    description: "Mayor con 7ª menor: dominante y rockera. La escala del blues-rock.",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  {
    id: "locrian",
    name: "Locria",
    description: "La más inestable: 2ª y 5ª disminuidas. Crea máxima tensión.",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  {
    id: "major-penta",
    name: "Pentatónica mayor",
    description: "Cinco notas de la escala mayor sin semitonos: brillante y fácil de improvisar.",
    parent: "major",
    pick: [0, 1, 2, 4, 5],
  },
  {
    id: "minor-penta",
    name: "Pentatónica menor",
    description: "Cinco notas de la escala menor: la base del rock, blues y el solo de guitarra.",
    parent: "natural-minor",
    pick: [0, 2, 3, 4, 6],
  },
  {
    id: "blues",
    name: "Blues (menor)",
    description: "Pentatónica menor más la 'blue note' (♭5): sonido tenso y expresivo del blues.",
    blues: true,
  },
];
