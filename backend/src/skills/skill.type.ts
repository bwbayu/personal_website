export type SkillCategory = 'Programming Languages' | 'Web/Cross Platform Framework & Libraries' | 'DevOps Tools' | 'Databases' | 'Cloud Platforms' | 'Data/AI Framework & Libraries';

export interface Skill {
  id: string;
  name: string;
  iconClass?: string;
  iconImage?: string;
  category: SkillCategory;
  proficiency: string; // 1 year, 1+ years, etc
  isShow: boolean;
}
