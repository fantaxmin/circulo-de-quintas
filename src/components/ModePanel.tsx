// Panel ancho con el detalle del modo del grado seleccionado.

import type { DegreeView } from "../lib/types";
import { prettyEnglish } from "../lib/music";
import { MODE_TIP } from "../lib/labels";
import { InfoIcon } from "./InfoIcon";

interface Props {
  degree: DegreeView;
  onClose: () => void;
}

export function ModePanel({ degree: d, onClose }: Props) {
  const intervals = d.mode.formula.split(" ");
  const notes = d.modeNotes.map(prettyEnglish);

  return (
    <div className="mt-4 w-full rounded-xl border border-amber-500/40 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-sm font-bold text-amber-300">
            {d.roman}
          </span>
          <h4 className="flex items-center text-xl font-bold text-amber-300">
            {d.mode.name}
            <span className="ml-1.5 text-sm font-normal text-slate-400">({d.mode.english})</span>
            <InfoIcon tip={MODE_TIP} />
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
          aria-label="Cerrar modo"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Fórmula
          </div>
          <div className="flex flex-wrap gap-1.5">
            {intervals.map((iv, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-800 px-2 py-1 font-mono text-sm text-amber-200 ring-1 ring-inset ring-slate-700"
              >
                {iv}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notas del modo
          </div>
          <div className="flex flex-wrap gap-1.5">
            {notes.map((n, i) => (
              <span
                key={i}
                className="rounded-md bg-slate-800 px-2 py-1 text-sm font-semibold text-slate-100 ring-1 ring-inset ring-slate-700"
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Carácter
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{d.mode.description}</p>
        </div>
      </div>
    </div>
  );
}
