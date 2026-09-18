import { apiRequest } from './client';

export interface HealthCheckData {
  status: string;
  platform: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    engine: string;
    connected: boolean;
    latencyMs?: number;
    error?: string;
  };
  environment: string;
}

export interface PaymentGatewayStatus {
  providerName: string;
  isConfigured: boolean;
  currency: string;
  statusDescription: string;
}

export const healthService = {
  async checkHealth(): Promise<HealthCheckData> {
    return apiRequest<HealthCheckData>('/api/v1/health');
  },

  async getPaymentGatewayStatus(): Promise<PaymentGatewayStatus> {
    return apiRequest<PaymentGatewayStatus>('/api/v1/payments/status');
  },
};
