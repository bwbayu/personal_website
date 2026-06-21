"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { registry, type DomainConfig } from "@/lib/admin/config";
import { listDomain } from "@/lib/admin/api";
import { adminKeys } from "@/lib/queries";

// One dashboard card per domain. Non-singleton cards show a live item count derived
// from the domain's list query (shared cache key with the list view, so one fetch
// serves both and one invalidation refreshes both); a failed count degrades to a dash
// instead of breaking the grid. The singleton (about) has no list, so it shows an Edit
// link and no count.
function DomainCard({ config }: { config: DomainConfig }) {
  const { data: count, isPending, isError } = useQuery({
    queryKey: adminKeys.domain(config.apiPath),
    queryFn: () => listDomain(config.apiPath),
    enabled: !config.singleton,
    select: (rows) => rows.length,
  });

  const countLabel = isPending
    ? "..."
    : isError
      ? "-"
      : `${count} item${count === 1 ? "" : "s"}`;

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
