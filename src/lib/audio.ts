// Motor de audio con Web Audio API nativa: acordes, secuencias y backing track.

// Se crea perezosamente en el primer gesto del usuario (política de autoplay).
let ctx: AudioContext | null = null;
let masterChain: AudioNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** Devuelve (y reanuda) el AudioContext, creándolo la primera vez. */
function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    // Cadena maestra: compresor suave para evitar saturación al apilar voces.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    comp.connect(out);
    out.connect(ctx.destination);
    masterChain = comp;
    if (instrument === "piano") queueMicrotask(() => void loadPiano());
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function master(): AudioNode {
  getCtx();
  return masterChain!;
}

// --- Eventos de reproducción (para sincronizar la UI con el audio) ---

/** Una nota programada: cuándo empieza y cuánto dura, en tiempo del AudioContext. */
export interface NoteEvent {
  type: "note";
  midi: number;
  start: number;
  duration: number;
  /** Etiqueta de la secuencia que la originó (ej. "progression"). */
  tag?: string;
  /** Índice del paso dentro de la secuencia. */
  step?: number;
}

/** Señal de corte: la UI debe apagar todo lo que esté sonando. */
export interface StopEvent {
  type: "stop";
}

/** Un pulso (negra) del backing track, para el indicador de compás. */
export interface BeatEvent {
  type: "beat";
  /** Pulso dentro del compás (0–3). */
  beat: number;
  start: number;
  duration: number;
}

export type PlaybackEvent = NoteEvent | StopEvent | BeatEvent;
type Listener = (e: PlaybackEvent) => void;

const listeners = new Set<Listener>();

/** Suscribe a los eventos de reproducción. Devuelve la función para desuscribir. */
export function onPlayback(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit(e: PlaybackEvent): void {
  for (const fn of listeners) fn(e);
}

/** Tiempo actual del reloj de audio (0 si aún no existe el contexto). */
export function audioNow(): number {
  return ctx ? ctx.currentTime : 0;
}

/** Convierte una frecuencia a número MIDI (redondeado). */
export function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

// Voces vivas (melódicas) para poder cortarlas con stopAll().
interface LiveVoice {
  gain: GainNode;
  oscs: OscillatorNode[];
}
const live = new Set<LiveVoice>();

/** Corta en seco (con un fade corto) todas las notas programadas o sonando. */
export function stopAll(): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const v of live) {
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0001), t);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    for (const o of v.oscs) {
      try {
        o.stop(t + 0.05);
      } catch {
        /* ya detenido */
      }
    }
  }
  live.clear();
  // Cancela también las notas del piano ya programadas a futuro.
  for (const stop of pianoStops) stop(t);
  pianoStops.clear();
  piano?.stop();
  emit({ type: "stop" });
}

// --- Instrumento: piano con samples (smplr) o sinte de osciladores ---

export type InstrumentKind = "piano" | "synth";
export type PianoStatus = "idle" | "loading" | "ready" | "error";

type Piano = {
  start: (e: { note: number; time: number; duration: number; velocity: number }) => (time?: number) => void;
  stop: () => void;
};
// Canceladores de las notas del piano programadas (se limpian al terminar).
const pianoStops = new Set<(time?: number) => void>();

let instrument: InstrumentKind = "piano";
let piano: Piano | null = null;
let pianoStatus: PianoStatus = "idle";
const statusListeners = new Set<(s: PianoStatus) => void>();

function setPianoStatus(s: PianoStatus): void {
  pianoStatus = s;
  for (const fn of statusListeners) fn(s);
}

/** Suscribe al estado de carga del piano. */
export function onPianoStatus(fn: (s: PianoStatus) => void): () => void {
  statusListeners.add(fn);
  fn(pianoStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function getInstrument(): InstrumentKind {
  return instrument;
}

/** Cambia el instrumento; si es piano y no está cargado, empieza a cargarlo. */
export function setInstrument(kind: InstrumentKind): void {
  instrument = kind;
  if (kind === "piano" && ctx) void loadPiano();
}

/**
 * Carga perezosa del piano muestreado. Mientras carga (o si falla, p.ej. sin
 * red) se usa el sinte de osciladores como respaldo.
 */
function loadPiano(): Promise<void> {
  if (pianoStatus === "loading" || pianoStatus === "ready" || !ctx) return Promise.resolve();
  setPianoStatus("loading");
  const c = ctx;
  return import("smplr")
    .then(({ SplendidGrandPiano }) => SplendidGrandPiano(c, { destination: master(), volume: 110 }).load)
    .then((p) => {
      piano = p as unknown as Piano;
      setPianoStatus("ready");
    })
    .catch(() => setPianoStatus("error"));
}

/** Buffer de ruido blanco reutilizable (para caja y hi-hat). */
function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
  }
  return noiseBuffer;
}

