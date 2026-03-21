import HomeClient from '@/components/HomeClient';
import { fetchAbout } from '@/app/api/about';
import { fetchSkills } from '@/app/api/skills';

export default async function Home() {
  try {
    const [aboutMe, skills] = await Promise.all([
      fetchAbout(),
      fetchSkills(),
    ]);

    const visibleSkills = skills.filter((s) => s.isShow);

    return <HomeClient aboutMe={aboutMe} skills={visibleSkills} />;
  } catch (error) {
    console.error('Failed to load home content:', error);
    return (
      <div className="flex grow items-center justify-center bg-gray-900 text-white">
        <p>Failed to load content. Please try again later.</p>
      </div>
    );
  }
}
