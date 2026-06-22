import type { Metadata } from 'next';
import ResumeClient from '@/components/ResumeClient';

const title = 'Resume | Bayu Wicaksono';
const description =
  'Education, experience, certifications, and achievements of Bayu Wicaksono';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    siteName: 'Bayu Wicaksono',
    title,
    description,
    url: '/resume',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-default.png'],
  },
};

export default function ResumePage() {
  return <ResumeClient />;
}
