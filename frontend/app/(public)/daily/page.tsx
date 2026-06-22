import type { Metadata } from "next";
import { getDailyLogs } from "@/lib/daily/logs";
import { formatDateUTC } from "@/lib/date";
import { PostContent } from "@/components/blog/PostContent";
import { DailyLogFeedClient } from "@/components/daily/DailyLogFeedClient";

export const metadata: Metadata = {
  title: "Daily Log | Bayu Wicaksono",
  description: "Short daily notes by Bayu Wicaksono.",
};

// Server component: every entry is fetched at build time and its markdown rendered
// HERE via PostContent, so react-markdown stays out of the client bundle (DL9). The
// pre-rendered nodes are handed to a thin client wrapper that only filters by tag.
export default async function DailyPage() {
  const logs = await getDailyLogs();
  const entries = logs.map((log) => ({
    id: log.id,
    date: log.date,
    dateLabel: formatDateUTC(log.date),
    tags: log.tags,
    content: <PostContent content={log.content} />,
  }));
  return <DailyLogFeedClient entries={entries} />;
}
