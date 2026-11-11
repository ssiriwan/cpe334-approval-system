import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
