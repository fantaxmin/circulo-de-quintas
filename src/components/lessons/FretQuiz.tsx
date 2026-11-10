import { useEffect, useMemo, useRef, useState } from "react";
import { Staff } from "../Staff";
import { Fretboard, type FretboardProps } from "../Fretboard";
import { playChord, stopAll } from "../../lib/audio";
import { INSTRUMENTS, fretMidi, latinSpelling, letterOctave, positionsOf, type FretPos, type InstrumentId } from "../../lib/fretboard";
import type { StaffEvent } from "../../lib/notation";
import { midiToFreq } from "../../lib/theory";
import { usePlayingNotes } from "../../lib/usePlayingNotes";
import { fretPool, pickNote, staffLocation, type QuizNote } from "./quiz-model";

const button = "rounded-lg border border-border px-4 py-3 text-sm font-semibold text-accent enabled:hover:bg-surface-2 disabled:cursor-default disabled:opacity-50";

export function FretQuiz() {
  const [instrument, setInstrument] = useState<InstrumentId>("guitar");
  const [expanded, setExpanded] = useState(false);
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <label className="flex items-center gap-2">Instrumento
        <select value={instrument} className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          onChange={(event) => { stopAll(); setInstrument(event.target.value as InstrumentId); }}>
          <option value="guitar">Guitarra</option><option value="bass">Bajo</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={expanded} onChange={(event) => { stopAll(); setExpanded(event.target.checked); }} />
        Ampliar a trastes 0–12
      </label>
    </div>
    <p className="text-sm leading-relaxed text-muted">Solo notas naturales, trastes 0–{expanded ? 12 : 5}. La nota suena una octava más grave de lo escrito. Cambiar el instrumento o el rango reinicia la práctica.</p>
    <FretRound key={`${instrument}-${expanded}`} instrument={instrument} maxFret={expanded ? 12 : 5} />
  </div>;
}

function FretRound({ instrument, maxFret }: { instrument: InstrumentId; maxFret: number }) {
  const inst = INSTRUMENTS[instrument];
  const pool = useMemo(() => fretPool(instrument, maxFret), [instrument, maxFret]);
  const [question, setQuestion] = useState<QuizNote | null>(null);
  const [attempt, setAttempt] = useState<{ pos: FretPos; midi: number; correct: boolean } | null>(null);
  const playing = usePlayingNotes();
  const boardRef = useRef<HTMLDivElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const solved = attempt?.correct ?? false;
  const valid = useMemo(() => question ? positionsOf(inst, question.midi, maxFret) : [], [inst, question, maxFret]);
  const events: StaffEvent[] = useMemo(() => question ? [{
    id: "fret-quiz-note", kind: "note", spelling: question.spelling,
    writtenMidi: question.midi + inst.writtenShift, duration: "q",
  }] : [], [question, inst]);
  const marks: NonNullable<FretboardProps["marks"]> = [
    ...(attempt ? [{ pos: attempt.pos, kind: solved ? "correct" as const : "wrong" as const }] : []),
    ...(solved ? valid.map((pos) => ({ pos, kind: "target" as const })) : []),
  ];

  useEffect(() => { if (question) boardRef.current?.querySelector<SVGElement>('[data-cell="1-0"]')?.focus(); }, [question]);
  useEffect(() => { if (solved) nextButton.current?.focus(); }, [solved]);

  const next = () => {
    stopAll();
    setAttempt(null);
    setQuestion(pickNote(pool, question));
  };

  if (!question) return <button type="button" className={button} onClick={next}>Comenzar práctica</button>;

  return <div className="min-w-0 space-y-4">
    <Staff events={events} instrument={instrument} showTab={false}
      ariaLabel={`${staffLocation({ ...question, midi: question.midi + inst.writtenShift }, inst.clef)} Suena una octava más grave.`}
      marks={attempt ? { "fret-quiz-note": solved ? "correct" : "wrong" } : {}} />
    <p className="text-sm text-muted" id="fret-quiz-keyboard">Con teclado: Tab entra en el diapasón, las flechas cambian de cuerda o traste y Enter o Espacio eligen una posición.</p>
    <div ref={boardRef} className="max-w-full overflow-x-auto" role="group" aria-label="Elige dónde tocar la nota" aria-describedby="fret-quiz-keyboard">
      <Fretboard instrument={instrument} fretRange={[0, maxFret]} reveal="none" showNames={false}
        marks={marks} sounding={playing.steps["fret-quiz"] !== undefined && attempt ? [attempt.pos] : []}
        onPress={(pos) => {
          if (solved) return;
          const midi = fretMidi(inst, pos);
          stopAll();
          playChord([midiToFreq(midi)], 0.9, { tag: "fret-quiz", step: 0 });
          setAttempt({ pos: { string: pos.string, fret: pos.fret }, midi, correct: midi === question.midi });
        }} />
    </div>
    <p className="min-h-12 leading-relaxed" role="status" aria-live="polite" aria-atomic="true">
      {!attempt ? "Busca la altura escrita y toca una posición en el diapasón." : solved
        ? `Correcto: suena ${latinSpelling(question.spelling)}${letterOctave(question.spelling, question.midi)}. Tu posición está en verde; las demás posiciones válidas, en ámbar.`
        : `Cuerda ${attempt.pos.string}, traste ${attempt.pos.fret}: esa altura no coincide. Prueba otra posición; el mismo nombre en otra octava no cuenta.`}
    </p>
    {solved && <p className="text-sm leading-relaxed text-muted">Posiciones válidas: {valid.map((pos) => `cuerda ${pos.string}, traste ${pos.fret}`).join(" · ")}.</p>}
    <button type="button" ref={nextButton} className={button} disabled={!solved} onClick={next}>Siguiente nota</button>
  </div>;
}
