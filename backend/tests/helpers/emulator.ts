// Shared helpers for emulator-backed tests (*.emulator.test.ts). Used by the
// generic repository test (TH-3) and the skills endpoint smoke (TH-4).

const projectId = process.env.GCLOUD_PROJECT ?? 'demo-test';

/**
 * Wipe every document in the running Firestore emulator so tests don't bleed
 * state into each other. Uses the emulator's REST clear endpoint (no SDK).
 * No-op-safe: throws only on an unexpected (non-2xx) response.
 */
export const clearFirestore = async (): Promise<void> => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set; run via firebase emulators:exec');
  }
  const url = `http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to clear Firestore emulator: ${res.status} ${res.statusText}`);
  }
};

/** Header helper for write requests against the auth-gated routes. */
export const withApiKey = (): Record<string, string> => ({
  'x-api-key': process.env.API_KEY ?? 'test-api-key',
});
