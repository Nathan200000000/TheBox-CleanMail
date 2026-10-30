"use client";

import { signIn } from "next-auth/react";

// Starts Google sign-in and lets the person choose which account to connect.
export default function SignInButton({
  compact = false,
  light = false,
  label = "Sign in with Google",
}: {
  compact?: boolean;
  light?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", undefined, { prompt: "select_account" })}
      className={
        light
          ? "rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
          : compact
          ? "rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          : "rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
      }
    >
      {label}
    </button>
  );
}
