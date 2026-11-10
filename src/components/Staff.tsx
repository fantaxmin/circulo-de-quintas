// Pentagrama (+ TAB opcional) dibujado con VexFlow. API estable: ver StaffProps en lib/notation.ts.
// PROVISIONAL: placeholder textual mientras se implementa el render real.

import type { StaffProps } from "../lib/notation";

export function Staff({ events, ariaLabel }: StaffProps) {
  return (
    <div role="img" aria-label={ariaLabel} className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
      [pentagrama] {events.map((e) => (e.kind === "rest" ? "𝄽" : e.spelling)).join(" ")}
    </div>
  );
}
