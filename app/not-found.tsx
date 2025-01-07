"use client"
import { useRouter } from 'next/navigation';

const NotFound: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex flex-grow flex-col items-center justify-center px-10 dark:bg-gray-900 gap-10">
      <h1 className="text-5xl font-bold text-gray-700 dark:text-gray-300">404</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Oops! The page you are looking for doesn&apos;t exist.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
      >
        Go Back Home
      </button>
    </div>
  );
};

export default NotFound;
