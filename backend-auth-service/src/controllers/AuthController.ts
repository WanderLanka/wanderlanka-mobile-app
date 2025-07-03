import {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  JWTPayload,
  LoginRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  SignUpRequest,
  UserPublic
} from '../types';
import { Request, Response } from 'express';
import { validateRequest, validationSchemas } from '../utils/validation';

import { JWTUtils } from '../utils/jwt';
import { User } from '../models/User';

export class AuthController {
  /**
   * Sign up a new user
   */
  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      // Validate request data
      const validatedData = validateRequest(validationSchemas.signUp, req.body) as SignUpRequest;
      const { username, email, password, role } = validatedData;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        const response: AuthResponse = {
          success: false,
          message: 'User already exists with this email or username',
          error: 'USER_ALREADY_EXISTS',
        };
        res.status(400).json(response);
        return;
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        role,
        emailVerificationToken: JWTUtils.generateRandomToken(),
      });

      await user.save();

      // Generate tokens
      const jwtPayload: JWTPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(jwtPayload);

      // Add refresh token to user
      user.addRefreshToken(refreshToken);
      await user.save();

      const response: AuthResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          user: user.toJSON() as UserPublic,
          accessToken,
          refreshToken,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Sign up error:', error);
      const response: AuthResponse = {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request data
      const validatedData = validateRequest(validationSchemas.login, req.body) as LoginRequest;
      const { identifier, password } = validatedData;

      // Find user by email or username
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        const response: AuthResponse = {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS',
        };
        res.status(401).json(response);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        const response: AuthResponse = {
          success: false,
          message: 'Account is deactivated',
          error: 'ACCOUNT_DEACTIVATED',
        };
        res.status(401).json(response);
        return;
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        const response: AuthResponse = {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS',
        };
        res.status(401).json(response);
        return;
      }

      // Generate tokens
      const jwtPayload: JWTPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(jwtPayload);

      // Add refresh token to user
      user.addRefreshToken(refreshToken);
      await user.save();

      const response: AuthResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON() as UserPublic,
          accessToken,
          refreshToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      const response: AuthResponse = {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request data
      const validatedData = validateRequest(validationSchemas.refreshToken, req.body) as RefreshTokenRequest;
      const { refreshToken } = validatedData;

      // Verify refresh token
      const payload = JWTUtils.verifyRefreshToken(refreshToken);

      // Find user and check if refresh token exists
      const user = await User.findById(payload.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        const response: AuthResponse = {
          success: false,
          message: 'Invalid refresh token',
          error: 'INVALID_REFRESH_TOKEN',
        };
        res.status(401).json(response);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        const response: AuthResponse = {
          success: false,
          message: 'Account is deactivated',
          error: 'ACCOUNT_DEACTIVATED',
        };
        res.status(401).json(response);
        return;
      }

      // Generate new tokens
      const jwtPayload: JWTPayload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken: newRefreshToken } = JWTUtils.generateTokenPair(jwtPayload);

      // Replace old refresh token with new one
      user.removeRefreshToken(refreshToken);
      user.addRefreshToken(newRefreshToken);
      await user.save();

      const response: AuthResponse = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user.toJSON() as UserPublic,
          accessToken,
          refreshToken: newRefreshToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Refresh token error:', error);
      const response: AuthResponse = {
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(401).json(response);
    }
  }

  /**
   * Logout user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtils.extractTokenFromHeader(authHeader || '');

      if (!token) {
        const response: AuthResponse = {
          success: false,
          message: 'No token provided',
          error: 'NO_TOKEN',
        };
        res.status(401).json(response);
        return;
      }

      // Verify token and get user
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (user) {
        // Remove refresh token if provided
        const { refreshToken } = req.body;
        if (refreshToken) {
          user.removeRefreshToken(refreshToken);
          await user.save();
        }
      }

      const response: AuthResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Logout error:', error);
      const response: AuthResponse = {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTUtils.extractTokenFromHeader(authHeader || '');

      if (!token) {
        const response: AuthResponse = {
          success: false,
          message: 'No token provided',
          error: 'NO_TOKEN',
        };
        res.status(401).json(response);
        return;
      }

      // Verify token and get user
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (!user) {
        const response: AuthResponse = {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        };
        res.status(404).json(response);
        return;
      }

      const response: AuthResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toJSON() as UserPublic,
          accessToken: token,
          refreshToken: '', // Don't expose refresh token
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Get profile error:', error);
      const response: AuthResponse = {
        success: false,
        message: 'Failed to retrieve profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      res.status(500).json(response);
    }
  }
}
