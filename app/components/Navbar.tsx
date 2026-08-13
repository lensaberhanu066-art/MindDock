"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "../lib/auth";

const NAV_ITEMS = [
  { label: "Tasks", href: "/tasks" },
  { label: "Diary", href: "/diary" },
  { label: "Notes", href: "/notes" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="menu-toggle"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        ☰
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="sidebar-overlay fixed inset-0 z-40"
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-panel fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/10  bg-slate-950/95 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 font-semibold text-white">
              MD
            </div>
            <div>
              <p className="text-sm font-semibold text-white">MindDock</p>
              <p className="text-xs text-slate-400">Daily workspace</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-xl text-slate-300 transition hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between bg-slate-950 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs opacity-70">↗</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Keep your tasks, notes, and diary in one calm place.
        </div>

        {currentUser ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/20"
          >
            Logout ({currentUser.name})
          </button>
        ) : null}
      </aside>
    </>
  );
}