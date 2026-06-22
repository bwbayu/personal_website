import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

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

export default function Home() {
  return <HomeClient />;
}
