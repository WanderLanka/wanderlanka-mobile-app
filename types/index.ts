export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
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
