import { useState } from "react";
import { Staff } from "../Staff";
import { Fretboard, type FretboardProps } from "../Fretboard";
import { playChord, playSequence, stopAll } from "../../lib/audio";
import { INSTRUMENTS, type FretPos } from "../../lib/fretboard";
import type { StaffProps } from "../../lib/notation";
import { midiToFreq } from "../../lib/theory";
import { usePlayingNotes } from "../../lib/usePlayingNotes";

const button = "rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-2";

interface Props extends Pick<StaffProps, "events" | "instrument" | "clef" | "timeSignature" | "ariaLabel"> {
  /** Identificador único en la página, también entre raíces React independientes. */
  lessonId: string;
  /** Todos los eventos del ejemplo tienen la misma duración; negra = 0,6 s (100 bpm). */
  beatSeconds?: number;
  board?: Omit<FretboardProps, "instrument" | "sounding" | "onPress">;
}

export function LessonStaff({ lessonId, events, instrument, clef, timeSignature, ariaLabel, beatSeconds = 0.6, board }: Props) {
  const tag = `lesson-${lessonId}`;
  const playing = usePlayingNotes();
  const [pressed, setPressed] = useState<FretPos>();
  const step = playing.steps[tag];
  const current = step === undefined ? undefined : events[step];
  const shift = instrument ? INSTRUMENTS[instrument].writtenShift : 0;
  const gap = beatSeconds * ({ w: 4, h: 2, q: 1, "8": 0.5 }[events[0]?.duration ?? "q"]);
  const frequency = (event: typeof events[number]) => midiToFreq(event.writtenMidi! - shift);

  const playNote = (id: string) => {
    const index = events.findIndex((event) => event.id === id);
    const event = events[index];
    if (!event || event.kind === "rest") return;
    setPressed(undefined);
    stopAll();
    playChord([frequency(event)], gap * 0.9, { tag, step: index });
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${button} text-accent`} onClick={() => {
          setPressed(undefined);
          playSequence(events.map((event) => event.kind === "rest" ? [] : [frequency(event)]), gap, gap * 0.9, tag);
        }}>Escuchar ejemplo</button>
        <button type="button" className={button} onClick={stopAll}>Detener</button>
      </div>
      <div className="max-w-full overflow-x-auto rounded-lg border border-border bg-surface-2 p-2" role="region" aria-label={ariaLabel ?? "Ejemplo musical"} tabIndex={0}>
        <Staff events={events} instrument={instrument} clef={clef} timeSignature={timeSignature}
          marks={current ? { [current.id]: "playing" } : {}} onNoteClick={playNote} ariaLabel={ariaLabel} />
      </div>
      {board && instrument && <div className="max-w-full overflow-x-auto" role="region" aria-label="Diapasón interactivo" tabIndex={0}>
        <Fretboard {...board} instrument={instrument}
          sounding={step === undefined ? [] : current?.tab ? [current.tab] : pressed ? [pressed] : []}
          onPress={(pos) => {
            const event = events.find((event) => event.tab?.string === pos.string && event.tab.fret === pos.fret);
            if (event) playNote(event.id);
            else {
              stopAll();
              setPressed(pos);
              playChord([midiToFreq(pos.midi)], 0.8, { tag, step: -1 });
            }
          }} />
      </div>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Escuchar notas por separado">
        {events.filter((event) => event.kind === "note").map((event) => <button key={event.id} type="button"
          className={`${button} ${current?.id === event.id ? "border-playing text-playing" : "text-text"}`}
          onClick={() => playNote(event.id)}>
          {event.label ?? event.spelling}{event.tab && <span className="ml-1 font-normal text-muted">· cuerda {event.tab.string}, traste {event.tab.fret}</span>}
        </button>)}
      </div>
      <p className="min-h-6 text-sm text-muted" role="status" aria-live="polite">
        {current ? `Suena ${current.label ?? current.spelling}${current.tab ? ` · cuerda ${current.tab.string}, traste ${current.tab.fret}` : ""}.` : "Pulsa una nota para escucharla, o reproduce el ejemplo completo."}
      </p>
    </div>
  );
}
