import cors from 'cors';
import express, { json } from 'express';
import morgan from 'morgan';

import { errorHandler } from './middleware/error';
import { publicLimiter } from './middleware/rateLimit';
import authRoutes from './modules/auth/auth.routes';
import envRoutes from './modules/environments/environments.routes';
import featureRoutes from './modules/features/features.routes';
import flagRoutes from './modules/flags/flags.routes';
import healthRoutes from './modules/health/health.routes';
import overrideRoutes from './modules/overrides/overrides.routes';
import userRoutes from './modules/users/users.routes';
import webhookRoutes from './modules/webhooks/webhook.routes';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(json());

app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/environments', envRoutes);
app.use('/features', featureRoutes);
app.use('/overrides', overrideRoutes);
app.use('/flags', flagRoutes);
app.use('/flags/evaluate', publicLimiter);
app.use('/webhooks', webhookRoutes);

app.use(errorHandler);

export default app;
