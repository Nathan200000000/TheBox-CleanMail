"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import SignInButton from "@/components/SignInButton";

// Simple line icons (24×24), drawn with the current text color.
const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  clean: (
    <>
      <path d="M4 7h16l-1.5 12.5h-13z" />
      <path d="M9 7V4.5h6V7" />
      <path d="m9.5 13 2 2 3.5-4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  privacy: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: string };

const MAIN: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clean", label: "Clean up", icon: "clean" },
  { href: "/trash", label: "Trash", icon: "trash" },
];
const SECONDARY: NavItem[] = [{ href: "/privacy", label: "Privacy Policy", icon: "privacy" }];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const current = [...MAIN, ...SECONDARY].find((item) => isActive(pathname, item.href));

  const navLink = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-slate-950 text-white shadow-md shadow-slate-950/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`}
      >
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  };

  const name = session?.user?.name || session?.user?.email || "";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen w-full bg-white text-slate-950">
      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
              <path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight tracking-tight">CleanMail</span>
            <span className="block text-xs text-slate-500">Gmail cleanup with control</span>
          </span>
        </Link>

        <nav aria-label="Main" className="grid gap-1">
          {MAIN.map(navLink)}
          <div className="mx-3 my-3 h-px bg-slate-200" />
          {SECONDARY.map(navLink)}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {status === "loading" ? (
            <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
          ) : session?.user ? (
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">
                    {initials}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{session.user.name}</span>
                  <span className="block truncate text-xs text-slate-500">{session.user.email}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-left text-xs font-semibold text-red-600 hover:underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="text-xs text-slate-500">Connect Gmail to start reviewing cleanup candidates.</p>
              <SignInButton compact />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-700"
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className="font-bold">CleanMail</Link>
          {current && <span className="truncate text-sm text-slate-500">/ {current.label}</span>}
        </div>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-slate-200 px-6 py-6 text-sm text-slate-500">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
            <span>CleanMail — Gmail cleanup with user control.</span>
            <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
