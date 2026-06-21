"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { registry, type DomainConfig } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";

type CountState =
  | { status: "loading" }
  | { status: "ok"; count: number }
  | { status: "error" };

// One dashboard card per domain. Non-singleton cards fetch their list once on mount
// for a live item count (public GET, no-store) and offer Manage / Add-new links; a
// failed count degrades to a dash instead of breaking the grid. The singleton (about)
// has no list, so it shows an Edit link and no count.
function DomainCard({ config }: { config: DomainConfig }) {
  const [state, setState] = useState<CountState>({ status: "loading" });

  useEffect(() => {
    if (config.singleton) return;
    let active = true;
    setState({ status: "loading" });
    listDomain(config.apiPath)
      .then((rows) => {
        if (active) setState({ status: "ok", count: rows.length });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [config]);

  const countLabel =
    state.status === "loading"
      ? "..."
      : state.status === "error"
        ? "-"
        : `${state.count} item${state.count === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium text-gray-100">{config.label}</h2>
        {!config.singleton && <span className="text-sm text-gray-400">{countLabel}</span>}
      </div>
      <div className="flex gap-4 text-sm">
        {config.singleton ? (
          <Link
            href={`/admin/${config.slug}`}
            className="text-blue-500 hover:text-blue-400"
          >
            Edit profile
          </Link>
        ) : (
          <>
            <Link
              href={`/admin/${config.slug}`}
              className="text-blue-500 hover:text-blue-400"
            >
              Manage
            </Link>
            <Link
              href={`/admin/${config.slug}/new`}
              className="text-blue-500 hover:text-blue-400"
            >
              Add new
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// Landing dashboard for /admin: a responsive grid of domain cards (1/2/3 columns).
export function DashboardClient() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-white">Admin dashboard</h1>
      <p className="mb-6 text-sm text-gray-400">
        Manage the site content. Select a section to get started.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {registry.map((domain) => (
          <DomainCard key={domain.slug} config={domain} />
        ))}
      </div>
    </div>
  );
}
