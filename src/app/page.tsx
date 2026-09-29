"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

type Category =
  | "Newsletters"
  | "Promotions"
  | "Notifications"
  | "Shopping"
  | "Other";

type AnalyzedMessage = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  category: Category;
};

type AnalysisResult = {
  analyzed: number;
  counts: Record<string, number>;
  messages: AnalyzedMessage[];
};

const categories: {
  name: Category;
  description: string;
}[] = [
  {
    name: "Newsletters",
    description: "Newsletters and mailing lists you may no longer want.",
  },
  {
    name: "Promotions",
    description: "Sales, deals, and promotional messages.",
  },
  {
    name: "Notifications",
    description: "Automated alerts and account notifications.",
  },
  {
    name: "Shopping",
    description: "Receipts, shipping updates, and shopping emails.",
  },
  {
    name: "Other",
    description: "Messages that need a closer look.",
  },
];

export default function Home() {
  const { data: session, status } = useSession();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState<
    "idle" | "moving" | "success" | "error"
  >("idle");

  const signInWithGoogle = () => {
    signIn("google", undefined, {
      prompt: "select_account",
    });
  };

  const toggleMessage = (messageId: string) => {
    setSelectedMessages((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  };

  const moveSelectedToTrash = async () => {
    if (selectedMessages.length === 0) {
      return;
    }

    setCleanupStatus("moving");

    try {
      const response = await fetch("/api/gmail/trash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageIds: selectedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to move selected messages to Trash.");
      }

      setSelectedMessages([]);
      setShowReview(false);
      setCleanupStatus("success");

      await analyzeInbox();
    } catch {
      setCleanupStatus("error");
    }
  };

  const analyzeInbox = async () => {
    setAnalysisStatus("loading");

    try {
      const response = await fetch("/api/gmail/analyze");

      if (!response.ok) {
        throw new Error("Unable to analyze Gmail.");
      }

      const data = (await response.json()) as AnalysisResult;

      setAnalysis(data);
      setAnalysisStatus("idle");
    } catch {
      setAnalysisStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-slate-950">
        <p className="text-slate-500">Loading CleanMail...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white text-slate-950">
        <header className="border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight">
              CleanMail
            </Link>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-73px)] items-center">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                Clean your inbox
              </p>

              <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
                Take back control of your Gmail.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Sign in to CleanMail to review unwanted emails and cleanup
                opportunities.
              </p>

              <button
                type="button"
                onClick={signInWithGoogle}
                className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Sign in with Google
              </button>

              <p className="mt-4 text-sm text-slate-500">
                You will be able to choose your Google account.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            CleanMail
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">
              {session.user?.email}
            </span>

            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
              Gmail analysis
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              See what is filling your inbox.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              CleanMail analyzes a small batch of your inbox and groups
              messages into categories for you to review.
            </p>

            <button
              type="button"
              onClick={analyzeInbox}
              disabled={analysisStatus === "loading"}
              className="mt-7 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analysisStatus === "loading" ? "Analyzing..." : "Refresh analysis"}
            </button>

            {analysisStatus === "error" && (
              <p className="mt-4 text-sm text-red-600">
                CleanMail could not analyze your Gmail right now. Please try
                again.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Messages analyzed</p>
            <p className="mt-2 text-4xl font-bold">
              {analysis?.analyzed ?? "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Potential cleanup</p>
            <p className="mt-2 text-4xl font-bold">
              {analysis
                ? (analysis.counts.Promotions ?? 0) +
                  (analysis.counts.Newsletters ?? 0)
                : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Categories found</p>
            <p className="mt-2 text-4xl font-bold">
              {analysis
                ? categories.filter(
                    (category) => (analysis.counts[category.name] ?? 0) > 0
                  ).length
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Cleanup categories
          </h2>

          <p className="mt-2 text-slate-600">
            Review the messages CleanMail found before deciding what to do with
            them.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {category.name}
                    </h3>

                    <p className="mt-2 leading-6 text-slate-600">
                      {category.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {analysis?.counts[category.name] ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {analysis && (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Messages found
                </h2>
                <p className="mt-2 text-slate-600">
                  Nothing has been moved or deleted.
                </p>
              </div>

              <span className="hidden text-sm text-slate-500 sm:block">
                {analysis.messages.length} messages
              </span>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-200">
                {analysis.messages.map((message) => {
                  const selected = selectedMessages.includes(message.id);

                  return (
                    <label
                      key={message.id}
                      className={`block cursor-pointer p-5 transition ${
                        selected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex gap-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleMessage(message.id)}
                          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {message.from}
                              </p>

                              <p className="mt-1 font-medium text-slate-800">
                                {message.subject || "(No subject)"}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {message.date}
                              </p>
                            </div>

                            <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {message.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedMessages.length > 0 && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-950">
                  {selectedMessages.length} message
                  {selectedMessages.length === 1 ? "" : "s"} selected
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  These messages are only selected for review. Nothing has been
                  moved or deleted.
                </p>

                <button
                  type="button"
                  onClick={() => setShowReview(true)}
                  className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Review selected
                </button>
              </div>
            )}

            {showReview && selectedMessages.length > 0 && (
              <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Review selected messages
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      Confirm the messages you want to clean up. Nothing has
                      been moved yet.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {selectedMessages.length} selected
                  </span>
                </div>

                <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {analysis.messages
                    .filter((message) => selectedMessages.includes(message.id))
                    .map((message) => (
                      <div key={message.id} className="p-4">
                        <p className="font-semibold">{message.from}</p>

                        <p className="mt-1 text-sm text-slate-700">
                          {message.subject || "(No subject)"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{message.category}</span>
                          <span>•</span>
                          <span>{message.date}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReview(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Back to messages
                  </button>

                  <button
                    type="button"
                    onClick={moveSelectedToTrash}
                    disabled={cleanupStatus === "moving"}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cleanupStatus === "moving"
                      ? "Moving to Trash..."
                      : "Move selected to Trash"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Selected messages will be moved to Gmail&apos;s Trash. They
                  will not be permanently deleted by CleanMail.
                </p>
              </section>
            )}
          </section>
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold">Built around your control</h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Review first</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                CleanMail shows you what it finds before anything is moved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">No automatic deletion</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You decide which messages should be cleaned up.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Direct Gmail access</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your mailbox stays connected to Gmail rather than being copied
                into a separate email service.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          CleanMail — Gmail cleanup with user control.
        </div>
      </footer>
    </main>
  );
}
