/**
 * Application Configuration
 * Centralizes all environment variable access with validation
 */

// Server Configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5177',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim()),

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@noteflow.app',
    isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  },

  // Password Reset
  resetTokenExpiry: parseInt(process.env.RESET_TOKEN_EXPIRY || '3600000', 10), // 1 hour default
} as const;

// Validate required configuration in production
export function validateConfig(): void {
  const warnings: string[] = [];

  if (config.isProd) {
    if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
      warnings.push('JWT_SECRET is using default value. Please set a secure secret!');
    }
    if (!config.email.isConfigured) {
      warnings.push('Email is not configured. Password reset will not work.');
    }
    if (config.databaseUrl.startsWith('file:')) {
      warnings.push('Using SQLite database. Consider PostgreSQL for production.');
    }
  }

  warnings.forEach(warning => console.warn(`⚠️  Warning: ${warning}`));
}

export default config;
