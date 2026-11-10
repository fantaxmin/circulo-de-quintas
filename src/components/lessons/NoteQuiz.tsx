import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Staff } from "../Staff";
import { playChord, stopAll } from "../../lib/audio";
import { latinSpelling } from "../../lib/fretboard";
import type { StaffEvent } from "../../lib/notation";
import { midiToFreq } from "../../lib/theory";
import {
  INITIAL_READING, NOTE_NAMES, ROUND_LENGTH, pickNote, readingPool,
  readingReducer, staffLocation, type Clef,
} from "./quiz-model";

const button = "rounded-lg border border-border px-4 py-3 text-sm font-semibold enabled:hover:bg-surface-2 disabled:cursor-default disabled:opacity-50";

export function NoteQuiz() {
  const [clef, setClef] = useState<Clef>("treble");
  const [accidentals, setAccidentals] = useState(false);
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <label className="flex items-center gap-2">Clave
        <select value={clef} className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          onChange={(event) => { stopAll(); setClef(event.target.value as Clef); }}>
          <option value="treble">Sol · Do4–La5</option><option value="bass">Fa · Mi2–Do4</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={accidentals} onChange={(event) => { stopAll(); setAccidentals(event.target.checked); }} />
        Incluir sostenidos y bemoles
      </label>
    </div>
    <p className="text-sm text-muted">Cambiar la clave o las alteraciones inicia una nueva serie. Los aciertos se guardan solo mientras practicas aquí.</p>
    <ReadingRound key={`${clef}-${accidentals}`} clef={clef} accidentals={accidentals} />
  </div>;
}

function ReadingRound({ clef, accidentals }: { clef: Clef; accidentals: boolean }) {
  const pool = useMemo(() => readingPool(clef, accidentals), [clef, accidentals]);
  const [state, dispatch] = useReducer(readingReducer, INITIAL_READING);
  const [accidental, setAccidental] = useState("");
  const firstAnswer = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const { question, round, score, answer } = state;
  const correct = answer !== null && answer === question?.spelling;
  const finished = round === ROUND_LENGTH && answer !== null;
  const events: StaffEvent[] = useMemo(() => question ? [{
    id: "quiz-note", kind: "note", spelling: question.spelling,
    writtenMidi: question.midi, duration: "q",
  }] : [], [question]);

  useEffect(() => { if (question) firstAnswer.current?.focus(); }, [question]);
  useEffect(() => { if (answer !== null) nextButton.current?.focus(); }, [answer]);

  const advance = (type: "start" | "next") => {
    stopAll();
    setAccidental("");
    dispatch({ type, question: pickNote(pool, question) });
  };

  return <>
    {/* La región existe vacía antes de comenzar para anunciar también la primera pregunta. */}
    <p id="note-quiz-question" className="sr-only" aria-live="polite" aria-atomic="true">
      {question ? `Pregunta ${round} de ${ROUND_LENGTH}. ${staffLocation(question, clef)}` : ""}
    </p>
    {!question ? <button type="button" className={`${button} text-accent`} onClick={() => advance("start")}>Comenzar 10 preguntas</button> : <div className="space-y-4">
    <p className="text-sm font-semibold tabular-nums">Pregunta {round} de {ROUND_LENGTH} · Aciertos: {score}</p>
    <Staff events={events} clef={clef} ariaLabel={staffLocation(question, clef)}
      marks={answer === null ? {} : { "quiz-note": correct ? "correct" : "wrong" }} />
    {accidentals && <fieldset disabled={answer !== null} aria-describedby="note-quiz-question" className="flex flex-wrap gap-x-5 gap-y-2 text-sm disabled:opacity-60">
      <legend className="mb-2 font-semibold">Alteración de tu respuesta</legend>
      {[["", "Natural"], ["#", "♯ Sostenido"], ["b", "♭ Bemol"]].map(([value, name]) => <label key={value} className="flex items-center gap-2">
        <input type="radio" name="note-quiz-accidental" value={value} checked={accidental === value} onChange={() => setAccidental(value)} />{name}
      </label>)}
    </fieldset>}
    <div className="flex flex-wrap gap-2" role="group" aria-label="Nombre de la nota escrita" aria-describedby="note-quiz-question">
      {NOTE_NAMES.map(({ letter, name }, index) => <button key={letter} type="button" ref={index === 0 ? firstAnswer : undefined}
        className={button} disabled={answer !== null}
        aria-describedby="note-quiz-question"
        aria-label={`${name}${accidental === "#" ? " sostenido" : accidental === "b" ? " bemol" : " natural"}`}
        onClick={() => {
          if (answer !== null) return;
          stopAll();
          playChord([midiToFreq(question.midi)], 0.9);
          dispatch({ type: "answer", spelling: letter + accidental });
        }}>{name}{accidental === "#" ? "♯" : accidental === "b" ? "♭" : ""}</button>)}
    </div>
    <p className="min-h-12 leading-relaxed" role="status" aria-live="polite" aria-atomic="true">
      {answer === null ? "Elige el nombre de la nota tal como está escrita." : <>
        {correct ? `Correcto: ${latinSpelling(question.spelling)}.` : `Elegiste ${latinSpelling(answer)}. La nota escrita es ${latinSpelling(question.spelling)}.`}
        {finished && ` Serie terminada: ${score} aciertos de ${ROUND_LENGTH}.`}
      </>}
    </p>
    <button type="button" ref={nextButton} className={`${button} text-accent`} disabled={answer === null}
      onClick={() => advance(finished ? "start" : "next")}>{finished ? "Otra ronda" : "Siguiente pregunta"}</button>
  </div>}
  </>;
}
