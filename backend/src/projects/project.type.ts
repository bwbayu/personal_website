type Tech = { name: string; iconClass?: string; iconImage?: string };

export interface Project {
  id: string;
  name: string;
  date: string;
  description: string;
  technologies: Tech[];
  role: string[];
  category: string[];
  url?: string;
  githubUrl?: string;
}
