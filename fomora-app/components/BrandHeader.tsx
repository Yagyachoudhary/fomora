import { FomoraMascot } from "./FomoraMascot";

export function BrandHeader({ streak = 0, hearts = 5, xp = 0 }: { streak?: number; hearts?: number; xp?: number }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <>
      <div className="bg-navy h-3 w-full" />
      <header className="flex items-center justify-between px-8 py-4 border-b border-rule bg-cream">
        <div className="flex items-center gap-3">
          <FomoraMascot size={38} />
          <div>
            <div className="serif text-brand text-xl font-extrabold leading-tight">Fomora</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">Your AI Radar · {today}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          <div className="flex items-center gap-1 font-semibold">🔥 <span className="text-ink">{streak}</span></div>
          <div className="flex items-center gap-1 font-semibold">❤️ <span className="text-ink">{hearts}</span></div>
          <div className="flex items-center gap-1 font-semibold">⚡ <span className="text-ink">{xp.toLocaleString()}</span></div>
        </div>
      </header>
    </>
  );
}
