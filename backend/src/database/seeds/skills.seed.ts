import { Skill, SkillCategory } from '../../skills/skill.type';
import { toSlug } from '../../utils/slug.util';

type RawSkill = {
  name: string;
  iconClass?: string;
  iconImage?: string;
  experience: string;
  category: string;
  isShow: boolean;
};

const raw: RawSkill[] = [
  // --- Shown skills (isShow: true) ---
  { name: 'Python',                       iconClass: 'devicon-python-plain colored text-3xl',                     experience: '1+ years',      category: 'Programming Languages',                    isShow: true },
  { name: 'JavaScript',                   iconClass: 'devicon-javascript-plain colored text-3xl',                 experience: '1+ years',      category: 'Programming Languages',                    isShow: true },
  { name: 'TypeScript',                   iconClass: 'devicon-typescript-plain colored text-3xl',                 experience: '<1 years',      category: 'Programming Languages',                    isShow: true },
  { name: 'Numpy',                        iconClass: 'devicon-numpy-plain colored text-3xl',                      experience: '<1 years',      category: 'Data/AI Framework & Libraries',            isShow: true },
  { name: 'PyTorch',                      iconClass: 'devicon-pytorch-original colored text-3xl',                 experience: '<1 years',      category: 'Data/AI Framework & Libraries',            isShow: true },
  { name: 'Pandas',                       iconClass: 'devicon-pandas-plain colored text-3xl',                     experience: '<1 years',      category: 'Data/AI Framework & Libraries',            isShow: true },
  { name: 'Scikit-Learn',                 iconClass: 'devicon-scikitlearn-plain colored text-3xl',                experience: '<1 years',      category: 'Data/AI Framework & Libraries',            isShow: true },
  { name: 'Amazon Web Services (AWS)',    iconClass: 'devicon-amazonwebservices-plain-wordmark colored text-3xl', experience: '<1 years',      category: 'Cloud Platforms',                          isShow: true },
  { name: 'Google Cloud Platform (GCP)', iconClass: 'devicon-googlecloud-plain colored text-3xl',                experience: '<1 years',      category: 'Cloud Platforms',                          isShow: true },
  { name: 'FastAPI',                      iconClass: 'devicon-fastapi-plain colored text-3xl',                    experience: '1+ years',      category: 'Web/Cross Platform Framework & Libraries', isShow: true },
  { name: 'Flask',                        iconClass: 'devicon-flask-original colored text-3xl',                   experience: '1+ years',      category: 'Web/Cross Platform Framework & Libraries', isShow: true },
  { name: 'React',                        iconClass: 'devicon-react-original colored text-3xl',                   experience: '<1 years',      category: 'Web/Cross Platform Framework & Libraries', isShow: true },
  { name: 'Node.js',                      iconClass: 'devicon-nodejs-plain-wordmark colored text-3xl',            experience: '1+ years',      category: 'Web/Cross Platform Framework & Libraries', isShow: true },
  { name: 'Tailwind CSS',                 iconClass: 'devicon-tailwindcss-original colored text-3xl',             experience: '<1 years',      category: 'Web/Cross Platform Framework & Libraries', isShow: true },
  { name: 'Docker',                       iconClass: 'devicon-docker-plain colored text-3xl',                     experience: '1+ years',      category: 'DevOps Tools',                             isShow: true },
  { name: 'Kubernetes',                   iconClass: 'devicon-kubernetes-plain colored text-3xl',                 experience: 'Just Familiar', category: 'DevOps Tools',                             isShow: true },
  { name: 'Jenkins',                      iconClass: 'devicon-jenkins-plain colored text-3xl',                    experience: 'Just Familiar', category: 'DevOps Tools',                             isShow: true },
  { name: 'Prometheus',                   iconClass: 'devicon-prometheus-original colored text-3xl',              experience: 'Just Familiar', category: 'DevOps Tools',                             isShow: true },
  { name: 'Grafana',                      iconClass: 'devicon-grafana-plain colored text-3xl',                    experience: 'Just Familiar', category: 'DevOps Tools',                             isShow: true },
  // "Version Control" is not in SkillCategory — mapped to DevOps Tools
  { name: 'Git',                          iconClass: 'devicon-git-plain colored text-3xl',                        experience: '2+ years',      category: 'DevOps Tools',                             isShow: true },
  { name: 'MySQL',                        iconClass: 'devicon-mysql-original colored text-3xl',                   experience: '2+ years',      category: 'Databases',                                isShow: true },
  { name: 'PostgreSQL',                   iconClass: 'devicon-postgresql-plain colored text-3xl',                 experience: '<1 years',      category: 'Databases',                                isShow: true },
  { name: 'MongoDB',                      iconClass: 'devicon-mongodb-plain colored text-3xl',                    experience: '<1 years',      category: 'Databases',                                isShow: true },

  // --- Extra project-only skills (isShow: false) ---
  { name: 'Redis',      iconClass: 'devicon-redis-plain colored text-3xl',      experience: 'Just Familiar', category: 'Databases',                                isShow: false },
  { name: 'Streamlit',  iconClass: 'devicon-streamlit-plain colored text-3xl',  experience: 'Just Familiar', category: 'Web/Cross Platform Framework & Libraries', isShow: false },
  { name: 'SQLite',     iconClass: 'devicon-sqlite-plain colored text-3xl',     experience: 'Just Familiar', category: 'Databases',                                isShow: false },
  { name: 'Flutter',    iconClass: 'devicon-flutter-plain colored text-3xl',    experience: 'Just Familiar', category: 'Web/Cross Platform Framework & Libraries', isShow: false },
  { name: 'PHP',        iconClass: 'devicon-php-plain colored text-3xl',        experience: 'Just Familiar', category: 'Programming Languages',                    isShow: false },
  { name: 'Laravel',    iconClass: 'devicon-laravel-original colored text-3xl', experience: 'Just Familiar', category: 'Web/Cross Platform Framework & Libraries', isShow: false },
  { name: 'Cognee',     iconImage: '/icons/skills/cognee.jpeg',     experience: 'Just Familiar', category: 'Data/AI Framework & Libraries',            isShow: false },
  { name: 'Qdrant',     iconImage: '/icons/skills/qdrant.webp',     experience: 'Just Familiar', category: 'Databases',                                isShow: false },
  { name: 'TwelveLabs', iconImage: '/icons/skills/twelvelabs.jpg',  experience: 'Just Familiar', category: 'Data/AI Framework & Libraries',            isShow: false },
  { name: 'CrewAI',     iconImage: '/icons/skills/crewai.jpg',      experience: 'Just Familiar', category: 'Data/AI Framework & Libraries',            isShow: false },
  { name: 'Gradio',     iconImage: '/icons/skills/gradio.jpg',      experience: 'Just Familiar', category: 'Web/Cross Platform Framework & Libraries', isShow: false },
  { name: 'LangChain',  iconImage: '/icons/skills/langchain.png',   experience: 'Just Familiar', category: 'Data/AI Framework & Libraries',            isShow: false },
  { name: 'Pinecone',   iconImage: '/icons/skills/pinecone.png',    experience: 'Just Familiar', category: 'Databases',                                isShow: false },
];

export const skillsSeed: Skill[] = raw.map(s => ({
  id:          toSlug(s.name),
  name:        s.name,
  ...(s.iconClass  ? { iconClass:  s.iconClass  } : {}),
  ...(s.iconImage  ? { iconImage:  s.iconImage  } : {}),
  category:    s.category as SkillCategory,
  proficiency: s.experience,
  isShow:      s.isShow,
}));
