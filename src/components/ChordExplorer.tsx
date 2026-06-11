// Explorador de acordes: elige raíz, compara tipos y prueba inversiones.

import { useMemo, useState } from "react";
import { CHORD_DEFS, SCALE_ROOTS } from "../lib/data";
import { buildChord, chordFreqs, invertChordFreqs } from "../lib/theory";
import { playChord, playSequence } from "../lib/audio";
import { prettyEnglish, toLatin } from "../lib/music";
import { Keyboard } from "./Keyboard";

function positionName(inv: number): string {
  return inv === 0 ? "Fundamental" : `${inv}ª inversión`;
}

export default function ChordExplorer() {
  const [rootIdx, setRootIdx] = useState(0);
  const [chordId, setChordId] = useState(CHORD_DEFS[0].id);
  const [inversion, setInversion] = useState(0);

  const root = SCALE_ROOTS[rootIdx];
  const def = useMemo(() => CHORD_DEFS.find((c) => c.id === chordId)!, [chordId]);
  const notes = useMemo(() => buildChord(root, def.tones), [root, def]);
  const degrees = def.formula.split(" · ");

  // Clampa la inversión al nº de notas del acorde actual.
  const inv = Math.min(inversion, notes.length - 1);

  // Notas reordenadas según la inversión (la grave pasa al inicio).
  const voicing = [...notes.slice(inv), ...notes.slice(0, inv)];
  const voicingDegrees = [...degrees.slice(inv), ...degrees.slice(0, inv)];

  const selectChord = (id: string) => {
    setChordId(id);
    setInversion(0);
  };

  const playBlock = (tones = def.tones, useInversion = true) =>
    playChord(useInversion ? invertChordFreqs(root, tones, inv) : chordFreqs(root, tones));
  const playArpeggio = () =>
    playSequence(invertChordFreqs(root, def.tones, inv).map((f) => [f]), 0.22, 0.6);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Selector de raíz */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Raíz del acorde
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
        <p className="text-sm text-slate-400 sm:pb-2">
          Elige un tipo de acorde abajo para escucharlo y verlo en el teclado.
        </p>
      </div>

      {/* Cuadrícula de tipos de acorde */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {CHORD_DEFS.map((c) => {
          const selected = c.id === chordId;
          return (
            <div
              key={c.id}
              onClick={() => selectChord(c.id)}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectChord(c.id);
                }
              }}
              className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors ${
                selected
                  ? "border-amber-500 ring-1 ring-amber-500/50"
                  : "border-slate-700 bg-slate-800/60 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-slate-50">
                  {prettyEnglish(root)}
                  {c.symbol}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectChord(c.id);
                    playChord(chordFreqs(root, c.tones));
                  }}
                  className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-semibold text-slate-900 transition hover:bg-amber-400"
                  aria-label={`Reproducir ${c.name}`}
                >
                  ▶
                </button>
              </div>
              <span className="text-xs font-medium text-amber-400">{c.name}</span>
              <span className="font-mono text-xs text-slate-400">{c.formula}</span>
            </div>
          );
        })}
      </div>

      {/* Detalle del acorde seleccionado */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-50">
              {prettyEnglish(root)}
              {def.symbol}{" "}
              <span className="text-base font-normal text-amber-300">— {def.name}</span>
            </h3>
            <p className="mt-1 text-sm text-slate-400">{def.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => playBlock()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
            >
              ▶ Acorde
            </button>
            <button
              type="button"
              onClick={playArpeggio}
              className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
            >
              ▶ Arpegio
            </button>
          </div>
        </div>

        {/* Inversiones */}
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-300">Inversión:</span>
            <div className="flex flex-wrap gap-1">
              {notes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInversion(i)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    inv === i
                      ? "bg-amber-500 text-slate-900"
                      : "border border-slate-600 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {i === 0 ? "Fundamental" : `${i}ª`}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {positionName(inv)} — en el bajo suena la{" "}
            <span className="font-semibold text-cyan-300">
              {prettyEnglish(voicing[0])} ({voicingDegrees[0]})
            </span>
            . Mismas notas, distinto orden.
          </p>
        </div>

        {/* Notas del voicing actual */}
        <div className="mt-4 flex flex-wrap gap-2">
          {voicing.map((n, i) => (
            <div
              key={i}
              className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 ${
                i === 0 ? "border-cyan-400/60 bg-cyan-500/10" : "border-slate-700 bg-slate-800/60"
              }`}
            >
              <span className="text-xs font-semibold text-amber-400">{voicingDegrees[i]}</span>
              <span className="text-xl font-bold text-slate-50">{prettyEnglish(n)}</span>
              <span className="text-xs text-slate-400">
                {i === 0 ? "bajo" : toLatin(n)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Notas en el teclado</h4>
          <Keyboard notes={notes} />
        </div>
      </div>
    </div>
  );
}
