import {
  EducationType,
  ExperienceType,
  CertificationType,
  AchievementType,
} from "@/app/types/resume";

type ResumeData = {
  educations: EducationType[];
  experiences: ExperienceType[];
  certifications: CertificationType[];
  achievements: AchievementType[];
};

export async function fetchResume(): Promise<ResumeData> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch resume data (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json.data) throw new Error("Invalid API response: missing data");
  return json.data as ResumeData;
}
