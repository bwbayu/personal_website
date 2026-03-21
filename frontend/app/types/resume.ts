export type EducationType = {
  institution: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ExperienceType = {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string[];
  location?: string;
};

export type CertificationType = {
  company_name: string;
  title: string;
  issued: string;
  expires?: string;
  url?: string;
};

export type AchievementType = {
  event_name: string;
  org_name: string;
  achievement: string;
  date: string;
  descriptions?: string[];
  githubUrl?: string[];
  resultUrl?: string[];
};

export type ProjectType = {
  name: string;
  date: string;
  description: string;
  githubUrl?: string;
  url?: string;
  role: string[];
  technologies: { name: string; iconClass?: string; iconImage?: string }[];
  category: string[];
};

export type AboutMeType = {
  name: string;
  email: string;
  headline: string;
};

export type SkillType = {
  name: string;
  iconClass?: string;
  iconImage?: string;
  proficiency: string;
  category: string;
  isShow: boolean;
};

export type MediaSocialType = {
  name: string;
  url: string;
  iconClass: string;
};
