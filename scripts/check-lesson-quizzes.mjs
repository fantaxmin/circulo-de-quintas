// node scripts/check-lesson-quizzes.mjs — sin navegador ni servidor.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// Vite pertenece a Astro; no añadimos una dependencia de pruebas al proyecto.
const requireFromAstro = createRequire(import.meta.resolve("astro"));
const { build } = await import(pathToFileURL(requireFromAstro.resolve("vite")).href);

// Empaqueta el modelo TypeScript con los mismos módulos musicales que usa la app.
const bundle = await build({
  configFile: false,
  logLevel: "error",
  build: {
    lib: { entry: "src/components/lessons/quiz-model.ts", formats: ["es"] },
    write: false,
    minify: false,
  },
});
const outputs = Array.isArray(bundle) ? bundle : [bundle];
const code = outputs.flatMap((output) => output.output).find((item) => item.type === "chunk").code;
const model = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const { readingPool, fretPool, pickNote, staffLocation, readingReducer, INITIAL_READING, ROUND_LENGTH } = model;

const naturalPcs = new Set([0, 2, 4, 5, 7, 9, 11]);
for (const [clef, low, high] of [["treble", 60, 81], ["bass", 40, 60]]) {
  const naturals = readingPool(clef, false);
  assert.equal(naturals.length, 13);
  assert(naturals.every((note) => naturalPcs.has(note.midi % 12) && note.spelling.length === 1));
  for (const accidentals of [false, true]) {
    const pool = readingPool(clef, accidentals);
    assert.equal(Math.min(...pool.map((note) => note.midi)), low);
    assert.equal(Math.max(...pool.map((note) => note.midi)), high);
    assert(pool.every((note) => note.midi >= low && note.midi <= high));
    if (accidentals) {
      assert(pool.some((note) => note.spelling.endsWith("#")));
      assert(pool.some((note) => note.spelling.endsWith("b")));
    }
    for (const previous of pool) assert.notEqual(pickNote(pool, previous).midi, previous.midi);
  }
}
assert.match(staffLocation({ spelling: "C", midi: 60 }, "treble"), /línea adicional 1 por debajo/);
assert.match(staffLocation({ spelling: "A", midi: 81 }, "treble"), /línea adicional 1 por encima/);
assert.match(staffLocation({ spelling: "E", midi: 40 }, "bass"), /línea adicional 1 por debajo/);
assert.match(staffLocation({ spelling: "C", midi: 60 }, "bass"), /línea adicional 1 por encima/);
assert.match(staffLocation({ spelling: "F#", midi: 66 }, "treble"), /espacio 1 contando desde abajo, sostenido/);

// Todas las preguntas del diapasón tienen solución dentro del rango activo.
for (const [instrument, tuning] of [["guitar", [40, 45, 50, 55, 59, 64]], ["bass", [28, 33, 38, 43]]]) {
  const expected = (maxFret) => [...new Set(tuning.flatMap((open) =>
    Array.from({ length: maxFret + 1 }, (_, fret) => open + fret),
  ))].filter((midi) => naturalPcs.has(midi % 12)).sort((a, b) => a - b);
  for (const maxFret of [5, 12]) {
    const pool = fretPool(instrument, maxFret);
    assert.deepEqual(pool.map((note) => note.midi), expected(maxFret));
    assert.equal(pool.length, new Set(pool.map((note) => note.midi)).size);
  }
}
const question = { spelling: "F#", midi: 66 };
assert.equal(readingReducer(INITIAL_READING, { type: "answer", spelling: "F#" }), INITIAL_READING);
let state = readingReducer(INITIAL_READING, { type: "start", question });
assert.equal(readingReducer(state, { type: "next", question }), state);
for (let round = 1; round <= ROUND_LENGTH; round++) {
  assert.equal(state.round, round);
  // Fa♯ y Sol♭ suenan igual, pero solo Fa♯ nombra la nota escrita.
  state = readingReducer(state, { type: "answer", spelling: round % 2 ? "F#" : "Gb" });
  assert.equal(state.score, Math.ceil(round / 2));
  const answered = state;
  assert.equal(readingReducer(state, { type: "answer", spelling: "F#" }), answered);
  state = readingReducer(state, { type: "next", question });
  if (round === ROUND_LENGTH) assert.equal(state, answered);
  else assert.equal(state.answer, null);
}
state = readingReducer(state, { type: "start", question });
assert.equal(state.round, 1);
assert.equal(state.score, 0);
assert.equal(state.answer, null);
console.log("OK: rangos, alteraciones, posiciones tocables, octavas y serie de 10 preguntas sin doble puntuación.");
