import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from '@/utils/logger';
import { SERVER_PORT } from '@/config/constants';
import { connectDatabase } from '@/config/database';
import routes from '@/routes';

const app = express();

app.use(cookieParser());

// Middleware to parse JSON (seal image is stored as base64 in settings)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration (restrict to specific domains for production)
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://192.168.121.140:8080',
    'http://192.168.123.120:8080',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400,
};

app.use(cors(corsOptions));

// API routes
app.use('/api', routes);

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Redirect all routes to frontend (SPA support)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function initializeServer() {
    try {
        // Connect to database
        await connectDatabase();
        logger.info('Database connected successfully');
        
        // Start server
        app.listen(SERVER_PORT, () => {
          logger.info(`Server is running at http://localhost:${SERVER_PORT}`);
        });
    } catch (error) {
        logger.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

// Start the server
initializeServer();
