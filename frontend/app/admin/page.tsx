"use client";

import Link from "next/link";
import { registry } from "@/lib/admin/config";

// Admin dashboard: an index of every manageable content domain. The auth guard and
// shell are applied by the admin layout, so this page only renders the content.
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Admin dashboard</h1>
      <p className="mb-6 text-sm text-gray-600">
        Manage the site content. Select a section to get started.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {registry.map((domain) => (
          <Link
            key={domain.slug}
            href={`/admin/${domain.slug}`}
            className="rounded border border-gray-200 p-4 transition hover:border-blue-400 hover:shadow"
          >
            <span className="font-medium">{domain.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
