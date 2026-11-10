// Pentagrama (+ TAB opcional) dibujado con VexFlow en SVG. API: StaffProps (lib/notation.ts).
// VexFlow se importa dinámicamente en el cliente (nada en SSR). Las notas son accesibles:
// foco itinerante con flechas, activación con clic, Enter o Espacio.

import { useEffect, useRef, useState } from "react";
import type { NoteMark, StaffEvent, StaffProps } from "../lib/notation";
import { INSTRUMENTS, accidentalOffset, letterOctave, prettySpelling, vexKey } from "../lib/fretboard";
import { toLatin } from "../lib/music";

const MARK_COLORS: Record<NoteMark, string> = {
  playing: "--color-playing",
  correct: "#34d399",
  wrong: "#f87171",
  target: "--color-accent",
};

const BEATS: Record<StaffEvent["duration"], number> = { w: 4, h: 2, q: 1, "8": 0.5 };
const NOTE_W = 46; // ancho mínimo por nota (px)

function cssColor(token: string): string {
  if (!token.startsWith("--")) return token;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return v || "#f1f5f9";
}

/** Color de fondo efectivo (primer ancestro con fondo opaco). */
function backgroundOf(el: HTMLElement | null): string {
  for (let n = el; n; n = n.parentElement) {
    const bg = getComputedStyle(n).backgroundColor;
    if (bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) return bg;
  }
  return cssColor("--color-surface");
}

/** Pinta un grupo SVG de VexFlow (cabeza, plica, alteración, etiqueta, número de TAB). */
function paint(root: Element, color: string): void {
  for (const el of [root, ...root.querySelectorAll("*")]) {
    const f = el.getAttribute("fill");
    if (f && f !== "none" && el.tagName !== "rect") el.setAttribute("fill", color);
    const st = el.getAttribute("stroke");
    if (st && st !== "none") el.setAttribute("stroke", color);
  }
}

/** Nombre accesible de un evento: "Fa sostenido 4, negra". */
function spokenName(e: StaffEvent): string {
  const dur = { w: "redonda", h: "blanca", q: "negra", "8": "corchea" }[e.duration];
  if (e.kind === "rest") return `Silencio de ${dur}`;
  const s = e.spelling!;
  const acc = accidentalOffset(s);
  const accName = acc === 1 ? " sostenido" : acc === 2 ? " doble sostenido" : acc === -1 ? " bemol" : acc === -2 ? " doble bemol" : "";
  return `${toLatin(s[0])}${accName} ${letterOctave(s, e.writtenMidi!)}, ${dur}`;
}

type VF = typeof import("vexflow");
let vfPromise: Promise<VF> | null = null;
function loadVexFlow(): Promise<VF> {
  vfPromise ??= import("vexflow/bravura").then(async (m) => {
    // Espera a la fuente de música para no dibujar glifos vacíos.
    try {
      await document.fonts.load("30px Bravura");
    } catch {
      /* sin Font Loading API */
    }
    return m as unknown as VF;
  });
  return vfPromise;
}

