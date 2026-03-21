import { ProjectType } from "@/app/types/resume";

export async function fetchProjects(): Promise<ProjectType[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects data (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json.data) throw new Error("Invalid API response: missing data");
  return json.data as ProjectType[];
}
