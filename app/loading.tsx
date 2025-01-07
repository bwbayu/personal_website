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
    <div className="flex flex-grow flex-col items-center justify-center px-10 dark:bg-gray-900 gap-10">
      <div className="loader w-12 h-12 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
      <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
        Please wait{'.'.repeat(dots)}
      </p>
    </div>
  );
};

export default Loading;
