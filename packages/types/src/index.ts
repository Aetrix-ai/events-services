export interface Credentials {
  username: string;
  password: string;
  email?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Made with Bob
