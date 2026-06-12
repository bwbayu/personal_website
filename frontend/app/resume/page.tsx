import type { Metadata } from 'next';
import ResumeClient from '@/components/ResumeClient';

export const metadata: Metadata = {
  title: 'Resume | Bayu Wicaksono',
  description: 'Education, experience, certifications, and achievements of Bayu Wicaksono',
};

export default function ResumePage() {
  return <ResumeClient />;
}
