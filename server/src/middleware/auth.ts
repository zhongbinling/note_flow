import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

// Alias for authMiddleware
export const authenticate = authMiddleware;

// Optional auth - doesn't fail if no token
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded) {
        req.userId = decoded.userId;
      }
    }
    next();
  } catch {
    next();
  }
}
