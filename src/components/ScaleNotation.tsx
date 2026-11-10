// La escala en partitura según el instrumento: piano (clave de sol), guitarra o bajo
// (pentagrama 8vb + TAB + diapasón con la posición elegida). Todo sale del mismo
// modelo (lib/fretboard) y se ilumina con lo que suena (paso del tag "scale").

import { useMemo, useState } from "react";
import type { StaffEvent } from "../lib/notation";
import {
  INSTRUMENTS,
  latinSpelling,
  spellingPc,
  type InstrumentId,
  type Position,
} from "../lib/fretboard";
import { positionEvents } from "../lib/examples";
import { midiToFreq } from "../lib/theory";
import { playChord } from "../lib/audio";
import { Staff } from "./Staff";
import { Fretboard } from "./Fretboard";

export type ScaleInstrument = "piano" | InstrumentId;

interface Props {
  instrument: ScaleInstrument;
  /** Notas de la escala (ortografía) — para piano. */
  notes: string[];
  /** Alturas escritas = reales del piano (tónica en octava 4 + octava final). */
  pianoMidis: number[];
  /** Posiciones disponibles (guitarra/bajo) y la elegida. */
  positions: Position[];
  posIdx: number;
  onPosIdx: (i: number) => void;
  /** Paso que suena ahora (índice en la escala con octava), si suena. */
  step?: number;
}

const playMidi = (m: number) => playChord([midiToFreq(m)], 0.9);

export function ScaleNotation({ instrument, notes, pianoMidis, positions, posIdx, onPosIdx, step }: Props) {
  const [showTab, setShowTab] = useState(true);
  const [practice, setPractice] = useState(false);

  const pos = instrument === "piano" ? undefined : positions[posIdx];

  const events: StaffEvent[] = useMemo(() => {
    if (pos) {
      const ev = positionEvents(pos);
      return practice ? ev.map((e) => ({ ...e, label: undefined })) : ev;
    }
    const withOct = [...notes, notes[0]];
    return withOct.map((s, i) => ({
      id: `n${i}`,
      kind: "note" as const,
      spelling: s,
      writtenMidi: pianoMidis[i],
      duration: "q" as const,
      label: practice ? undefined : latinSpelling(s),
    }));
  }, [pos, notes, pianoMidis, practice]);

  const marks = step !== undefined ? { [`n${step}`]: "playing" as const } : undefined;

  const onNoteClick = (id: string) => {
    const i = Number(id.slice(1));
    playMidi(pos ? pos.tones[i].midi : pianoMidis[i]);
  };

  if (instrument === "piano" || !pos) {
    return (
      <div className="flex flex-col gap-2">
        {instrument !== "piano" && (
          <p className="text-sm text-muted">No hay una posición cómoda para esta escala en este instrumento.</p>
        )}
        <Staff events={events} clef="treble" marks={marks} onNoteClick={onNoteClick} />
        <PracticeToggle practice={practice} onChange={setPractice} />
      </div>
    );
  }

  const inst = INSTRUMENTS[instrument];
  const lastFret = Math.max(...pos.tones.map((t) => t.fret));
  const fretRange: [number, number] = [0, Math.max(instrument === "bass" ? 7 : 8, lastFret + 1)];
  const spellings = Object.fromEntries(pos.tones.map((t) => [spellingPc(t.spelling), t.spelling]));
  const sounding = step !== undefined && pos.tones[step] ? [pos.tones[step]] : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Posición
          <select
            value={posIdx}
            onChange={(e) => onPosIdx(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-accent"
          >
            {positions.map((p, i) => (
              <option key={p.id} value={i}>
                {positionLabel(p, i)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-muted">
          <input type="checkbox" checked={showTab} onChange={(e) => setShowTab(e.target.checked)} className="accent-accent" />
          Mostrar TAB
        </label>
        <PracticeToggle practice={practice} onChange={setPractice} />
      </div>

      <p className="text-xs text-muted">
        {inst.name}: se escribe en clave de {inst.clef === "bass" ? "fa" : "sol"} con un{" "}
        <span className="font-semibold text-text">8</span> debajo porque{" "}
        <span className="text-text">suena una octava más grave</span> de lo escrito.
      </p>

      <Staff
        events={events}
        instrument={instrument}
        showTab={showTab && !practice}
        marks={marks}
        onNoteClick={onNoteClick}
      />

      <div>
        <h4 className="mb-2 text-sm font-semibold text-text">En el diapasón</h4>
        <Fretboard
          instrument={instrument}
          fretRange={fretRange}
          fingering={pos.tones}
          sounding={sounding}
          tonicPc={spellingPc(pos.tones[0].spelling)}
          reveal={practice ? "none" : "fingering"}
          showNames={!practice}
          spellings={spellings}
          onPress={({ midi }) => playMidi(midi)}
        />
        <p className="mt-1 text-xs text-muted">
          Puntos = digitación de esta posición · ámbar = tónica · cian = lo que suena. Toca cualquier casilla para escucharla.
        </p>
      </div>
    </div>
  );
}

function positionLabel(p: Position, i: number): string {
  const frets = p.tones.filter((t) => t.fret > 0).map((t) => t.fret);
  const lo = frets.length ? Math.min(...frets) : 0;
  const hi = frets.length ? Math.max(...frets) : 0;
  const open = p.tones.some((t) => t.fret === 0);
  const range = open && lo <= 3 ? `abierta (0–${hi})` : `trastes ${lo}–${hi}`;
  return `${i === 0 ? "★ " : ""}${range}`;
}

function PracticeToggle({ practice, onChange }: { practice: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-muted">
      <input type="checkbox" checked={practice} onChange={(e) => onChange(e.target.checked)} className="accent-accent" />
      Modo práctica (ocultar nombres y TAB)
    </label>
  );
}
