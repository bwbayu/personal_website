import { auth } from "./firebase";

/**
 * Authenticated fetch for admin write calls. Attaches a fresh Firebase ID token
 * as an `Authorization: Bearer` header and defaults to `cache: 'no-store'` to
 * mirror the read fetchers. On a 401 it retries once with a force-refreshed
 * token to ride out clock skew / a just-expired token. Throws if no user is
 * signed in.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const doFetch = async (forceRefresh: boolean): Promise<Response> => {
    const token = await user.getIdToken(forceRefresh);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { cache: "no-store", ...init, headers });
  };

  const res = await doFetch(false);
  if (res.status === 401) {
    return doFetch(true);
  }
  return res;
}
