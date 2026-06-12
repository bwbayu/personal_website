import type { Metadata } from 'next';
import ProjectsClient from '@/components/ProjectsClient';

export const metadata: Metadata = {
  title: 'Projects | Bayu Wicaksono',
  description: 'Portfolio of projects by Bayu Wicaksono',
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
