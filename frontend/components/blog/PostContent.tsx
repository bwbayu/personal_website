import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Public markdown render (D5), executed at BUILD time in a server component so the
// HTML lands in the static export (SEO/OG). remark-gfm = tables/strikethrough/task
// lists; rehype-sanitize runs BEFORE rehype-highlight so the user content is cleaned
// first and the highlighter's trusted hljs classes are added afterwards (not stripped).
export function PostContent({ content }: { content: string }) {
  return (
    <div className="blog-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
