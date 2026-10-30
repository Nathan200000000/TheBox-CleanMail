import type { ReactNode } from "react";

// Shared screen layout: a large title with an intro, optional actions on the
// right, then the screen's content.
export default function PageShell({
  eyebrow,
  title,
  intro,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-full w-full bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-14">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">{eyebrow}</p>
            )}
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <div className="mt-4 text-lg leading-8 text-slate-600">{intro}</div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </header>
        <div className="grid gap-6">{children}</div>
      </div>
    </main>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}
