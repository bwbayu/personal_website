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
  // Controls whether the project appears on the public /project page. Curation only
  // (not a secrecy gate): the public list still includes hidden projects, but the
  // page filters them out before render.
  isShow: boolean;
}