export function Staff({
  events,
  clef = "treble",
  instrument,
  showTab = true,
  timeSignature,
  marks = {},
  onNoteClick,
  ariaLabel,
}: StaffProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const focusIdx = useRef(0);
  const elsRef = useRef<{ map: Map<string, Element[]>; fg: string }>({ map: new Map(), fg: "" });
  const [drawn, setDrawn] = useState(0);
  const clickRef = useRef(onNoteClick);
  clickRef.current = onNoteClick;

  // Re-dibuja al cambiar el ancho disponible.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const inst = instrument ? INSTRUMENTS[instrument] : null;
  const drawClef = inst ? inst.clef : clef;
  const withTab = !!inst && showTab;
  const marksKey = JSON.stringify(marks);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || width === 0) return;
    let cancelled = false;

    loadVexFlow().then((VF) => {
      if (cancelled) return;
      const {
        Renderer, Stave, TabStave, StaveNote, TabNote, GhostNote, Voice, Formatter,
        Accidental, Annotation, BarNote, StaveConnector,
      } = VF;
      host.innerHTML = "";

      const fg = cssColor("--color-text");
      // Pocas notas (ejercicios): pentagrama corto en vez de estirarlo a todo el ancho.
      const totalW =
        events.length <= 2 ? Math.min(width, 120 + events.length * 70) : Math.max(width, 90 + events.length * NOTE_W);

      // Primero se crean los pentagramas para saber la altura total; luego se dibuja.
      const stave = new Stave(0, 10, totalW - 1);
      stave.addClef(drawClef, "default", inst ? "8vb" : undefined);
      if (timeSignature) stave.addTimeSignature(timeSignature);

      let tabStave: InstanceType<typeof TabStave> | null = null;
      if (withTab) {
        tabStave = new TabStave(0, stave.getYForLine(4) + 46, totalW - 1, {
          numLines: inst!.tuning.length,
          spaceAboveStaffLn: 2,
        });
        tabStave.addClef("tab");
      }
      // Alto: última línea + margen (ledger lines y etiquetas bajo el pentagrama).
      const height = Math.ceil(
        tabStave ? tabStave.getYForLine(inst!.tuning.length - 1) + 14 : stave.getYForLine(4) + 56,
      );

      const renderer = new Renderer(host, Renderer.Backends.SVG);
      renderer.resize(totalW, height);
      const ctx = renderer.getContext();
      ctx.setFillStyle(fg);
      ctx.setStrokeStyle(fg);
      // Fondo de los números de la TAB (clearRect) = fondo del recuadro, no blanco.
      (ctx as unknown as { setBackgroundFillStyle(c: string): void }).setBackgroundFillStyle(
        backgroundOf(host),
      );

      // Mismo origen horizontal para notas del pentagrama y de la TAB (claves de distinto ancho).
      if (tabStave) {
        const x = Math.max(stave.getNoteStartX(), tabStave.getNoteStartX());
        stave.setNoteStartX(x);
        tabStave.setNoteStartX(x);
      }
      stave.setContext(ctx).draw();
      if (tabStave) {
        tabStave.setContext(ctx).draw();
        new StaveConnector(stave, tabStave).setType("singleLeft").setContext(ctx).draw();
      }

      // Notas + barras de compás (si hay compás). Las alteraciones se escriben siempre;
      // se añade ♮ cuando una nota natural cancela una alteración previa en el compás.
      const [num, den] = (timeSignature ?? "").split("/").map(Number);
      const measureBeats = num && den ? num * (4 / den) : 0;
      const restKey = drawClef === "bass" ? "d/3" : "b/4";

      const tickables: InstanceType<typeof StaveNote | typeof BarNote>[] = [];
      const tabTickables: InstanceType<typeof TabNote | typeof GhostNote | typeof BarNote>[] = [];
      const noteByIdx: { note: InstanceType<typeof StaveNote>; ev: StaffEvent }[] = [];
      const tabByIdx: { note: InstanceType<typeof TabNote>; id: string }[] = [];
      let altered = new Map<string, number>();
      let beat = 0;

      events.forEach((ev) => {
        let note: InstanceType<typeof StaveNote>;
        if (ev.kind === "rest") {
          note = new StaveNote({ keys: [restKey], duration: `${ev.duration}r`, clef: drawClef });
        } else {
          const s = ev.spelling!;
          const key = vexKey(s, ev.writtenMidi!);
          note = new StaveNote({ keys: [key], duration: ev.duration, clef: drawClef, autoStem: true });
          const slot = key.replace(/[#b]/g, "");
          const acc = accidentalOffset(s);
          const sym = acc === 2 ? "##" : acc === 1 ? "#" : acc === -1 ? "b" : acc === -2 ? "bb" : "";
          if (sym) note.addModifier(new Accidental(sym), 0);
          else if (altered.get(slot)) note.addModifier(new Accidental("n"), 0);
          altered.set(slot, acc);
        }
        if (ev.label) {
          note.addModifier(
            new Annotation(ev.label)
              .setFont("system-ui, sans-serif", 11)
              .setVerticalJustification(Annotation.VerticalJustify.BOTTOM),
            0,
          );
        }
        note.setLedgerLineStyle({ strokeStyle: fg, lineWidth: 1.4 });
        tickables.push(note);
        noteByIdx.push({ note, ev });

        if (tabStave) {
          const tn =
            ev.kind === "note" && ev.tab
              ? new TabNote({ positions: [{ str: ev.tab.string, fret: ev.tab.fret }], duration: ev.duration })
              : new GhostNote(ev.duration);
          tabTickables.push(tn);
          if (tn instanceof TabNote) tabByIdx.push({ note: tn, id: ev.id });
        }

        beat += BEATS[ev.duration];
        if (measureBeats && beat >= measureBeats - 1e-6) {
          beat = 0;
          altered = new Map();
          tickables.push(new BarNote());
          if (tabStave) tabTickables.push(new BarNote());
        }
      });
      // No dibujar una barra final duplicada (el pentagrama ya cierra).
      if (tickables[tickables.length - 1] instanceof BarNote) {
        tickables.pop();
        tabTickables.pop();
      }

      const voice = new Voice().setMode(Voice.Mode.SOFT).addTickables(tickables);
      const voices = [voice];
      let tabVoice: InstanceType<typeof Voice> | null = null;
      if (tabStave) {
        tabVoice = new Voice().setMode(Voice.Mode.SOFT).addTickables(tabTickables);
        voices.push(tabVoice);
      }
      const fmt = new Formatter();
      fmt.joinVoices([voice]);
      if (tabVoice) fmt.joinVoices([tabVoice]);
      fmt.format(voices, totalW - stave.getNoteStartX() - 24);
      voice.draw(ctx, stave);
      if (tabVoice && tabStave) tabVoice.draw(ctx, tabStave);

      // Elementos por id para colorear marcas sin redibujar (conserva nodos y foco).
      const map = new Map<string, Element[]>();
      noteByIdx.forEach(({ note, ev }) => {
        const el = note.getSVGElement();
        if (el) map.set(ev.id, [el]);
      });
      tabByIdx.forEach(({ note, id }) => {
        const el = note.getSVGElement();
        if (el) map.set(id, [...(map.get(id) ?? []), el]);
      });
      elsRef.current = { map, fg };
      setDrawn((d) => d + 1);

      // Accesibilidad e interacción por nota.
      const svg = host.querySelector("svg");
      svg?.setAttribute("aria-hidden", onNoteClick ? "false" : "true");
      noteByIdx.forEach(({ note, ev }, i) => {
        const el = note.getSVGElement();
        if (!el) return;
        el.setAttribute("data-id", ev.id);
        if (!clickRef.current) return;
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", spokenName(ev));
        el.setAttribute("tabindex", i === Math.min(focusIdx.current, noteByIdx.length - 1) ? "0" : "-1");
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          focusIdx.current = i;
          clickRef.current?.(ev.id);
        });
        el.addEventListener("keydown", (k: Event) => {
          const key = (k as KeyboardEvent).key;
          if (key === "Enter" || key === " ") {
            k.preventDefault();
            clickRef.current?.(ev.id);
          } else if (key === "ArrowRight" || key === "ArrowLeft") {
            k.preventDefault();
            const next = Math.min(noteByIdx.length - 1, Math.max(0, i + (key === "ArrowRight" ? 1 : -1)));
            focusIdx.current = next;
            noteByIdx.forEach(({ note: n }, j) => n.getSVGElement()?.setAttribute("tabindex", j === next ? "0" : "-1"));
            (noteByIdx[next].note.getSVGElement() as SVGElement | undefined)?.focus();
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, drawClef, withTab, timeSignature, width, !!onNoteClick]);

  // Marcas (sonando, aciertos...): sólo cambian colores de los nodos ya dibujados.
  useEffect(() => {
    const { map, fg } = elsRef.current;
    for (const [id, els] of map) {
      const mark = marks[id];
      const c = mark ? cssColor(MARK_COLORS[mark]) : fg;
      for (const root of els) paint(root, c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksKey, drawn]);

  const summary =
    ariaLabel ??
    `Pentagrama en clave de ${drawClef === "bass" ? "fa" : "sol"}${inst ? " (suena una octava más grave)" : ""}: ` +
      events.map((e) => (e.kind === "rest" ? "silencio" : prettySpelling(e.spelling!))).join(", ");

  return (
    <figure className="w-full">
      <div
        ref={hostRef}
        role={onNoteClick ? "group" : "img"}
        aria-label={summary}
        className="w-full overflow-x-auto rounded-lg [&_svg]:max-w-none"
        style={{ minHeight: withTab ? 200 : 120 }}
      />
    </figure>
  );
}
