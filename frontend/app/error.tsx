'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-900 px-10">
      <h2 className="text-3xl font-bold text-gray-300">Something went wrong</h2>
      <p className="text-lg text-gray-400">An unexpected error occurred.</p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
      >
        Try again
      </button>
    </div>
  );
}
