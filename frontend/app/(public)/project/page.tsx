import type { Metadata } from 'next';
import ProjectsClient from '@/components/ProjectsClient';
import { getProjects, getSkills } from '@/lib/public/content';

const title = 'Projects | Bayu Wicaksono';
const description = 'Portfolio of projects by Bayu Wicaksono';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    siteName: 'Bayu Wicaksono',
    title,
    description,
    url: '/project',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-default.png'],
  },
};

export default async function ProjectsPage() {
  const [projects, skills] = await Promise.all([getProjects(), getSkills()]);
  // Filter at the server boundary so hidden projects are never serialized into the
  // static HTML/client payload. `!== false` keeps legacy docs missing the field.
  const visibleProjects = projects.filter((project) => project.isShow !== false);
  return <ProjectsClient projects={visibleProjects} skills={skills} />;
}
