import { apiRequest } from './client';

export interface UserAuthData {
  id: string;
  phone: string;
  email?: string;
  fullName?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponseData {
  user: UserAuthData;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  async register(data: {
    fullName: string;
    phone: string;
    password: string;
    email?: string;
  }): Promise<AuthResponseData> {
    return apiRequest<AuthResponseData>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: {
    identifier?: string;
    phone?: string;
    email?: string;
    password: string;
  }): Promise<AuthResponseData> {
    return apiRequest<AuthResponseData>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<UserAuthData> {
    return apiRequest<UserAuthData>('/api/v1/auth/me');
  },
};
