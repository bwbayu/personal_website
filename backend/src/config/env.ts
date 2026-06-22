export const config = {
  port: (() => {
    const p = parseInt(process.env.PORT ?? '3001', 10);
    if (isNaN(p) || p < 1 || p > 65535) throw new Error('PORT must be between 1 and 65535');
    return p;
  })(),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiKey: process.env.API_KEY,
  allowedOrigins: (process.env.ALLOWED_ORIGINS?.split(',') ?? []).map(s => s.trim()).filter(Boolean),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
  // Comma-separated admin allowlist; lowercased so token email matching is case-insensitive.
  adminEmails: (process.env.ADMIN_EMAILS?.split(',') ?? [])
    .map(s => s.trim().toLowerCase())
    .filter(Boolean),
  // Used by the Firebase Admin SDK to set the verifyIdToken audience; ADC supplies it in prod.
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
  // GitHub workflow_dispatch config for the rebuild endpoint. Token + repo are
  // optional: when unset the /api/rebuild endpoint returns 503 rather than throwing
  // at boot, so the API still runs without rebuild configured.
  githubDispatchToken: process.env.GITHUB_DISPATCH_TOKEN,
  githubRepo: process.env.GITHUB_REPO,
  githubWorkflowFile: process.env.GITHUB_WORKFLOW_FILE ?? 'frontend-deploy.yml',
  githubWorkflowRef: process.env.GITHUB_WORKFLOW_REF ?? 'main',
};

if (config.nodeEnv === 'production' && !config.apiKey) {
  throw new Error('API_KEY environment variable is required in production');
}

if (config.nodeEnv === 'production' && config.adminEmails.length === 0) {
  throw new Error('ADMIN_EMAILS environment variable is required in production');
}
