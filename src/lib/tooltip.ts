// Tooltips contextuales nativos. Cualquier elemento con [data-tip] los activa:
// hover en escritorio, tap en móvil. Sin librerías externas.

let el: HTMLDivElement | null = null;
let current: HTMLElement | null = null;

function ensureEl(): HTMLDivElement {
  if (!el) {
    el = document.createElement("div");
    el.className =
      "pointer-events-none fixed z-50 hidden max-w-56 rounded-lg border border-slate-600 " +
      "bg-slate-900/95 px-3 py-2 text-xs leading-snug text-slate-100 shadow-xl backdrop-blur";
    el.setAttribute("role", "tooltip");
    document.body.appendChild(el);
  }
  return el;
}

function show(target: HTMLElement): void {
  const tip = target.getAttribute("data-tip");
  if (!tip) return;
  const box = ensureEl();
  box.textContent = tip;
  box.classList.remove("hidden");
  current = target;

  // Posiciona encima del elemento, centrado y dentro del viewport.
  const r = target.getBoundingClientRect();
  const bw = box.offsetWidth;
  const bh = box.offsetHeight;
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  let top = r.top - bh - 8;
  if (top < 8) top = r.bottom + 8; // si no cabe arriba, va abajo
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
}

function hide(): void {
  if (el) el.classList.add("hidden");
  current = null;
}

/** Activa la delegación global de tooltips (llamar una vez). */
export function initTooltips(): void {
  document.addEventListener("mouseover", (e) => {
    const t = (e.target as HTMLElement)?.closest<HTMLElement>("[data-tip]");
    if (t) show(t);
  });
  document.addEventListener("mouseout", (e) => {
    const t = (e.target as HTMLElement)?.closest<HTMLElement>("[data-tip]");
    if (t && t === current) hide();
  });

  // Móvil / táctil: toca para alternar; toca fuera para cerrar.
  document.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement)?.closest<HTMLElement>("[data-tip]");
    if (t) {
      e.stopPropagation();
      if (current === t) hide();
      else show(t);
    } else {
      hide();
    }
  });

  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);
}
