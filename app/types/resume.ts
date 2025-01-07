export type EducationType = {
    institusi: string;
    title: string;
    start: string;
    end: string;
    description: string;
};
  
export type ExperienceType = {
    company: string;
    role: string;
    start: string;
    end: string;
    description: string[];
    location?: string;
    duration?: number;
};
  
export type CertificationType = {
    company: string;
    title: string;
    issued: string;
    expires?: string;
    url?: string;
};
  
export type AchievementType = {
    event: string;
    organization: string;
    achievement: string;
    date: string;
    description?: string[];
    repository?: string[];
    url?: string;
};

export type ProjectType = {
    name: string;
    date: string;
    description: string;
    repository: string;
    role: string[];
    tech: { name: string; iconClass: string }[];
    banner?: string;
    category: string[];
};

export type AboutMeType = {
    name: string;
    email: string;
    location: string;
    phone_number: string;
    headline: string;
}

export type SkillType = {
    name: string;
    iconClass: string;
    experience: string;
    category: string;
}