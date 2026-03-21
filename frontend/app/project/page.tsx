import type { Metadata } from 'next';
import ProjectsClient from '@/components/ProjectsClient';
import { fetchProjects } from '@/app/api/projects';

export const metadata: Metadata = {
  title: 'Projects | Bayu Wicaksono',
  description: 'Portfolio of projects by Bayu Wicaksono',
};

export default async function ProjectsPage() {
  try {
    const projects = await fetchProjects();
    const recent = projects.slice(0, 3);

    return <ProjectsClient projects={projects} recent={recent} />;
  } catch (error) {
    console.error('Failed to load projects:', error);
    return (
      <div className="flex grow items-center justify-center bg-gray-900 text-white">
        <p>Failed to load projects. Please try again later.</p>
      </div>
    );
  }
}