/** Una voz tipo "piano/sinte suave": dos osciladores con envolvente ADSR. */
function voice(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  destination: AudioNode,
  peak: number,
  meta: { tag?: string; step?: number } = {},
): void {
  const midi = freqToMidi(freq);
  emit({ type: "note", midi, start, duration, ...meta });

  if (instrument === "piano" && piano) {
    // peak va de ~0.03 (acordes grandes) a 0.22 (nota sola).
    const velocity = Math.round(70 + Math.min(1, peak / 0.22) * 30);
    const stop = piano.start({ note: midi, time: start, duration, velocity });
    pianoStops.add(stop);
    window.setTimeout(() => pianoStops.delete(stop), (start - c.currentTime + duration + 1) * 1000);
    return;
  }

  const g = c.createGain();
  g.connect(destination);

  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;

  const osc2 = c.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = freq;
  osc2.detune.value = 6; // leve desafinación para dar cuerpo

  osc.connect(g);
  osc2.connect(g);

  const end = start + duration;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012); // ataque rápido
  g.gain.exponentialRampToValueAtTime(peak * 0.5, start + 0.18); // decay
  g.gain.exponentialRampToValueAtTime(0.0001, end); // release

  osc.start(start);
  osc2.start(start);
  osc.stop(end + 0.05);
  osc2.stop(end + 0.05);

  const v: LiveVoice = { gain: g, oscs: [osc, osc2] };
  live.add(v);
  osc.onended = () => live.delete(v);
}

/** Reproduce un acorde (varias frecuencias) ya mismo. */
export function playChord(
  freqs: number[],
  duration = 1.3,
  meta: { tag?: string; step?: number } = {},
): void {
  const c = getCtx();
  const t = c.currentTime + 0.02;
  const peak = 0.22 / Math.max(1, freqs.length); // normaliza por nº de notas
  for (const f of freqs) voice(c, f, t, duration, master(), peak, meta);
}

/**
 * Programa una secuencia de acordes desde el instante `at` (reloj de audio),
 * sin cortar lo que ya suena. `stepOffset` numera los pasos (útil en loops).
 * Devuelve el instante en que termina la secuencia.
 */
export function scheduleSequence(
  chords: number[][],
  gap: number,
  duration: number,
  opts: { tag?: string; at?: number; stepOffset?: number } = {},
): number {
  const c = getCtx();
  let t = opts.at ?? c.currentTime + 0.05;
  chords.forEach((freqs, i) => {
    const peak = 0.22 / Math.max(1, freqs.length);
    const meta = { tag: opts.tag, step: (opts.stepOffset ?? 0) + i };
    for (const f of freqs) voice(c, f, t, duration, master(), peak, meta);
    t += gap;
  });
  return t;
}

/**
 * Reproduce una secuencia de acordes con `gap` segundos entre cada ataque.
 * Corta lo que estuviera sonando antes. `tag` identifica la secuencia en los
 * eventos (para que la UI sepa qué paso está sonando).
 * Devuelve la duración total programada (segundos).
 */
export function playSequence(
  chords: number[][],
  gap = 0.8,
  duration = 0.7,
  tag?: string,
): number {
  stopAll();
  scheduleSequence(chords, gap, duration, { tag });
  return chords.length * gap;
}

// --- Percusión sintetizada para el backing track ---

function kick(c: AudioContext, t: number, dest: AudioNode, gain = 1): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(dest);
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9 * gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.start(t);
  osc.stop(t + 0.25);
}

function snare(c: AudioContext, t: number, dest: AudioNode, gain = 1): void {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1500;
  const g = c.createGain();
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 * gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.start(t);
  src.stop(t + 0.2);
}

function hat(c: AudioContext, t: number, dest: AudioNode, gain = 1): void {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = c.createGain();
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25 * gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.start(t);
  src.stop(t + 0.07);
}

