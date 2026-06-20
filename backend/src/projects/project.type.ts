export interface Project {
  id: string;
  name: string;
  date: string;
  description: string;
  technologies: string[];
  role: string[];
  category: string[];
  url?: string;
  githubUrl?: string;
  youtubeUrl?: string;
}
