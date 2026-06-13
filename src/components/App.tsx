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

const GAP = 0.8; // segundos entre acordes en secuencias

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

  const selectKey = useCallback((index: number) => {
    setKeyIndex(index);
    setIsMinor(false);
    const v = buildView(index, false);
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
    playSequence(view.degrees.map((_, i) => triadFreqs(view.notes, i)), GAP);
  }, [view]);

  const playProgression = useCallback((degrees: number[]) => {
    playSequence(degrees.map((i) => triadFreqs(view.notes, i)), GAP);
  }, [view]);

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
    <div className="flex w-full flex-col items-center gap-8">
      <Circle view={view} onSelect={selectKey} />

      {/* Header de la tonalidad activa */}
      <header className="text-center">
        <h2 className="text-2xl font-semibold text-slate-100">
          Tonalidad:{" "}
          <span className="text-amber-400">
            {prettyEnglish(view.tonic)} {kind} · {view.tonicEs}
          </span>
        </h2>
        <button
          type="button"
          onClick={toggleRelative}
          className="mt-1 text-sm text-slate-400 underline decoration-dotted underline-offset-4 transition hover:text-amber-300"
        >
          {relLabelKind}:{" "}
          <span className="font-semibold text-slate-300">
            {prettyEnglish(view.relativeLabel)} {relKind} · {relEs}
          </span>{" "}
          ↺
        </button>
      </header>

      {/* Grados de la escala */}
      <section className="w-full">
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <h3 className="text-lg font-semibold text-slate-200">Grados de la escala</h3>
          <button
            type="button"
            onClick={playScale}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
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

      {/* Improvisación */}
      <section className="flex w-full flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h3 className="text-center text-xl font-bold text-slate-100">
          Improvisa sobre esta tonalidad
        </h3>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Backing track</h4>
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
          <h4 className="mb-2 text-sm font-semibold text-slate-300">
            Notas de la escala en el teclado
          </h4>
          <Keyboard notes={view.notes} />
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Progresiones comunes</h4>
          <Progressions view={view} onPlay={playProgression} />
        </div>
      </section>
    </div>
  );
}
