export interface PaymentRequest {
  customerId: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  status: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  message?: string;
  paymentId?: string;
  [key: string]: unknown;
}
