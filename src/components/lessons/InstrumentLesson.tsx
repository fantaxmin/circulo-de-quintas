import { useState } from "react";
import { LessonStaff } from "./LessonStaff";
import { stopAll } from "../../lib/audio";
import { LESSON_SCALES, openStringEvents, positionEvents } from "../../lib/examples";
import { INSTRUMENTS, fretMidi, positionsOf, type InstrumentId } from "../../lib/fretboard";
import type { StaffEvent } from "../../lib/notation";

type Mode = "open" | "natural" | "unison" | "scales";
const naturalNames: Record<number, [string, string]> = {
  0: ["C", "Do"], 2: ["D", "Re"], 4: ["E", "Mi"], 5: ["F", "Fa"],
  7: ["G", "Sol"], 9: ["A", "La"], 11: ["B", "Si"],
};

export function InstrumentLesson({ mode }: { mode: Mode }) {
  const id = `instrument-lesson-${mode}`;
  const [instrument, setInstrument] = useState<InstrumentId>("guitar");
  const [scale, setScale] = useState<"cMajor" | "aMinor">("cMajor");
  const [string, setString] = useState(1);
  const inst = INSTRUMENTS[instrument];
  const position = LESSON_SCALES[instrument][scale];
  let events: StaffEvent[];

  if (mode === "scales") events = position ? positionEvents(position) : [];
  else if (mode === "open") events = openStringEvents(instrument);
  else if (mode === "unison") {
    // Unísonos que caben en trastes 0–5: Mi4 en guitarra y La1 en bajo.
    const midi = instrument === "guitar" ? 64 : 33;
    events = positionsOf(inst, midi, 5).map((pos, i) => ({
      id: `unison-${i}`, kind: "note", spelling: instrument === "guitar" ? "E" : "A", label: instrument === "guitar" ? "Mi" : "La",
      writtenMidi: midi + inst.writtenShift, duration: "q", tab: pos,
    }));
  } else {
    events = Array.from({ length: 6 }, (_, fret) => {
      const midi = fretMidi(inst, { string, fret });
      const name = naturalNames[midi % 12];
      return name ? [{ id: `natural-${string}-${fret}`, kind: "note" as const,
        spelling: name[0], label: name[1], writtenMidi: midi + inst.writtenShift,
        duration: "q" as const, tab: { string, fret } }] : [];
    }).flat();
  }

  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap gap-4 text-sm">
      <label className="flex items-center gap-2" htmlFor={`${id}-instrument`}>Instrumento
        <select id={`${id}-instrument`} value={instrument} className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          onChange={(e) => { stopAll(); setInstrument(e.target.value as InstrumentId); setString(1); }}>
          <option value="guitar">Guitarra</option><option value="bass">Bajo</option>
        </select>
      </label>
      {mode === "scales" && <label className="flex items-center gap-2" htmlFor={`${id}-scale`}>Escala
        <select id={`${id}-scale`} value={scale} className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          onChange={(e) => { stopAll(); setScale(e.target.value as typeof scale); }}>
          <option value="cMajor">Do mayor</option><option value="aMinor">La menor natural</option>
        </select>
      </label>}
      {mode === "natural" && <label className="flex items-center gap-2" htmlFor={`${id}-string`}>Cuerda
        <select id={`${id}-string`} value={string} className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          onChange={(e) => { stopAll(); setString(Number(e.target.value)); }}>
          {inst.tuning.map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
      </label>}
    </div>
    {events.length ? <LessonStaff key={`${instrument}-${scale}-${string}`} lessonId={id} instrument={instrument} events={events}
      ariaLabel={`${inst.name}: ${mode === "open" ? "cuerdas al aire, de grave a aguda" : mode === "natural" ? `notas naturales de la cuerda ${string}, trastes 0 a 5` : mode === "unison" ? `la misma altura ${instrument === "guitar" ? "Mi" : "La"} en varias cuerdas` : scale === "cMajor" ? "Do mayor" : "La menor natural"}. Pentagrama y tablatura.`}
      board={{ fretRange: mode === "scales" ? [0, Math.max(5, position.window[1])] : [0, 5],
        fingering: events.flatMap((event) => event.tab ? [event.tab] : []),
        reveal: "fingering", showNames: true,
        tonicPc: mode === "scales" ? (scale === "cMajor" ? 0 : 9) : undefined }} />
      : <p className="text-muted">No hay una posición disponible para este ejemplo.</p>}
    {mode === "open" && <p className="text-sm text-muted">De la cuerda más grave a la más aguda: {instrument === "guitar" ? "6ª Mi · 5ª La · 4ª Re · 3ª Sol · 2ª Si · 1ª Mi." : "4ª Mi · 3ª La · 2ª Re · 1ª Sol."}</p>}
    {mode === "scales" && position && <p className="text-sm text-muted">Una octava ascendente. La TAB indica la cuerda y el traste de cada nota; el 0 significa cuerda al aire. Sigue el mismo recorrido en el diapasón.</p>}
  </div>;
}
