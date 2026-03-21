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
};

if (config.nodeEnv === 'production' && !config.apiKey) {
  throw new Error('API_KEY environment variable is required in production');
}
