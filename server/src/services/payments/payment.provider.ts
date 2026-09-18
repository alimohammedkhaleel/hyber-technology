/**
 * Payment Provider Abstraction Layer
 * 
 * Allows seamless plugging of Paymob (or alternate gateways)
 * without modifying domain payment services or controller logic.
 */

export interface PaymentInitiationRequest {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    fullName: string;
    email?: string;
    phone: string;
  };
  billingAddress?: {
    street: string;
    building?: string;
    city: string;
    country?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentInitiationResult {
  paymentId: string;
  provider: string;
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED';
  redirectUrl?: string;
  iframeUrl?: string;
  providerOrderId?: string;
  providerTransactionId?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  providerTransactionId: string;
  amount: number;
  status: 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt?: Date;
  rawResponse?: any;
}

export interface IPaymentProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResult>;
  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>;
  handleCallback(payload: any, signature?: string): Promise<{ isValid: boolean; data: any }>;
  refundPayment(transactionId: string, amount: number, reason: string): Promise<{ refundId: string; success: boolean }>;
}
