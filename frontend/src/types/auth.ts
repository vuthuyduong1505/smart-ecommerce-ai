export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_STAFF';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING_VERIFY';

export interface UserAddress {
  id?: string;
  receiverName: string;
  phoneNumber: string;
  street: string;
  ward?: string;
  district?: string;
  province?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  addresses?: UserAddress[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
