// Selector de instrumento (piano muestreado / sinte) con estado de carga del piano.
// La elección se recuerda en localStorage.

import { useEffect, useState } from "react";
import {
  getInstrument,
  onPianoStatus,
  setInstrument,
  type InstrumentKind,
  type PianoStatus,
} from "../lib/audio";

const STORAGE_KEY = "cq:instrument";

export function InstrumentPicker() {
  const [kind, setKind] = useState<InstrumentKind>(getInstrument());
  const [status, setStatus] = useState<PianoStatus>("idle");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "piano" || saved === "synth") {
        setInstrument(saved);
        setKind(saved);
      }
    } catch {
      /* almacenamiento no disponible */
    }
    return onPianoStatus(setStatus);
  }, []);

  const change = (k: InstrumentKind) => {
    setInstrument(k);
    setKind(k);
    try {
      localStorage.setItem(STORAGE_KEY, k);
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const note =
    kind !== "piano"
      ? null
      : status === "loading"
        ? "cargando piano…"
        : status === "error"
          ? "sin conexión: usando sinte"
          : status === "idle"
            ? "se carga al primer sonido"
            : null;

  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      Instrumento
      <select
        value={kind}
        onChange={(e) => change(e.target.value as InstrumentKind)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:border-accent"
      >
        <option value="piano">Piano</option>
        <option value="synth">Sinte</option>
      </select>
      {note && <span className="text-[11px] text-muted/80">{note}</span>}
    </label>
  );
}
