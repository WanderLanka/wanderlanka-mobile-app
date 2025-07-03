import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import { User } from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader || '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'NO_TOKEN',
      });
      return;
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token);

    // Check if user exists and is active
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN',
      });
      return;
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN',
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};
