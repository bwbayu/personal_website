// pages/loading.tsx
"use client"
import { useState, useEffect } from 'react';

const Loading: React.FC = () => {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === 3 ? 1 : prev + 1));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex grow flex-col items-center justify-center gap-10 bg-gray-900 px-10 dark:bg-gray-900">
      <div className="size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
      <p className="text-xl font-medium text-gray-300 dark:text-gray-300">
        Please wait{'.'.repeat(dots)}
      </p>
    </div>
  );
};

export default Loading;
