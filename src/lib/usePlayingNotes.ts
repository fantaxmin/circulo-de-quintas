// Hook que refleja en la UI lo que está sonando, siguiendo el reloj del AudioContext.
// Escucha los eventos de lib/audio.ts y, en cada frame, calcula qué notas MIDI
// están activas y qué paso de cada secuencia (por tag) está sonando.

import { useEffect, useRef, useState } from "react";
import { audioNow, onPlayback, type NoteEvent } from "./audio";

export interface Playing {
  /** Números MIDI que suenan ahora mismo. */
  notes: Set<number>;
  /** Paso activo por tag de secuencia (ej. { progression: 2 }). El tag "beat" es el pulso del backing (0–3). */
  steps: Record<string, number>;
}

const EMPTY: Playing = { notes: new Set(), steps: {} };

export function usePlayingNotes(): Playing {
  const [playing, setPlaying] = useState<Playing>(EMPTY);
  const events = useRef<NoteEvent[]>([]);
  const raf = useRef<number | null>(null);
  const lastKey = useRef("");

  useEffect(() => {
    const tick = () => {
      const now = audioNow();
      // Descarta lo que ya terminó.
      events.current = events.current.filter((e) => e.start + e.duration > now);

      const notes = new Set<number>();
      const steps: Record<string, number> = {};
      for (const e of events.current) {
        if (e.start > now) continue;
        if (e.midi >= 0) notes.add(e.midi);
        if (e.tag !== undefined && e.step !== undefined) steps[e.tag] = e.step;
      }

      // Solo re-renderiza cuando cambia algo.
      const key = [...notes].sort().join(",") + "|" + JSON.stringify(steps);
      if (key !== lastKey.current) {
        lastKey.current = key;
        setPlaying(notes.size || Object.keys(steps).length ? { notes, steps } : EMPTY);
      }

      raf.current = events.current.length ? requestAnimationFrame(tick) : null;
    };

    const ensureLoop = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };

    const off = onPlayback((e) => {
      if (e.type === "stop") {
        // Corta notas pero conserva los pulsos del backing track.
        events.current = events.current.filter((ev) => ev.tag === "beat");
      } else if (e.type === "beat") {
        events.current.push({ type: "note", midi: -1, start: e.start, duration: e.duration, tag: "beat", step: e.beat });
      } else events.current.push(e);
      ensureLoop();
    });

    return () => {
      off();
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  return playing;
}
