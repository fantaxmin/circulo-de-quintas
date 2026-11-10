// Paleta por grado de la escala (0 = I … 6 = vii°). Cada grado tiene un color
// propio que se comparte entre la tablita de grados y el círculo de quintas,
// para que la relación grado ↔ posición se lea de un vistazo. Tonos 400 de
// Tailwind: vivos pero contenidos sobre el fondo oscuro, sin chocar con la UI.

export const DEGREE_COLORS = [
  "#34d399", // I    – verde esmeralda
  "#38bdf8", // ii   – azul cielo
  "#818cf8", // iii  – índigo
  "#c084fc", // IV   – púrpura
  "#f472b6", // V    – rosa
  "#fb923c", // vi   – naranja
  "#facc15", // vii° – amarillo
];

/** Color del grado `index` (0–6); slate si está fuera de rango. */
export function degreeColor(index: number): string {
  return DEGREE_COLORS[index] ?? "#94a3b8";
}
