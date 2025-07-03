import { Document } from 'mongoose';

// User roles
export type UserRole = 'traveller' | 'guide';

// User interface for database
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Authentication request interfaces
export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  identifier: string; // username or email
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserPublic;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// API Error interface
export interface APIError {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}
