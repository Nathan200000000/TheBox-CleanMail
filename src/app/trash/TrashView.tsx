"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@/components/PageShell";
import SignInButton from "@/components/SignInButton";
import type { MessageDetails } from "@/lib/categories";

export default function TrashView() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<MessageDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gmail/trash-list", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { messages?: MessageDetails[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load Gmail Trash.");
      setMessages(data.messages ?? []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Gmail Trash.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) void loadTrash();
  }, [session, loadTrash]);

  if (status === "loading") return <Panel><p className="text-slate-500">Loading your session…</p></Panel>;

  if (!session) {
    return (
      <Panel className="text-center">
        <h2 className="text-2xl font-bold">Sign in to see your Trash</h2>
        <p className="mt-3 text-slate-600">CleanMail shows the 50 most recent messages in Gmail Trash.</p>
        <div className="mt-6"><SignInButton /></div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recently trashed</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gmail permanently removes Trash after 30 days. To restore a message, open Trash in Gmail and choose “Move to Inbox”.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadTrash} disabled={loading}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
            {loading ? "Loading…" : "Refresh"}
          </button>
          <a href="https://mail.google.com/mail/u/0/#trash" target="_blank" rel="noopener noreferrer"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Open Gmail Trash
          </a>
        </div>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="mt-6">
        {loading && !loaded ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">Loading Trash…</p>
        ) : loaded && messages.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">Your Gmail Trash is empty.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {messages.map((message) => (
              <li key={message.id} className="flex items-start gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{message.subject || "(no subject)"}</span>
                  <span className="block truncate text-sm text-slate-500">{message.from}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{message.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
