"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { bySlug, navGroups } from "@/lib/admin/config";

// Sidebar + content shell for the authenticated admin area. The sidebar lists every
// registered domain; the content slot renders the active page.
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const linkClass = (active: boolean) =>
    `rounded px-3 py-2 text-sm ${
      active
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <div className="flex flex-1 flex-col bg-gray-900">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-800 p-2">
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
          </nav>
        </aside>

        <div className="flex-1">
          <header className="mb-6 flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm text-blue-500 hover:text-blue-400"
            >
              Sign out
            </button>
          </header>
          <div className="animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  );
}
