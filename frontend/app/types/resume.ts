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
  youtubeUrl?: string;
  role: string[];
  technologies: { name: string; iconClass?: string; iconImage?: string }[];
  category: string[];
};

export type AboutMeType = {
  name: string;
  email: string;
};

export type SkillType = {
  id: string;
  name: string;
  iconClass?: string;
  iconImage?: string;
  categoryId: string;
  order: number;
  isShow: boolean;
};

export type CategoryType = {
  id: string;
  name: string;
  order: number;
};

export type MediaSocialType = {
  name: string;
  url: string;
  iconClass: string;
};
