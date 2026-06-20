// Vitest global setup — runs before any test module is evaluated, so the
// import-time env reads in `src/config/env.ts` (API_KEY) and the Firestore SDK
// (project id) see these values.
//
// Defaults are only applied when unset, so `firebase emulators:exec --project
// demo-test` (which injects GCLOUD_PROJECT) still wins in CI / the emulator run.

process.env.API_KEY ??= 'test-api-key';
process.env.GCLOUD_PROJECT ??= 'demo-test';
process.env.GOOGLE_CLOUD_PROJECT ??= 'demo-test';
