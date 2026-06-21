"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { authedFetch } from "@/lib/authedFetch";

// Probe target: a format-valid but non-existent project id. DELETE runs the write
// auth gate (validateId passes, then authMiddleware) WITHOUT mutating anything, since
// no document with this id exists. 401/403 => not authorized; any other status
// (expected 404 "Project not found") => authorized.
const PROBE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/projects/00000000-0000-0000-0000-000000000000`;

type Status = "checking" | "authorized" | "denied" | "error";

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-gray-600">
      {children}
    </main>
  );
}

/**
 * Wraps every authenticated /admin page. Flow:
 * - still loading auth state -> spinner text
 * - signed out -> redirect to /admin/login
 * - signed in -> run the one-shot probe (D4). On 401/403 sign the user out and show a
 *   clear "not authorized" message (no dashboard). On any other status render children.
 * A network/unexpected error shows a recoverable message rather than signing out.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  // Bounce signed-out visitors to login. Skip while showing the "denied" message,
  // since signOut() (below) clears the user and would otherwise trigger a redirect
  // that hides the message.
  useEffect(() => {
    if (!loading && !user && status !== "denied") {
      router.replace("/admin/login");
    }
  }, [user, loading, status, router]);

  // Run the probe once whenever a signed-in user becomes available.
  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    setStatus("checking");
    (async () => {
      try {
        const res = await authedFetch(PROBE_URL, { method: "DELETE" });
        if (!active) return;
        if (res.status === 401 || res.status === 403) {
          setStatus("denied");
          await signOut();
        } else {
          setStatus("authorized");
        }
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loading, signOut]);

  if (loading) {
    return <Centered>Loading...</Centered>;
  }

  if (status === "denied") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">You are not authorized</h1>
        <p className="text-sm text-gray-600">
          This account is not allowed to access the admin area. You have been signed out.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/admin/login")}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Back to sign in
        </button>
      </main>
    );
  }

  if (!user) {
    return null; // redirecting to /admin/login
  }

  if (status === "checking") {
    return <Centered>Checking admin access...</Centered>;
  }

  if (status === "error") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Could not verify admin access</h1>
        <p className="text-sm text-gray-600">
          Something went wrong while checking your access. Please try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </main>
    );
  }

  return <>{children}</>;
}