function bass(c: AudioContext, freq: number, t: number, dur: number, dest: AudioNode, gain = 1): void {
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;
  const g = c.createGain();
  osc.frequency.value = freq;
  osc.connect(lp);
  lp.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4 * gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export type Genre = "pop" | "jazz" | "funk";

/** Evento de un paso del compás (corchea): qué suena y con qué intensidad. */
interface StepEvent {
  kick?: number;
  snare?: number;
  hat?: number;
  /** Multiplicador de octava del bajo (1 = tónica grave, 2 = octava). */
  bass?: number;
}

// Patrones por estilo, a resolución de corchea (8 pasos por compás 4/4).
// step: 0=1 1=&1 2=2 3=&2 4=3 5=&3 6=4 7=&4
const PATTERNS: Record<Genre, StepEvent[]> = {
  pop: [
    { kick: 1, hat: 0.8, bass: 1 },
    { hat: 0.6 },
    { snare: 1, hat: 0.8, bass: 1 },
    { hat: 0.6 },
    { kick: 1, hat: 0.8, bass: 1 },
    { hat: 0.6 },
    { snare: 1, hat: 0.8, bass: 1 },
    { hat: 0.6 },
  ],
  jazz: [
    { kick: 0.4, hat: 0.7, bass: 1 },
    { hat: 0.4 },
    { snare: 0.4, hat: 0.7 },
    { hat: 0.5, bass: 1 },
    { kick: 0.3, hat: 0.7, bass: 2 },
    { hat: 0.4 },
    { snare: 0.4, hat: 0.7 },
    { hat: 0.5, bass: 1 },
  ],
  funk: [
    { kick: 1, hat: 0.7, bass: 1 },
    { hat: 0.5 },
    { snare: 1, hat: 0.7 },
    { kick: 0.9, hat: 0.6, bass: 1 }, // énfasis en el "and" del 2
    { hat: 0.7, bass: 2 },
    { kick: 0.7, hat: 0.5 },
    { snare: 1, hat: 0.7, bass: 1 },
    { hat: 0.6, bass: 2 },
  ],
};

/** Backing track en loop con bombo, caja, hi-hat y bajo sobre la tónica. */
export class BackingTrack {
  private c: AudioContext;
  private out: GainNode;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;

  bpm = 90;
  genre: Genre = "pop";
  /** Frecuencia del bajo (tónica grave de la tonalidad activa). */
  bassFreq = noteFreqFallback();

  isPlaying = false;

  constructor() {
    this.c = getCtx();
    this.out = this.c.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(master());
  }

  /** Duración de una corchea en segundos. */
  private get stepDur(): number {
    return 60 / this.bpm / 2;
  }

  start(): void {
    if (this.isPlaying) return;
    getCtx();
    this.isPlaying = true;
    this.step = 0;
    this.nextTime = this.c.currentTime + 0.1;
    this.scheduler();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduler = (): void => {
    // Programa con antelación (lookahead) para un timing estable.
    while (this.nextTime < this.c.currentTime + 0.12) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += this.advance(this.step);
      this.step = (this.step + 1) % 8;
    }
    if (this.isPlaying) this.timer = window.setTimeout(this.scheduler, 25);
  };

  /**
   * Cuánto avanzar tras un paso. En jazz aplica swing de tresillo: la corchea
   * a tiempo (par) ocupa 2/3 del pulso y la "&" (impar) el 1/3 restante.
   */
  private advance(step: number): number {
    if (this.genre !== "jazz") return this.stepDur;
    return step % 2 === 0 ? this.stepDur * (4 / 3) : this.stepDur * (2 / 3);
  }

  private scheduleStep(step: number, time: number): void {
    if (step % 2 === 0) {
      emit({ type: "beat", beat: step / 2, start: time, duration: 60 / this.bpm });
    }
    const ev = PATTERNS[this.genre][step];
    if (ev.kick) kick(this.c, time, this.out, ev.kick);
    if (ev.snare) snare(this.c, time, this.out, ev.snare);
    if (ev.hat) hat(this.c, time, this.out, ev.hat);
    if (ev.bass) bass(this.c, this.bassFreq * ev.bass, time, this.stepDur * 1.6, this.out, 1);
  }
}

function noteFreqFallback(): number {
  // C2 por defecto; se reasigna al cambiar de tonalidad.
  return 65.41;
}
