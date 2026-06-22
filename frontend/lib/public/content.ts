// Build-time fetchers for the public pages (home / projects / resume). Each is
// fetched with force-cache so a data domain requested by more than one page (skills
// on home + projects) dedups to a single request via Next's build-time fetch dedup.
// NOT no-store: that would refetch per consumer and break static export. Mirrors
// lib/blog/posts.ts / lib/daily/logs.ts: throw on HTTP error (build fails) and, for
// list endpoints, return [] on empty (a valid state). Singletons the pages depend on
// (about) throw on a missing document.

import {
  AboutMeType,
  SkillType,
  CategoryType,
  ProjectType,
  EducationType,
  ExperienceType,
  CertificationType,
  AchievementType,
} from "@/app/types/resume";
import { apiBase } from "@/lib/apiBase";

// The /api/resume aggregation payload (read-only backend join of the four sections).
export type ResumeData = {
  educations: EducationType[];
  experiences: ExperienceType[];
  certifications: CertificationType[];
  achievements: AchievementType[];
};

export async function getAbout(): Promise<AboutMeType> {
  const res = await fetch(`${apiBase()}/api/about`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch about (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: AboutMeType };
  if (!json.data) throw new Error("Invalid API response: missing about data");
  return json.data;
}

export async function getSkills(): Promise<SkillType[]> {
  const res = await fetch(`${apiBase()}/api/skills`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch skills (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: SkillType[] };
  // Full unfiltered list: home filters to isShow, projects needs all of them to
  // resolve project-only (isShow:false) tech icons.
  return json.data ?? [];
}

export async function getCategories(): Promise<CategoryType[]> {
  const res = await fetch(`${apiBase()}/api/categories`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch categories (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: CategoryType[] };
  return json.data ?? [];
}

export async function getProjects(): Promise<ProjectType[]> {
  const res = await fetch(`${apiBase()}/api/projects`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: ProjectType[] };
  return json.data ?? [];
}

export async function getResume(): Promise<ResumeData> {
  const res = await fetch(`${apiBase()}/api/resume`, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Failed to fetch resume (HTTP ${res.status})`);
  }
  const json = (await res.json()) as { data?: ResumeData };
  if (!json.data) throw new Error("Invalid API response: missing resume data");
  return json.data;
}
