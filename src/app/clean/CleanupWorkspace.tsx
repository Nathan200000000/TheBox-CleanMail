"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Panel } from "@/components/PageShell";
import SignInButton from "@/components/SignInButton";
import {
  CATEGORIES,
  type CandidateMessage,
  type CategoryKey,
  type MessageDetails,
} from "@/lib/categories";

const VISIBLE_MESSAGES = 1000;

type CandidatePage = { messages?: CandidateMessage[]; nextPageToken?: string | null; error?: string };

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? fallback);
  return data;
}

export default function CleanupWorkspace({ initialCategory }: { initialCategory: CategoryKey }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(initialCategory);
  const [messages, setMessages] = useState<MessageDetails[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState<"idle" | "moving" | "success" | "error">("idle");
  const [movedCount, setMovedCount] = useState(0);

  const fetchCandidates = async (category: CategoryKey, pageToken: string | null) => {
    const params = new URLSearchParams({ category });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`/api/gmail/candidates?${params}`, { cache: "no-store" });
    return readJson<CandidatePage>(response, "Unable to find Gmail candidates.");
  };

  const loadCategory = async (
    category: CategoryKey,
    pageToken: string | null,
    newPageIndex: number,
    keepStatus = false
  ) => {
    setLoading(true);
    setLoadingDetails(false);
    setError("");
    setMessages([]);
    setSelectedMessages([]);
    setShowReview(false);
    if (!keepStatus) setCleanupStatus("idle");

    try {
      // Gmail returns up to 500 per request, so fetch a second page to fill the view.
      const first = await fetchCandidates(category, pageToken);
      let candidates = first.messages ?? [];
      let next = first.nextPageToken ?? null;

      if (candidates.length < VISIBLE_MESSAGES && next) {
        const second = await fetchCandidates(category, next);
        candidates = [...candidates, ...(second.messages ?? [])].slice(0, VISIBLE_MESSAGES);
        next = second.nextPageToken ?? null;
      }

      setNextPageToken(next);
      setPageIndex(newPageIndex);
      setScanned(true);
      setLoading(false);

      if (candidates.length === 0) return;

      setLoadingDetails(true);
      const detailsResponse = await fetch("/api/gmail/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: candidates.map((message) => message.id) }),
      });
      const details = await readJson<{ messages?: MessageDetails[] }>(
        detailsResponse,
        "Unable to load message details."
      );
      setMessages(details.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Gmail candidates.");
    } finally {
      setLoading(false);
      setLoadingDetails(false);
    }
  };

  const scanCategory = () => {
    setPageTokens([null]);
    void loadCategory(selectedCategory, null, 0);
  };

  const selectCategory = (category: CategoryKey) => {
    setSelectedCategory(category);
    setMessages([]);
    setSelectedMessages([]);
    setNextPageToken(null);
    setPageTokens([null]);
    setPageIndex(0);
    setScanned(false);
    setShowReview(false);
    setCleanupStatus("idle");
    setError("");
    router.replace(`/clean?category=${category}`, { scroll: false });
  };

  const goToNextPage = () => {
    if (!nextPageToken || loading) return;
    setPageTokens([...pageTokens.slice(0, pageIndex + 1), nextPageToken]);
    void loadCategory(selectedCategory, nextPageToken, pageIndex + 1);
  };

  const goToPreviousPage = () => {
    if (pageIndex === 0 || loading) return;
    void loadCategory(selectedCategory, pageTokens[pageIndex - 1] ?? null, pageIndex - 1);
  };

  const toggleMessage = (id: string) =>
    setSelectedMessages((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const moveSelectedToTrash = async () => {
    if (selectedMessages.length === 0) return;
    setCleanupStatus("moving");
    setError("");

    try {
      const response = await fetch("/api/gmail/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: selectedMessages, confirm: true }),
      });
      const data = await readJson<{ moved?: number }>(response, "Unable to move selected messages to Trash.");
      setMovedCount(data.moved ?? selectedMessages.length);
      setCleanupStatus("success");
      setPageTokens([null]);
      await loadCategory(selectedCategory, null, 0, true);
    } catch (err) {
      setCleanupStatus("error");
      setError(err instanceof Error ? err.message : "Unable to move selected messages to Trash.");
    }
  };

  const currentCategory = CATEGORIES.find((category) => category.key === selectedCategory)!;
  const selectedDetails = messages.filter((message) => selectedMessages.includes(message.id));
  const busy = loading || loadingDetails || cleanupStatus === "moving";

  if (status === "loading") {
    return <Panel><p className="text-slate-500">Loading your session…</p></Panel>;
  }

  if (!session) {
    return (
      <Panel className="text-center">
        <h2 className="text-2xl font-bold">Sign in to start cleaning</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          CleanMail needs permission to read message headers and move the messages you choose to Trash.
          Nothing is deleted automatically.
        </p>
        <div className="mt-6"><SignInButton /></div>
        <p className="mt-4 text-sm text-slate-500">
          Read the <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link> first.
        </p>
      </Panel>
    );
  }

  return (
    <>
      {/* Step 1 — choose a category */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Step 1</p>
            <h2 className="text-2xl font-bold">Choose a category</h2>
          </div>
          <button
            type="button"
            onClick={scanCategory}
            disabled={busy}
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scanning…" : `Scan ${currentCategory.name}`}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((category) => {
            const active = category.key === selectedCategory;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => selectCategory(category.key)}
                disabled={busy}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white hover:border-slate-400"
                }`}
              >
                <span className="block font-semibold">{category.name}</span>
                <span className={`mt-1 block text-sm ${active ? "text-slate-300" : "text-slate-500"}`}>
                  {category.description}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}
      {cleanupStatus === "success" && (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          Moved {movedCount} message{movedCount === 1 ? "" : "s"} to Trash. You can restore them from Gmail Trash for 30 days —{" "}
          <Link href="/trash" className="font-semibold underline underline-offset-4">view Trash</Link>.
        </div>
      )}

      {/* Step 2 — review candidates */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Step 2</p>
            <h2 className="text-2xl font-bold">Review {currentCategory.name.toLowerCase()}</h2>
            {scanned && !loading && (
              <p className="mt-1 text-sm text-slate-500">
                Page {pageIndex + 1} · {messages.length} message{messages.length === 1 ? "" : "s"} shown
              </p>
            )}
          </div>
          {messages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedMessages(messages.map((m) => m.id))} disabled={busy}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                Select all
              </button>
              <button type="button" onClick={() => { setSelectedMessages([]); setShowReview(false); }} disabled={busy}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading || loadingDetails ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
              {loading ? "Finding candidates in Gmail…" : "Loading senders and subjects…"}
            </p>
          ) : !scanned ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
              Choose a category and press Scan to see messages worth reviewing.
            </p>
          ) : messages.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">
              Nothing to review here — this category is clean.
            </p>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {messages.map((message) => {
                const checked = selectedMessages.includes(message.id);
                return (
                  <li key={message.id}>
                    <label className={`flex cursor-pointer items-start gap-3 px-4 py-3 ${checked ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMessage(message.id)}
                        className="mt-1 h-4 w-4 accent-slate-950"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{message.subject || "(no subject)"}</span>
                        <span className="block truncate text-sm text-slate-500">{message.from}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{message.date}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {scanned && (pageIndex > 0 || nextPageToken) && (
          <div className="mt-4 flex justify-between">
            <button type="button" onClick={goToPreviousPage} disabled={pageIndex === 0 || busy}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">
              ← Previous
            </button>
            <button type="button" onClick={goToNextPage} disabled={!nextPageToken || busy}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </Panel>

      {/* Step 3 — confirm */}
      <Panel>
        <p className="text-sm font-semibold text-emerald-600">Step 3</p>
        <h2 className="text-2xl font-bold">Move to Trash</h2>

        {selectedMessages.length === 0 ? (
          <p className="mt-3 text-slate-500">Select messages above. Nothing moves until you confirm here.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {selectedMessages.length} message{selectedMessages.length === 1 ? "" : "s"} selected.
            </div>

            {!showReview ? (
              <button type="button" onClick={() => setShowReview(true)} disabled={busy}
                className="justify-self-start rounded-xl border border-slate-950 px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50">
                Review selection
              </button>
            ) : (
              <>
                <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 text-sm">
                  {selectedDetails.map((message) => (
                    <li key={message.id} className="px-4 py-2">
                      <span className="font-medium">{message.subject || "(no subject)"}</span>
                      <span className="text-slate-500"> — {message.from}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-600">
                  These go to Gmail Trash, not permanent deletion. Gmail keeps them for 30 days so you can restore them.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={moveSelectedToTrash} disabled={busy}
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                    {cleanupStatus === "moving" ? "Moving…" : `Move ${selectedMessages.length} to Trash`}
                  </button>
                  <button type="button" onClick={() => setShowReview(false)} disabled={busy}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Panel>
    </>
  );
}
