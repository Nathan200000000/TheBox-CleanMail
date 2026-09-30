"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

type CategoryKey =
  | "promotions"
  | "social"
  | "updates"
  | "forums"
  | "newsletters";

type CandidateMessage = {
  id: string;
  threadId: string;
};

type MessageDetails = CandidateMessage & {
  from: string;
  subject: string;
  date: string;
};

type Category = {
  key: CategoryKey;
  name: string;
  description: string;
};

const categories: Category[] = [
  {
    key: "promotions",
    name: "Promotions",
    description: "Sales, deals, offers, and promotional messages.",
  },
  {
    key: "social",
    name: "Social",
    description: "Social-network messages and activity notifications.",
  },
  {
    key: "updates",
    name: "Updates",
    description: "Automated updates, alerts, and account activity.",
  },
  {
    key: "forums",
    name: "Forums",
    description: "Messages from discussion groups and forums.",
  },
  {
    key: "newsletters",
    name: "Newsletters",
    description: "Messages that contain unsubscribe information.",
  },
];

const VISIBLE_MESSAGES = 1000;

export default function Home() {
  const { data: session, status } = useSession();

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryKey>("promotions");

  const [messages, setMessages] = useState<MessageDetails[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const [candidateCount, setCandidateCount] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const [showReview, setShowReview] = useState(false);

  const [cleanupStatus, setCleanupStatus] = useState<
    "idle" | "moving" | "success" | "error"
  >("idle");

  const [movedCount, setMovedCount] = useState(0);

  const [trashMessages, setTrashMessages] = useState<MessageDetails[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState("");

  const signInWithGoogle = () => {
    signIn("google", undefined, {
      prompt: "select_account",
    });
  };

  const loadTrash = async () => {
    setTrashLoading(true);
    setTrashError("");

    try {
      const response = await fetch("/api/gmail/trash-list", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        messages?: MessageDetails[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load Gmail Trash.");
      }

      setTrashMessages(data.messages ?? []);
    } catch (err) {
      setTrashError(
        err instanceof Error
          ? err.message
          : "Unable to load Gmail Trash."
      );
    } finally {
      setTrashLoading(false);
    }
  };

  const loadCategory = async (
    category: CategoryKey,
    pageToken: string | null,
    newPageIndex: number
  ) => {
    setLoading(true);
    setLoadingDetails(false);
    setError("");
    setMessages([]);
    setSelectedMessages([]);
    setShowReview(false);
    setCleanupStatus("idle");

    try {
      const params = new URLSearchParams({
        category,
      });

      if (pageToken) {
        params.set("pageToken", pageToken);
      }

      const candidatesResponse = await fetch(
        `/api/gmail/candidates?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const candidateData = (await candidatesResponse.json()) as {
        count?: number;
        messages?: CandidateMessage[];
        nextPageToken?: string | null;
        error?: string;
      };

      if (!candidatesResponse.ok) {
        throw new Error(
          candidateData.error ??
            (candidateData as { details?: { error?: { message?: string } } }).details?.error?.message ??
            "Unable to find Gmail candidates."
        );
      }

      let candidateMessages = candidateData.messages ?? [];
      let combinedNextPageToken = candidateData.nextPageToken ?? null;

      if (
        candidateMessages.length < VISIBLE_MESSAGES &&
        candidateData.nextPageToken
      ) {
        const secondParams = new URLSearchParams({
          category,
          pageToken: candidateData.nextPageToken,
        });

        const secondResponse = await fetch(
          `/api/gmail/candidates?${secondParams.toString()}`,
          {
            cache: "no-store",
          }
        );

        const secondData = (await secondResponse.json()) as {
          count?: number;
          messages?: CandidateMessage[];
          nextPageToken?: string | null;
          error?: string;
        };

        if (!secondResponse.ok) {
          throw new Error(
            secondData.error ?? "Unable to load additional Gmail candidates."
          );
        }

        candidateMessages = [
          ...candidateMessages,
          ...(secondData.messages ?? []),
        ].slice(0, VISIBLE_MESSAGES);

        combinedNextPageToken = secondData.nextPageToken ?? null;
      }

      setCandidateCount(candidateMessages.length);
      setNextPageToken(combinedNextPageToken);
      setPageIndex(newPageIndex);

      setLoading(false);
      setLoadingDetails(true);

      const visibleMessages = candidateMessages.slice(0, VISIBLE_MESSAGES);

      if (visibleMessages.length === 0) {
        setMessages([]);
        setLoadingDetails(false);
        return;
      }

      const detailsResponse = await fetch("/api/gmail/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageIds: visibleMessages.map((message) => message.id),
        }),
      });

      const detailsData = (await detailsResponse.json()) as {
        messages?: MessageDetails[];
        error?: string;
      };

      if (!detailsResponse.ok) {
        throw new Error(
          detailsData.error ?? "Unable to load message details."
        );
      }

      setMessages(detailsData.messages ?? []);
      setLoadingDetails(false);
    } catch (err) {
      setLoading(false);
      setLoadingDetails(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Gmail candidates."
      );
    }
  };

  const scanCategory = () => {
    setPageTokens([null]);
    setPageIndex(0);
    void loadCategory(selectedCategory, null, 0);
  };

  const selectCategory = (category: CategoryKey) => {
    setSelectedCategory(category);
    setMessages([]);
    setSelectedMessages([]);
    setNextPageToken(null);
    setCandidateCount(0);
    setPageTokens([null]);
    setPageIndex(0);
    setShowReview(false);
    setCleanupStatus("idle");
    setError("");
  };

  const goToNextPage = () => {
    if (!nextPageToken || loading) {
      return;
    }

    const updatedTokens = [...pageTokens, nextPageToken];

    setPageTokens(updatedTokens);

    void loadCategory(
      selectedCategory,
      nextPageToken,
      pageIndex + 1
    );
  };

  const goToPreviousPage = () => {
    if (pageIndex === 0 || loading) {
      return;
    }

    const previousToken = pageTokens[pageIndex - 1] ?? null;

    void loadCategory(
      selectedCategory,
      previousToken,
      pageIndex - 1
    );
  };

  const toggleMessage = (messageId: string) => {
    setSelectedMessages((current) =>
      current.includes(messageId)
        ? current.filter((id) => id !== messageId)
        : [...current, messageId]
    );
  };

  const selectAllVisible = () => {
    setSelectedMessages(messages.map((message) => message.id));
  };

  const clearSelection = () => {
    setSelectedMessages([]);
    setShowReview(false);
  };

  const moveSelectedToTrash = async () => {
    if (selectedMessages.length === 0) {
      return;
    }

    setCleanupStatus("moving");
    setError("");

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

      const data = (await response.json()) as {
        success?: boolean;
        moved?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to move selected messages to Trash."
        );
      }

      setMovedCount(data.moved ?? selectedMessages.length);
      setSelectedMessages([]);
      setShowReview(false);
      setCleanupStatus("success");

      setPageTokens([null]);
      setPageIndex(0);

      await loadCategory(selectedCategory, null, 0);
    } catch (err) {
      setCleanupStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Unable to move selected messages to Trash."
      );
    }
  };

  const currentCategory = categories.find(
    (category) => category.key === selectedCategory
  );

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
              Gmail cleanup
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Find messages worth reviewing.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Choose a Gmail category, scan a page of candidates, and review
              individual messages before anything is moved.
            </p>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-950">
                Nothing is automatically deleted.
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                CleanMail only moves messages to Trash after you select them
                and confirm the cleanup.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Choose a cleanup category
          </h2>

          <p className="mt-2 text-slate-600">
            Gmail finds the candidate messages. CleanMail lets you review them.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const selected = selectedCategory === category.key;

            return (
              <button
                key={category.key}
                type="button"
                onClick={() => selectCategory(category.key)}
                className={`text-left rounded-2xl border p-6 transition ${
                  selected
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
                }`}
              >
                <h3 className="text-xl font-semibold">
                  {category.name}
                </h3>

                <p
                  className={`mt-2 leading-6 ${
                    selected ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Selected category
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                {currentCategory?.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={scanCategory}
              disabled={loading}
              className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Finding candidates..." : "Scan category"}
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            CleanMail loads up to 500 candidate IDs at a time and displays
            details for only the first {VISIBLE_MESSAGES}.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-950">
              CleanMail could not complete that request.
            </p>

            <p className="mt-1 text-sm text-red-800">{error}</p>
          </div>
        )}

        {cleanupStatus === "success" && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-950">
              {movedCount} message
              {movedCount === 1 ? "" : "s"} moved to Trash.
            </p>

            <p className="mt-1 text-sm text-emerald-800">
              CleanMail refreshed this category after the cleanup.
            </p>
          </div>
        )}

        {loadingDetails && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-medium text-slate-700">
              Loading message details...
            </p>
          </div>
        )}

        {messages.length > 0 && !loadingDetails && (
          <section className="mt-16">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                  Candidate messages
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Review before cleanup
                </h2>

                <p className="mt-2 text-slate-600">
                  Showing {messages.length} messages from this candidate page.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Select all visible
                </button>

                {selectedMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-200">
                {messages.map((message) => {
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
                          <p className="truncate font-semibold">
                            {message.from || "Unknown sender"}
                          </p>

                          <p className="mt-1 font-medium text-slate-800">
                            {message.subject || "(No subject)"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {message.date || "Unknown date"}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageIndex === 0 || loading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous 500
              </button>

              <div className="text-center text-sm text-slate-500">
                <p>
                  Candidate page {pageIndex + 1}
                </p>

                <p className="mt-1">
                  {candidateCount} candidates loaded
                </p>
              </div>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={!nextPageToken || loading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next 500
              </button>
            </div>

            {selectedMessages.length > 0 && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-950">
                  {selectedMessages.length} message
                  {selectedMessages.length === 1 ? "" : "s"} selected
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  These messages are only selected for review. Nothing has been
                  moved yet.
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
                      Confirm these messages before moving them to Trash.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {selectedMessages.length} selected
                  </span>
                </div>

                <div className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {messages
                    .filter((message) =>
                      selectedMessages.includes(message.id)
                    )
                    .map((message) => (
                      <div key={message.id} className="p-4">
                        <p className="font-semibold">
                          {message.from || "Unknown sender"}
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {message.subject || "(No subject)"}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {message.date || "Unknown date"}
                        </p>
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
                  CleanMail moves selected messages to Gmail&apos;s Trash. It
                  does not permanently delete them.
                </p>
              </section>
            )}
          </section>
        )}
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
                Gmail Trash
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Recently trashed messages
              </h2>

              <p className="mt-2 text-slate-600">
                View messages currently sitting in Gmail&apos;s Trash.
              </p>
            </div>

            <button
              type="button"
              onClick={loadTrash}
              disabled={trashLoading}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {trashLoading ? "Loading Trash..." : "Load Trash"}
            </button>
          </div>

          {trashError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-950">
                Could not load Gmail Trash.
              </p>

              <p className="mt-1 text-sm text-red-800">
                {trashError}
              </p>
            </div>
          )}

          {trashMessages.length > 0 && !trashLoading && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <p className="text-sm font-medium text-slate-600">
                  {trashMessages.length} messages loaded
                </p>

                <button
                  type="button"
                  onClick={loadTrash}
                  className="text-sm font-semibold text-slate-950 underline underline-offset-4"
                >
                  Refresh
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {trashMessages.map((message) => (
                  <div key={message.id} className="p-5">
                    <p className="truncate font-semibold">
                      {message.from || "Unknown sender"}
                    </p>

                    <p className="mt-1 font-medium text-slate-800">
                      {message.subject || "(No subject)"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {message.date || "Unknown date"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!trashLoading && !trashError && trashMessages.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="font-medium text-slate-700">
                Trash has not been loaded yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Click &quot;Load Trash&quot; to view messages currently in
                Gmail&apos;s Trash.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold">Built around your control</h2>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold">Review first</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                CleanMail shows you individual messages before anything is
                moved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">No automatic deletion</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You decide which messages should be cleaned up.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Efficient scanning</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gmail performs the category filtering instead of CleanMail
                downloading your entire mailbox.
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
