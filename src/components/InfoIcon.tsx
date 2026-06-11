// Ícono ⓘ con tooltip contextual (lo gestiona lib/tooltip.ts vía [data-tip]).

export function InfoIcon({ tip }: { tip: string }) {
  return (
    <span
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-600/60 text-[10px] font-bold text-slate-200"
      data-tip={tip}
      tabIndex={0}
    >
      i
    </span>
  );
}
