export interface LoginRequest {
  login: string;
  password: string;
  // role: 'admin';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}