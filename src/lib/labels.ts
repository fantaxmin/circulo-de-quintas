// Copia de UI para términos técnicos: etiquetas, clases de badge y tooltips.

import type { DegreeView, Quality } from "./types";

/** Clases Tailwind del badge de calidad. */
export const QUALITY_BADGE: Record<Quality, string> = {
  mayor: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  menor: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  disminuido: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

/** Texto corto del badge de calidad. */
export const QUALITY_LABEL: Record<Quality, string> = {
  mayor: "Mayor",
  menor: "menor",
  disminuido: "dim",
};

/** Tooltip explicativo de cada calidad. */
export const QUALITY_TIP: Record<Quality, string> = {
  mayor: "Acorde con 3ª mayor: suena alegre y estable.",
  menor: "Acorde con 3ª menor: suena triste o melancólico.",
  disminuido: "3ª menor + 5ª disminuida: suena tenso e inestable.",
};

const ROLE_NAMES = [
  "Tónica", "Supertónica", "Mediante", "Subdominante",
  "Dominante", "Superdominante", "Sensible",
];

const ROLE_TIP = [
  "el centro de reposo de la tonalidad.",
  "un grado por encima de la tónica.",
  "a mitad de camino entre tónica y dominante.",
  "prepara la dominante; sonido de apertura.",
  "crea tensión que pide resolver a la tónica.",
  "el grado de la tonalidad relativa.",
  "a medio tono de la tónica; empuja a resolver.",
];

/** Tooltip del cifrado romano según su función dentro de la tonalidad. */
export function romanTip(d: DegreeView, isMinor: boolean): string {
  const role = isMinor && d.index === 6 ? "Subtónica" : ROLE_NAMES[d.index];
  const tip = isMinor && d.index === 6 ? "a un tono de la tónica (menor natural)." : ROLE_TIP[d.index];
  return `${d.roman} · ${role}: ${tip}`;
}

/** Tooltip genérico de los modos griegos. */
export const MODE_TIP =
  "Modo griego: una escala que empieza en este grado y le da un color propio.";
