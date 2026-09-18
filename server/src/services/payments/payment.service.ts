import { IPaymentProvider, PaymentInitiationRequest } from './payment.provider';
import { PaymobProvider } from './paymob.provider';
import { query } from '../../config/database';
import { PaymentStatus } from '../../types/status';
import { AuditRepository } from '../../repositories/audit.repository';

export class PaymentService {
  private provider: IPaymentProvider;
  private auditRepo: AuditRepository;

  constructor(provider?: IPaymentProvider) {
    this.provider = provider || new PaymobProvider();
    this.auditRepo = new AuditRepository();
  }

  /**
   * Returns current gateway operational status
   */
  getGatewayStatus(): {
    providerName: string;
    isConfigured: boolean;
    currency: string;
    statusDescription: string;
  } {
    const isConfigured = this.provider.isConfigured();
    return {
      providerName: this.provider.providerName,
      isConfigured,
      currency: 'EGP',
      statusDescription: isConfigured
        ? 'بوابة الدفع Paymob مهيأة عبر متغيرات البيئة.'
        : 'تم بناء وتجهيز معمارية الدفع (Payment Provider Layer) بنجاح، وتنتظر بيانات اعتماد Paymob الحقيقية للربط الحي.',
    };
  }

  /**
   * Create an initiated payment record in the database
   */
  async createPaymentRecord(
    orderId: string,
    customerId: string,
    amount: number,
    paymentMethod: 'CARD' | 'WALLET' | 'KIOSK' | 'CASH_ON_DELIVERY'
  ): Promise<{ paymentId: string; status: PaymentStatus }> {
    const res = await query<{ id: string; status: PaymentStatus }>(
      `INSERT INTO payments (order_id, customer_id, provider, payment_method, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'EGP', 'PENDING')
       RETURNING id, status`,
      [orderId, customerId, this.provider.providerName, paymentMethod, amount]
    );

    const payment = res.rows[0];

    await this.auditRepo.log({
      actorId: customerId,
      action: 'PAYMENT_RECORD_CREATED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      metadata: { orderId, amount, paymentMethod },
    });

    return {
      paymentId: payment.id,
      status: payment.status,
    };
  }

  /**
   * Safe initiation wrapper
   */
  async processPaymentInitiation(request: PaymentInitiationRequest) {
    return this.provider.initiatePayment(request);
  }
}
