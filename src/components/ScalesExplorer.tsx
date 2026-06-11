// Explorador de escalas: elige raíz + tipo, ve las notas, las escucha y el teclado.

import { useMemo, useState } from "react";
import { SCALE_DEFS, SCALE_ROOTS } from "../lib/data";
import { buildScale, scaleFreqs } from "../lib/theory";
import { playSequence } from "../lib/audio";
import { prettyEnglish, toLatin } from "../lib/music";
import { Keyboard } from "./Keyboard";

export default function ScalesExplorer() {
  const [rootIdx, setRootIdx] = useState(0);
  const [scaleId, setScaleId] = useState(SCALE_DEFS[0].id);

  const root = SCALE_ROOTS[rootIdx];
  const def = useMemo(() => SCALE_DEFS.find((d) => d.id === scaleId)!, [scaleId]);
  const notes = useMemo(() => buildScale(root, def), [root, def]);

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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Tónica
          <select
            value={rootIdx}
            onChange={(e) => setRootIdx(Number(e.target.value))}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
          >
            {SCALE_ROOTS.map((r, i) => (
              <option key={r} value={i}>
                {prettyEnglish(r)} · {toLatin(r)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
          Tipo de escala
          <select
            value={scaleId}
            onChange={(e) => setScaleId(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
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
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          ▶ Escuchar escala
        </button>
      </div>

      {/* Notas de la escala */}
      <div>
        <h3 className="mb-1 text-lg font-semibold text-slate-100">
          {prettyEnglish(root)} {def.name}
        </h3>
        <p className="mb-3 text-sm text-slate-400">{def.description}</p>
        <div className="flex flex-wrap gap-2">
          {notesWithOctave.map((n, i) => {
            const isOctave = i === notesWithOctave.length - 1;
            return (
              <div
                key={i}
                className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 ${
                  isOctave
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-slate-700 bg-slate-800/60"
                }`}
              >
                <span className="text-xs font-semibold text-amber-400">
                  {isOctave ? octaveDegree : i + 1}
                </span>
                <span className="text-xl font-bold text-slate-50">{prettyEnglish(n)}</span>
                <span className="text-xs text-slate-400">{isOctave ? "8va" : toLatin(n)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-slate-400">
          El último grado ({octaveDegree}) es la{" "}
          <span className="text-slate-200">misma nota que el 1º</span> (la tónica), pero una octava
          más aguda. Por eso cierra la escala y le da sensación de reposo.
        </p>
      </div>

      {/* Teclado */}
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-300">Notas en el teclado</h4>
        <Keyboard notes={notes} />
      </div>
    </div>
  );
}
