export interface ApiClientResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | {
    code: string;
    details?: any;
  };
  timestamp?: string;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  data?: any;

  constructor(message: string, code?: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

const TOKEN_KEY = 'nlp_auth_access_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const BASE_API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const BASE_API_PREFIX = '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let route = endpoint;
  if (!route.startsWith('/api/')) {
    route = route.startsWith('/') ? `${BASE_API_PREFIX}${route}` : `${BASE_API_PREFIX}/${route}`;
  }

  const cleanEndpoint = BASE_API_URL ? `${BASE_API_URL}${route}` : route;

  const response = await fetch(cleanEndpoint, {
    ...options,
    headers,
  });

  let json: ApiClientResponse<T>;
  try {
    json = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new ApiError('فشل الاتصال بالخادم', 'NETWORK_ERROR', response.status);
    }
    return {} as T;
  }

  if (!response.ok || !json.success) {
    const errorCode = typeof json.error === 'string' ? json.error : json.error?.code;
    const errorMessage = json.message || (typeof json.error === 'string' ? json.error : 'حدث خطأ أثناء معالجة الطلب.');
    throw new ApiError(errorMessage, errorCode, response.status, json.data);
  }

  return json.data as T;
}

interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

function buildUrlWithParams(url: string, params?: Record<string, any>): string {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
}

export const apiClient = {
  async get<T = any>(url: string, config?: RequestConfig): Promise<{ data: ApiClientResponse<T> }> {
    const fullUrl = buildUrlWithParams(url, config?.params);
    const data = await apiRequest<T>(fullUrl, { method: 'GET', headers: config?.headers });
    return { data: { success: true, data } };
  },

  async post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<{ data: ApiClientResponse<T> }> {
    const fullUrl = buildUrlWithParams(url, config?.params);
    const data = await apiRequest<T>(fullUrl, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: config?.headers,
    });
    return { data: { success: true, data } };
  },

  async put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<{ data: ApiClientResponse<T> }> {
    const fullUrl = buildUrlWithParams(url, config?.params);
    const data = await apiRequest<T>(fullUrl, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: config?.headers,
    });
    return { data: { success: true, data } };
  },

  async patch<T = any>(url: string, body?: any, config?: RequestConfig): Promise<{ data: ApiClientResponse<T> }> {
    const fullUrl = buildUrlWithParams(url, config?.params);
    const data = await apiRequest<T>(fullUrl, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: config?.headers,
    });
    return { data: { success: true, data } };
  },

  async delete<T = any>(url: string, config?: RequestConfig): Promise<{ data: ApiClientResponse<T> }> {
    const fullUrl = buildUrlWithParams(url, config?.params);
    const data = await apiRequest<T>(fullUrl, { method: 'DELETE', headers: config?.headers });
    return { data: { success: true, data } };
  },
};
