import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import { prisma } from './services/database.js';
import config, { validateConfig } from './config/index.js';

// Validate configuration on startup
validateConfig();

const app = express();

// Middleware - CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json());

// Rate limiting
const createRateLimiter = (max: number) => rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
app.use('/api/', createRateLimiter(config.rateLimit.max));

// Stricter rate limiting for auth endpoints
const authLimiter = createRateLimiter(config.rateLimit.authMax);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'NoteFlow API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', notesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't leak error details in production
  const message = config.isProd
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(500).json({
    success: false,
    error: message,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const server = app.listen(config.port, () => {
  console.log('========================================');
  console.log('🚀 NoteFlow API Server Started');
  console.log('========================================');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server: http://${config.host}:${config.port}`);
  console.log(`Health: http://${config.host}:${config.port}/api/health`);
  console.log(`Frontend: ${config.frontendUrl}`);
  console.log('========================================');
});

export default server;
