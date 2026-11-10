// Isla interactiva raíz: estado de la tonalidad activa y orquestación de audio.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildView, noteToFreq, triadFreqs } from "../lib/theory";
import { BackingTrack, playChord, playSequence, type Genre } from "../lib/audio";
import { initTooltips } from "../lib/tooltip";
import { prettyEnglish } from "../lib/music";
import { Circle } from "./Circle";
import { DegreeCard } from "./DegreeCard";
import { ModePanel } from "./ModePanel";
import { Keyboard } from "./Keyboard";
import { Progressions } from "./Progressions";
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
    setKeyIndex(index);
    setIsMinor(minor);
    const v = buildView(index, minor);
    playChord(triadFreqs(v.notes, 0));
  }, []);

  const toggleRelative = useCallback(() => {
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
    playChord(triadFreqs(view.notes, i));
  }, [view]);

  const playScale = useCallback(() => {
    playSequence(view.degrees.map((_, i) => triadFreqs(view.notes, i)), beat, beat * 0.9, "degrees");
  }, [view, beat]);

  const playProgression = useCallback((degrees: number[]) => {
    // Un acorde cada 2 pulsos (blanca).
    playSequence(degrees.map((i) => triadFreqs(view.notes, i)), beat * 2, beat * 1.8, "progression");
  }, [view, beat]);

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
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-12">
      <div className="min-w-0 self-start lg:sticky lg:top-24">
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
            />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-text">
              Notas de la escala en el teclado
            </h4>
            <Keyboard notes={view.notes} />
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
              onSelect={() => selectDegree(d.index)}
              onPlay={() => playDegree(d.index)}
            />
          ))}
        </div>

        {selectedDegree !== null && (
          <ModePanel degree={view.degrees[selectedDegree]} onClose={() => setSelectedDegree(null)} />
        )}
      </section>

      <section className="min-w-0 lg:col-span-2" aria-labelledby="progressions-heading">
        <h3 id="progressions-heading" className="mb-3 text-lg font-semibold text-text">Progresiones comunes</h3>
        <Progressions view={view} onPlay={playProgression} />
      </section>
    </div>
  );
}
