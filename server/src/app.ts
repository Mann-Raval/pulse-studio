import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = () => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsers
  app.use(express.json());
  app.use(cookieParser(config.COOKIE_SECRET));

  // Root welcome endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'Pulse Studio API',
      status: 'running',
      documentation: 'See /api/health for health check',
      frontend: 'https://pulse-studio-olive.vercel.app',
    });
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // 404 handler with structured response
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Global structured error handling middleware
  app.use(errorHandler);

  return app;
};
