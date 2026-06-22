import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { excerptOf, formatDate, getPublishedPosts } from "@/lib/blog/posts";
import { PostContent } from "@/components/blog/PostContent";

// Only published slugs are pre-rendered; anything else (drafts, unknown) 404s (D11).
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const posts = await getPublishedPosts();
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};

  const description = excerptOf(post);
  const images = post.cover ? [post.cover] : undefined;
  return {
    title: `${post.title} | Bayu Wicaksono`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: post.title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const posts = await getPublishedPosts();
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <div className="flex grow flex-col bg-gray-900 p-6">
      <article className="mx-auto w-full max-w-3xl">
        <header className="mb-8 border-b border-gray-700 pb-6">
          <h1 className="mb-3 text-3xl font-bold text-gray-100">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span>{post.readingTime} min read</span>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
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
        </header>
        <PostContent content={post.content} />
      </article>
    </div>
  );
}
