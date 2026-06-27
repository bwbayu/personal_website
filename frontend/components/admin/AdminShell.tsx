"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { bySlug, navGroups } from "@/lib/admin/config";
import { toolLinks } from "@/lib/admin/tools";

// Sidebar + content shell for the authenticated admin area. On desktop the grouped
// sidebar is always visible; below md it collapses behind a topbar toggle into a
// hand-rolled off-canvas drawer.
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const hasOpened = useRef(false);

  const linkClass = (active: boolean) =>
    `rounded px-3 py-2 text-sm ${
      active
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  // Close the drawer whenever the route changes (a nav link was selected).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close the drawer on Escape while it is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Lock body scroll while the drawer is open so the page behind it does not move.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Move focus into the drawer when it opens and return it to the toggle on close.
  useEffect(() => {
    if (drawerOpen) {
      hasOpened.current = true;
      closeButtonRef.current?.focus();
    } else if (hasOpened.current) {
      openButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  // Single source of nav links, rendered into both the desktop sidebar and the drawer.
  const navLinks = (
    <>
      <Link href="/admin" className={linkClass(pathname === "/admin")}>
        Dashboard
      </Link>
      {navGroups.map((group) => (
        <div key={group.label} className="mt-3 flex flex-col gap-1">
          <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {group.label}
          </span>
          {group.slugs.map((slug) => {
            const domain = bySlug[slug];
            if (!domain) return null;
            return (
              <Link
                key={slug}
                href={`/admin/${slug}`}
                className={linkClass(pathname.startsWith(`/admin/${slug}`))}
              >
                {domain.label}
              </Link>
            );
          })}
        </div>
      ))}
      {/* Tools: non-CRUD utility pages, kept out of navGroups/registry (see tools.ts). */}
      <div className="mt-3 flex flex-col gap-1">
        <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Tools
        </span>
        {toolLinks.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.path}
            className={linkClass(pathname.startsWith(tool.path))}
          >
            {tool.label}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-1 flex-col bg-gray-900">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
        {/* Desktop sidebar (md and up) */}
        <aside className="hidden w-56 shrink-0 md:sticky md:top-8 md:block md:self-start">
          <nav
            aria-label="Primary"
            className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-800 p-2"
          >
            {navLinks}
          </nav>
        </aside>

        {/* Mobile off-canvas drawer backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
            drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Mobile off-canvas drawer panel */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-gray-800 p-3 transition-transform md:hidden ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role={drawerOpen ? "dialog" : undefined}
          aria-modal={drawerOpen ? true : undefined}
          aria-label="Admin navigation"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-white">Menu</span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                ref={openButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white md:hidden"
              >
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <span className="truncate text-sm text-gray-400">{user?.email}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Link href="/" className="text-sm text-blue-500 hover:text-blue-400">
                View site
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Sign out
              </button>
            </div>
          </header>
          <div className="animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  );
}
