// Explorador de acordes: elige raíz, compara tipos y prueba inversiones.

import { useMemo, useState } from "react";
import { CHORD_DEFS, SCALE_ROOTS } from "../lib/data";
import { buildChord, chordFreqs, invertChordFreqs } from "../lib/theory";
import { playChord, playSequence } from "../lib/audio";
import { usePlayingNotes } from "../lib/usePlayingNotes";
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

  const playing = usePlayingNotes();

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
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Raíz del acorde
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
        <p className="text-sm text-muted sm:pb-2">
          Elige un tipo de acorde abajo para escucharlo y verlo en el teclado.
        </p>
      </div>

      {/* Detalle del acorde seleccionado */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-text">
              {prettyEnglish(root)}
              {def.symbol}{" "}
              <span className="text-base font-normal text-text">— {def.name}</span>
            </h3>
            <p className="mt-1 text-sm text-muted">{def.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => playBlock()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition hover:bg-accent/90"
            >
              ▶ Acorde
            </button>
            <button
              type="button"
              onClick={playArpeggio}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-2"
            >
              ▶ Arpegio
            </button>
          </div>
        </div>

        {/* Inversiones */}
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text">Inversión:</span>
            <div className="flex flex-wrap gap-1">
              {notes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInversion(i)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    inv === i
                      ? "border border-accent bg-accent/10 text-accent"
                      : "border border-border text-text hover:bg-surface-2"
                  }`}
                >
                  {i === 0 ? "Fundamental" : `${i}ª`}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted">
            {positionName(inv)} — en el bajo suena la{" "}
            <span className="font-semibold text-text">
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
                i === 0 ? "border-accent/50 bg-accent/10" : "border-border bg-surface-2"
              }`}
            >
              <span className="text-xs font-semibold text-muted">{voicingDegrees[i]}</span>
              <span className="text-xl font-bold text-text">{prettyEnglish(n)}</span>
              <span className="text-xs text-muted">
                {i === 0 ? "bajo" : toLatin(n)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h4 className="mb-2 text-sm font-semibold text-text">Notas en el teclado</h4>
          <Keyboard notes={notes} legend="Notas del acorde" playing={playing.notes} />
        </div>
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
                  ? "border-accent ring-1 ring-accent/50"
                  : "border-border bg-surface-2 hover:border-accent/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-bold text-text">
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
                  className="rounded-md border border-border px-2 py-0.5 text-xs font-semibold text-text transition hover:bg-surface/90"
                  aria-label={`Reproducir ${c.name}`}
                >
                  ▶
                </button>
              </div>
              <span className="text-xs font-medium text-muted">{c.name}</span>
              <span className="font-mono text-xs text-muted">{c.formula}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
