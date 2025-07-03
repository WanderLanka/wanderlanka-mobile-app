// User roles
export type UserRole = 'traveller' | 'guide';

export interface User {
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

// Authentication interfaces
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
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
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

export interface Destination {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  category: string;
  rating: number;
  reviews: Review[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  user: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  description: string;
  destinations: Destination[];
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
