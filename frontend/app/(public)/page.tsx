import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { getAbout, getSkills, getCategories } from '@/lib/public/content';

const title = 'Bayu Wicaksono - AI, Back-end & Cloud';
const description =
  'Personal portfolio of Bayu Wicaksono - exploring Artificial Intelligence, Back-end Development, and Cloud Computing.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: 'website',
    siteName: 'Bayu Wicaksono',
    title,
    description,
    url: '/',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-default.png'],
  },
};

export default async function Home() {
  const [about, skills, categories] = await Promise.all([
    getAbout(),
    getSkills(),
    getCategories(),
  ]);
  return <HomeClient about={about} skills={skills} categories={categories} />;
}
