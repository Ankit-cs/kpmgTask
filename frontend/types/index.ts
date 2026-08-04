export * from './error';

export interface ApiResponse<T = any> {
  data: T | null;
  error: import('./error').AppError | null;
  success: boolean;
}

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}
