"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { authedFetch } from "@/lib/authedFetch";

// Minimal admin home that proves the auth path end-to-end: a signed-in,
// allowlisted account can perform one authenticated write (skill PATCH) and the
// backend accepts it. This is throwaway UI; the reusable parts are the layout,
// the route guard, the auth context, and authedFetch.
export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [skillId, setSkillId] = useState("");
  const [order, setOrder] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Guard: bounce unauthenticated visitors to the login page.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <main className="flex flex-1 items-center justify-center px-4 py-16">Loading...</main>;
  }
  if (!user) {
    return null; // redirecting to /admin/login
  }

  const runProof = async () => {
    setResult(null);
    setBusy(true);
    try {
      const res = await authedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/skills/${skillId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        },
      );
      setResult(res.ok ? `Accepted (HTTP ${res.status})` : `Rejected (HTTP ${res.status})`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm">
        Signed in as <span className="font-medium">{user.email}</span>
      </p>

      <fieldset className="flex flex-col gap-3 rounded border border-gray-300 p-4">
        <legend className="px-1 text-sm font-medium">Authenticated write proof</legend>
        <label className="flex flex-col gap-1 text-sm">
          Skill id
          <input
            type="text"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            placeholder="typescript"
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Order
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={runProof}
          disabled={busy || skillId.length === 0}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Sending..." : "Send PATCH /api/skills/:id"}
        </button>
        {result && <p className="text-sm">{result}</p>}
      </fieldset>

      <button
        type="button"
        onClick={() => signOut()}
        className="self-start text-sm text-blue-600 hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}
