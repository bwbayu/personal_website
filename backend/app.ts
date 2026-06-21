import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import router from './src/routes/index';
import { notFoundMiddleware } from './src/middlewares/notFound.middleware';
import { errorMiddleware } from './src/middlewares/error.middleware';
import swaggerSpec from './src/config/swagger';
import { config } from './src/config/env';
import { db } from './src/config/firestore';

const app = express();

// Behind Cloud Run's load balancer the real client IP arrives via X-Forwarded-For;
// trust exactly one proxy hop so the rate limiters key on the client IP (per-IP),
// not the shared proxy address. A fixed hop count (not `true`) avoids X-Forwarded-For
// spoofing.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.allowedOrigins.length ? config.allowedOrigins : false }));
app.use(logger(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '64kb' }));

const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

app.use('/api', readLimiter);
app.use('/api', (req, res, next) => {
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) return writeLimiter(req, res, next);
  next();
});
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  }
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await db.collection('about').limit(1).get();
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});

if (config.nodeEnv !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/api', router);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
