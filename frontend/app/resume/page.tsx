import type { Metadata } from 'next';
import ResumeClient from '@/components/ResumeClient';
import { fetchResume } from '@/app/api/resume';

export const metadata: Metadata = {
  title: 'Resume | Bayu Wicaksono',
  description: 'Education, experience, certifications, and achievements of Bayu Wicaksono',
};

export default async function ResumePage() {
  try {
    const { educations, experiences, certifications, achievements } =
      await fetchResume();

    return (
      <ResumeClient
        educations={educations}
        experiences={experiences}
        certifications={certifications}
        achievements={achievements}
      />
    );
  } catch (error) {
    console.error('Failed to load resume:', error);
    return (
      <div className="flex grow items-center justify-center bg-gray-900 text-white">
        <p>Failed to load resume. Please try again later.</p>
      </div>
    );
  }
}
