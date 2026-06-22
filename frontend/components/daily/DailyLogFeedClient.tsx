"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface DailyLogEntry {
  id: string;
  date: string;
  dateLabel: string;
  tags: string[];
  // Markdown pre-rendered at build by the server PostContent; react-markdown never
  // ships to the client (DL9). This wrapper only renders the node.
  content: ReactNode;
}

// Public /daily feed (DL1/DL7/DL9). Receives entries whose markdown was already
// rendered server-side; this client wrapper only toggles which entries are visible
// by tag. "All" resets the filter.
export function DailyLogFeedClient({ entries }: { entries: DailyLogEntry[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) for (const tag of entry.tags) set.add(tag);
    return Array.from(set).sort();
  }, [entries]);

  const visible = activeTag ? entries.filter((entry) => entry.tags.includes(activeTag)) : entries;

  if (entries.length === 0) {
    return (
      <div className="flex grow flex-col bg-gray-900 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-200">Daily Log</h1>
        <p className="text-gray-400">No entries yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col bg-gray-900 p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-200">Daily Log</h1>

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`rounded-full border px-3 py-1 text-sm ${
              activeTag === null
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`rounded-full border px-3 py-1 text-sm ${
                activeTag === tag
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {visible.map((entry) => (
          <article key={entry.id} className="border-l-2 border-gray-700 pl-4">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-100">{entry.dateLabel}</h2>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {entry.content}
          </article>
        ))}
      </div>
    </div>
  );
}
