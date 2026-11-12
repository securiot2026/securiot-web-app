export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface MessageResponse {
  message?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
