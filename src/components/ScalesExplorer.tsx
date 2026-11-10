// Explorador de escalas: elige raíz + tipo, ve las notas, las escucha y el teclado.

import { useMemo, useState } from "react";
import { SCALE_DEFS, SCALE_ROOTS } from "../lib/data";
import { buildScale, scaleFreqs, scaleIntervals, scaleSteps } from "../lib/theory";
import type { ScaleStep } from "../lib/theory";
import { playSequence } from "../lib/audio";
import { prettyEnglish, toLatin } from "../lib/music";
import { Keyboard } from "./Keyboard";

export default function ScalesExplorer() {
  const [rootIdx, setRootIdx] = useState(0);
  const [scaleId, setScaleId] = useState(SCALE_DEFS[0].id);

  const root = SCALE_ROOTS[rootIdx];
  const def = useMemo(() => SCALE_DEFS.find((d) => d.id === scaleId)!, [scaleId]);
  const notes = useMemo(() => buildScale(root, def), [root, def]);
  const steps = useMemo(() => scaleSteps(notes), [notes]);
  const intervals = useMemo(() => scaleIntervals(notes), [notes]);

  // Notas con la octava (la tónica repetida arriba) para cerrar la escala.
  const notesWithOctave = [...notes, notes[0]];
  const octaveDegree = notes.length + 1;

  const playScale = () => {
    const freqs = scaleFreqs(notes);
    // Añade la octava (tónica ×2) al final para que la escala resuelva.
    playSequence([...freqs, freqs[0] * 2].map((f) => [f]), 0.32, 0.32);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Selectores */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Tónica
          <select
            value={rootIdx}
            onChange={(e) => setRootIdx(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-accent"
          >
            {SCALE_ROOTS.map((r, i) => (
              <option key={r} value={i}>
                {prettyEnglish(r)} · {toLatin(r)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-xs text-muted">
          Tipo de escala
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-accent"
          >
            {SCALE_DEFS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={playScale}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition hover:bg-accent/90"
        >
          ▶ Escuchar escala
        </button>
      </div>

      {/* Notas de la escala */}
      <div>
        <h3 className="mb-1 text-lg font-semibold text-text">
          {prettyEnglish(root)} {def.name}
        </h3>
        <p className="mb-3 text-sm text-muted">{def.description}</p>
        {/* Fórmula de pasos: T T S T T T S */}
        <div className="mb-4 rounded-xl border border-border bg-surface-2 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Fórmula de pasos
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-lg">
            {steps.map((st, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted">–</span>}
                <StepBadge step={st} />
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            <span className="font-semibold text-text">T</span> = tono (2 semitonos) ·{" "}
            <span className="font-semibold text-text">S</span> = semitono ·{" "}
            <span className="font-semibold text-text">T½</span> = tono y medio (3 semitonos). Los
            semitonos son los puntos de referencia: fíjate dónde caen para reconocer la escala.
          </p>
        </div>

        {/* Notas con el intervalo respecto a la tónica y el paso entre ellas */}
        <div className="flex flex-wrap items-center gap-y-3">
          {notesWithOctave.map((n, i) => {
            const isOctave = i === notesWithOctave.length - 1;
            const iv = isOctave ? { symbol: "8", name: "Octava" } : intervals[i];
            return (
              <div key={i} className="flex items-center">
                {i > 0 && (
                  <div className="flex w-9 flex-col items-center sm:w-11">
                    <StepBadge step={steps[i - 1]} small />
                    <span className="mt-0.5 h-px w-full bg-border" />
                  </div>
                )}
                <div
                  title={iv.name}
                  className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 ${
                    isOctave
                      ? "border-accent/50 bg-accent/10"
                      : "border-border bg-surface-2"
                  }`}
                >
                  <span className="text-xs font-semibold text-muted">
                    {isOctave ? octaveDegree : i + 1}
                  </span>
                  <span className="text-xl font-bold text-text">{prettyEnglish(n)}</span>
                  <span className="text-xs text-muted">{isOctave ? "8va" : toLatin(n)}</span>
                  <span className="mt-1 rounded bg-surface px-1.5 font-mono text-xs text-text">
                    {iv.symbol}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Intervalos desde la tónica */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Intervalos desde la tónica
          </div>
          <div className="flex flex-wrap gap-2">
            {intervals.map((iv, i) => (
              <span
                key={i}
                className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text"
              >
                <span className="font-mono font-semibold text-text">{iv.symbol}</span>{" "}
                {iv.name} <span className="text-muted">· {iv.semis} st</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Comparada con la escala mayor (1 2 3 4 5 6 7): cada ♭ baja ese grado un semitono y cada ♯
            lo sube. Así se ve rápido qué la hace diferente.
          </p>
        </div>
        <p className="mt-3 text-sm text-muted">
          El último grado ({octaveDegree}) es la{" "}
          <span className="text-text">misma nota que el 1º</span> (la tónica), pero una octava
          más aguda. Por eso cierra la escala y le da sensación de reposo.
        </p>
      </div>

      {/* Teclado */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-text">Notas en el teclado</h4>
        <Keyboard notes={notes} />
      </div>
    </div>
  );
}

/** Distintivo de un paso (T, S, T½); el símbolo identifica el intervalo. */
function StepBadge({ step, small = false }: { step: ScaleStep; small?: boolean }) {
  return (
    <span
      title={`${step.name} (${step.semis} semitono${step.semis === 1 ? "" : "s"})`}
      className={`font-mono font-semibold text-text ${small ? "text-xs" : ""}`}
    >
      {step.short}
    </span>
  );
}
