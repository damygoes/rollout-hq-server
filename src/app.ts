import cors from 'cors';
import express, { json } from 'express';
import morgan from 'morgan';

import { errorHandler } from './middleware/error';
import authRoutes from './modules/auth/auth.routes';
import envRoutes from './modules/environments/environments.routes';
import featureRoutes from './modules/features/features.routes';
import flagRoutes from './modules/flags/flags.routes';
import overrideRoutes from './modules/overrides/overrides.routes';
import userRoutes from './modules/users/users.routes';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/environments', envRoutes);
app.use('/features', featureRoutes);
app.use('/overrides', overrideRoutes);
app.use('/flags', flagRoutes);

app.use(errorHandler);

export default app;
