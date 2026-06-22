"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { isSafeUrl } from "@/lib/url";
import { excerptOf, formatDate, type Post } from "@/lib/blog/posts";

// Public /blog list (D9, D12). Receives the build-fetched published list as a prop
// (the server page does the fetch) and renders cards + a client-side tag filter.
export function BlogListClient({ posts }: { posts: Post[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) for (const tag of post.tags) set.add(tag);
    return Array.from(set).sort();
  }, [posts]);

  const visible = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts;

  if (posts.length === 0) {
    return (
      <div className="flex grow flex-col bg-gray-900 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-200">Blog</h1>
        <p className="text-gray-400">No posts published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col bg-gray-900 p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-200">Blog</h1>

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

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="flex flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-transform hover:-translate-y-1"
          >
            {post.cover && isSafeUrl(post.cover) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover} alt={post.title} className="h-44 w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col gap-3 p-4">
              <h2 className="text-lg font-semibold text-gray-100">{post.title}</h2>
              <p className="flex-1 text-sm text-gray-400">{excerptOf(post)}</p>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(post.publishedAt)}</span>
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
