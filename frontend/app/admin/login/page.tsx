"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Once signed in, leave the login page for the admin home.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <button
        type="button"
        onClick={handleSignIn}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Sign in with Google
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
