import Link from "next/link";
import AccountPanel from "@/components/AccountPanel";
import PageShell, { Panel } from "@/components/PageShell";
import { CATEGORIES } from "@/lib/categories";

const STEPS = [
  { title: "Choose a category", body: "Promotions, social, updates, forums or newsletters — the groups that pile up fastest." },
  { title: "Review the matches", body: "See the sender, subject and date of each message. Check only the ones you no longer need." },
  { title: "Move to Trash", body: "Confirm once. Messages go to Gmail Trash, where they stay recoverable for 30 days." },
];

const SAFETY = [
  "Nothing is deleted automatically — every move needs your confirmation.",
  "Messages go to Gmail Trash, never permanent deletion.",
  "CleanMail reads only sender, subject and date — never message bodies or attachments.",
  "No database: your Gmail data is not stored, sold, or used for ads or AI training.",
];

export default function DashboardPage() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="Take back control of your Gmail."
      intro={
        <>
          CleanMail finds promotional, social and automated email worth reviewing, shows you exactly what it found,
          and moves only the messages you pick to Trash.
        </>
      }
    >
      <AccountPanel />

      <Panel>
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
              {index < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl text-slate-300 md:block">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h2 className="text-2xl font-bold">What CleanMail looks for</h2>
          <ul className="mt-5 grid gap-3">
            {CATEGORIES.map((category) => (
              <li key={category.key}>
                <Link
                  href={`/clean?category=${category.key}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-slate-950"
                >
                  <span>
                    <span className="block font-semibold">{category.name}</span>
                    <span className="block text-sm text-slate-500">{category.description}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="border-emerald-200 bg-emerald-50">
          <h2 className="text-2xl font-bold text-emerald-950">Built around your control</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-emerald-900">
            {SAFETY.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-0.5 font-bold text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link href="/privacy" className="mt-6 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">
            Read the Privacy Policy
          </Link>
        </Panel>
      </div>
    </PageShell>
  );
}
