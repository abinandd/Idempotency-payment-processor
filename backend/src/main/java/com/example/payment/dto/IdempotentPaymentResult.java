package com.example.payment.dto;

/**
 * Outcome of an idempotent payment submission.
 *
 * @param response   the payment response to return to the caller
 * @param inProgress true when another request with the same key is still being processed
 */
public record IdempotentPaymentResult(PaymentResponse response, boolean inProgress) {
}
