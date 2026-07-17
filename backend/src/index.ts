import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import logger from '@/utils/logger';
import { SERVER_PORT } from '@/config/constants';
import { connectDatabase } from '@/config/database';
import routes from '@/routes';

const app = express();
const publicDir = path.join(__dirname, '..', 'public');

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:8000',
  'http://133.167.77.123',
  'http://133.167.77.123:5000',
  'https://app.kaniwaseika.com',
  'http://app.kaniwaseika.com',
]);

app.use(cors({
  origin(origin, callback) {
    // Same-origin / curl / server-to-server (no Origin header)
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kaniwa-purchasing',
    hasFrontend: fs.existsSync(path.join(publicDir, 'index.html')),
  });
});

app.use('/api', routes);

if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir, { index: false, maxAge: '1h' }));
  // SPA fallback — never steal /api/*
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  logger.info(`Serving frontend from ${publicDir}`);
} else {
  logger.warn(`No frontend build at ${publicDir} — API only`);
}

async function initializeServer() {
  try {
    await connectDatabase();
    app.listen(Number(SERVER_PORT), '0.0.0.0', () => {
      logger.info(`Server listening on 0.0.0.0:${SERVER_PORT}`);
      logger.info(`Health: http://127.0.0.1:${SERVER_PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();
