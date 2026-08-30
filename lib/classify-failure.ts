export interface FailureClassification {
  category: string;
  retryStrategy: string;
  retryDelayHours: number;
}

export function classifyFailure(
  errorCode: string = '',
  errorReason: string = '',
  errorSource: string = ''
): FailureClassification {
  const code = (errorCode || '').toLowerCase();
  const reason = (errorReason || '').toLowerCase();
  const source = (errorSource || '').toLowerCase();

  // 1. Insufficient funds
  if (reason.includes('insufficient') || reason.includes('balance')) {
    return {
      category: 'insufficient_funds',
      retryStrategy: 'auto_retry_later',
      retryDelayHours: 72,
    };
  }

  // 2. Card expired
  if (reason.includes('expired') || code.includes('expired') || code.includes('expiry')) {
    return {
      category: 'card_expired',
      retryStrategy: 'request_update',
      retryDelayHours: 0,
    };
  }

  // 3. Payment method restricted
  if (
    reason.includes('international') ||
    reason.includes('not_allowed') ||
    reason.includes('restricted')
  ) {
    return {
      category: 'payment_method_restricted',
      retryStrategy: 'request_update',
      retryDelayHours: 0,
    };
  }

  // 4. Network glitch / gateway error
  if (
    code.toUpperCase().includes('GATEWAY_ERROR') ||
    reason.includes('timeout') ||
    reason.includes('network')
  ) {
    return {
      category: 'network_glitch',
      retryStrategy: 'auto_retry_soon',
      retryDelayHours: 2,
    };
  }

  // 5. Authentication failure (wrong OTP, 3DS cancelled)
  if (reason.includes('authentication_failed') || reason.includes('wrong_otp')) {
    return {
      category: 'authentication_failed',
      retryStrategy: 'auto_retry_soon',
      retryDelayHours: 1,
    };
  }

  // 6. Card declined by issuer
  if (reason.includes('card_declined') || reason.includes('declined')) {
    return {
      category: 'card_declined',
      retryStrategy: 'request_update',
      retryDelayHours: 0,
    };
  }

  // 7. Generic gateway/bank decline — transient, worth retrying
  if (reason === 'payment_failed' && (source === 'gateway' || source === 'bank')) {
    return {
      category: 'network_glitch',
      retryStrategy: 'auto_retry_soon',
      retryDelayHours: 2,
    };
  }

  // 8. Default/unknown
  return {
    category: 'other',
    retryStrategy: 'manual_review',
    retryDelayHours: 24,
  };
}
