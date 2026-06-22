import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/blog/posts";
import { BlogListClient } from "@/components/blog/BlogListClient";

export const metadata: Metadata = {
  title: "Blog | Bayu Wicaksono",
  description: "Articles and notes by Bayu Wicaksono.",
};

// Server component: the published list is fetched at build time (force-cache, shared
// with generateStaticParams and each post page) and passed to the client list view.
export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <BlogListClient posts={posts} />;
}
