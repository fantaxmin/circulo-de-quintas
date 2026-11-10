// Isla interactiva raíz: estado de la tonalidad activa y orquestación de audio.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildView, noteToFreq, triadFreqs } from "../lib/theory";
import {
  BackingTrack,
  audioNow,
  onPlayback,
  playChord,
  playSequence,
  scheduleSequence,
  stopAll,
  type Genre,
} from "../lib/audio";
import { usePlayingNotes } from "../lib/usePlayingNotes";
import { initTooltips } from "../lib/tooltip";
import { prettyEnglish } from "../lib/music";
import { Circle } from "./Circle";
import { DegreeCard } from "./DegreeCard";
import { ModePanel } from "./ModePanel";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Keyboard } from "./Keyboard";
import { Progressions, progressionTag } from "./Progressions";
import { BackingControls } from "./BackingControls";

export default function App() {
  const [keyIndex, setKeyIndex] = useState(0);
  const [isMinor, setIsMinor] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState<number | null>(null);

  const [genre, setGenre] = useState<Genre>("pop");
  const [bpm, setBpm] = useState(90);
  const [backingPlaying, setBackingPlaying] = useState(false);
  const trackRef = useRef<BackingTrack | null>(null);

  const view = useMemo(() => buildView(keyIndex, isMinor), [keyIndex, isMinor]);

  // Tooltips globales (una sola vez).
  useEffect(() => {
    initTooltips();
  }, []);

  // Mantiene el backing track sincronizado mientras suena.
  useEffect(() => {
    const t = trackRef.current;
    if (t && backingPlaying) {
      t.genre = genre;
      t.bpm = bpm;
      t.bassFreq = noteToFreq(view.tonic, 2);
    }
  }, [genre, bpm, view, backingPlaying]);

  // Detiene el audio al desmontar.
  useEffect(() => () => trackRef.current?.stop(), []);

  // Tempo compartido: las secuencias siguen el BPM del backing track.
  const beat = 60 / bpm;

  const selectKey = useCallback((index: number, minor: boolean) => {
    stopAll();
    setKeyIndex(index);
    setIsMinor(minor);
    const v = buildView(index, minor);
    playChord(triadFreqs(v.notes, 0));
  }, []);

  const toggleRelative = useCallback(() => {
    stopAll();
    setIsMinor((prev) => {
      const next = !prev;
      const v = buildView(keyIndex, next);
      playChord(triadFreqs(v.notes, 0));
      return next;
    });
  }, [keyIndex]);

  const selectDegree = useCallback((i: number) => {
    setSelectedDegree((prev) => (prev === i ? null : i));
  }, []);

  const playDegree = useCallback((i: number) => {
    playChord(triadFreqs(view.notes, i), 1.3, { tag: "degrees", step: i });
  }, [view]);

  const playScale = useCallback(() => {
    playSequence(view.degrees.map((_, i) => triadFreqs(view.notes, i)), beat, beat, "degrees");
  }, [view, beat]);

  // Transporte del loop de progresiones: programa cada vuelta justo antes de que
  // termine la anterior, así se puede cortar o desactivar en cualquier momento.
  const loopRef = useRef({ on: false, timer: null as number | null });

  const clearLoopTimer = useCallback(() => {
    const l = loopRef.current;
    if (l.timer !== null) window.clearTimeout(l.timer);
    l.timer = null;
  }, []);

  // Cualquier stopAll() (botón ■, cambio de tonalidad...) cancela las vueltas pendientes.
  useEffect(() => onPlayback((e) => {
    if (e.type === "stop") clearLoopTimer();
  }), [clearLoopTimer]);

  const setLoop = useCallback((on: boolean) => {
    loopRef.current.on = on;
  }, []);

  const playProgression = useCallback((name: string, degrees: number[], loop: boolean) => {
    // Un acorde cada 2 pulsos (blanca).
    stopAll();
    loopRef.current.on = loop;
    const chords = degrees.map((i) => triadFreqs(view.notes, i));
    const gap = beat * 2;
    const tag = progressionTag(name);

    const lap = (at: number | undefined, lapIndex: number) => {
      const end = scheduleSequence(chords, gap, gap, { tag, at, stepOffset: lapIndex * chords.length });
      const l = loopRef.current;
      // 300 ms antes del final, decide si programar otra vuelta.
      l.timer = window.setTimeout(() => {
        l.timer = null;
        if (l.on) lap(end, lapIndex + 1);
      }, Math.max(0, (end - audioNow() - 0.3) * 1000));
    };
    lap(undefined, 0);
  }, [view, beat]);

  // Lo que suena ahora (teclas, grado, acorde de la progresión, pulso del backing).
  const playing = usePlayingNotes();
  const soundingDegree = playing.steps.degrees;

  const toggleBacking = useCallback(() => {
    if (!trackRef.current) trackRef.current = new BackingTrack();
    const t = trackRef.current;
    if (backingPlaying) {
      t.stop();
      setBackingPlaying(false);
    } else {
      t.genre = genre;
      t.bpm = bpm;
      t.bassFreq = noteToFreq(view.tonic, 2);
      t.start();
      setBackingPlaying(true);
    }
  }, [backingPlaying, genre, bpm, view]);

  const kind = isMinor ? "menor" : "mayor";
  const relKind = isMinor ? "mayor" : "menor";
  const relLabelKind = isMinor ? "Relativa mayor" : "Relativa menor";
  const relEs = isMinor ? `${view.relativeTonicEs} mayor` : `${view.relativeTonicEs} menor`;

  return (
    <MotionConfig reducedMotion="user">
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-12">
      <div className="min-w-0 self-start">
        <Circle keyIndex={keyIndex} isMinor={isMinor} onSelect={selectKey} />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        {/* Header de la tonalidad activa */}
        <header className="text-center">
          <h2 className="text-2xl font-semibold text-text">
            Tonalidad:{" "}
            <span className="text-accent">
              {prettyEnglish(view.tonic)} {kind} · {view.tonicEs}
            </span>
          </h2>
          <button
            type="button"
            onClick={toggleRelative}
            className="mt-1 text-sm text-muted underline decoration-dotted underline-offset-4 transition hover:text-accent"
          >
            {relLabelKind}:{" "}
            <span className="font-semibold text-text">
              {prettyEnglish(view.relativeLabel)} {relKind} · {relEs}
            </span>{" "}
            ↺
          </button>
        </header>

        <section className="flex min-w-0 flex-col gap-5" aria-labelledby="improv-heading">
          <h3 id="improv-heading" className="text-xl font-bold text-text">
            Improvisa sobre esta tonalidad
          </h3>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-text">Backing track</h4>
            <BackingControls
              genre={genre}
              bpm={bpm}
              isPlaying={backingPlaying}
              onGenre={setGenre}
              onBpm={setBpm}
              onToggle={toggleBacking}
              beat={playing.steps.beat}
            />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-text">
              Notas de la escala en el teclado
            </h4>
            <Keyboard notes={view.notes} playing={playing.notes} />
          </div>
        </section>
      </div>

      {/* Grados de la escala */}
      <section className="min-w-0 lg:col-span-2">
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <h3 className="text-lg font-semibold text-text">Grados de la escala</h3>
          <button
            type="button"
            onClick={playScale}
            className="rounded-lg border border-border bg-transparent px-4 py-1.5 text-sm font-semibold text-accent transition hover:bg-surface-2"
          >
            ▶ Reproducir progresión
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap">
          {view.degrees.map((d) => (
            <DegreeCard
              key={d.index}
              degree={d}
              isMinor={view.isMinor}
              selected={selectedDegree === d.index}
              sounding={soundingDegree === d.index}
              onSelect={() => selectDegree(d.index)}
              onPlay={() => playDegree(d.index)}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {selectedDegree !== null && (
            <motion.div
              key={`${keyIndex}-${isMinor}-${selectedDegree}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <ModePanel degree={view.degrees[selectedDegree]} onClose={() => setSelectedDegree(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="min-w-0 lg:col-span-2" aria-labelledby="progressions-heading">
        <h3 id="progressions-heading" className="mb-3 text-lg font-semibold text-text">Progresiones comunes</h3>
        <Progressions
          view={view}
          onPlay={playProgression}
          onStop={stopAll}
          onLoopChange={setLoop}
          steps={playing.steps}
        />
      </section>
    </div>
    </MotionConfig>
  );
}
