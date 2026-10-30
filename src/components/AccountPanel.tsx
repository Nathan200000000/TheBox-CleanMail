"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Panel } from "@/components/PageShell";
import SignInButton from "@/components/SignInButton";
import { CATEGORIES } from "@/lib/categories";

type Profile = { emailAddress?: string; messagesTotal?: number; threadsTotal?: number };

export default function AccountPanel() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetch("/api/gmail/profile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Profile | null) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (status === "loading") {
    return <Panel><div className="h-24 animate-pulse rounded-xl bg-slate-100" /></Panel>;
  }

  if (!session) {
    return (
      <Panel className="bg-slate-950 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Get started</p>
            <h2 className="mt-2 text-3xl font-bold">Connect your Gmail in one step.</h2>
            <p className="mt-3 text-slate-300">
              Sign in with Google, choose a category, and review what CleanMail finds. You decide what moves to Trash.
            </p>
          </div>
          <SignInButton light />
        </div>
      </Panel>
    );
  }

  const first = session.user?.name?.split(" ")[0];
  const stats = [
    { label: "Messages in Gmail", value: profile?.messagesTotal },
    { label: "Conversations", value: profile?.threadsTotal },
  ];

  return (
    <Panel>
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Signed in</p>
      <h2 className="mt-2 text-3xl font-bold">Welcome back{first ? `, ${first}` : ""}.</h2>
      <p className="mt-2 text-slate-600">{profile?.emailAddress ?? session.user?.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {stat.value === undefined ? "—" : stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold text-slate-700">Jump into a category</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Link
            key={category.key}
            href={`/clean?category=${category.key}`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </Panel>
  );
}
