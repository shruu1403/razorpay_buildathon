export interface FailureClassification {
  category: string;
  retryStrategy: string;
  retryDelayHours: number;
}

export function classifyFailure(
  errorCode: string = '',
  errorReason: string = ''
): FailureClassification {
  const code = (errorCode || '').toLowerCase();
  const reason = (errorReason || '').toLowerCase();

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

  // 5. Default/unknown
  return {
    category: 'other',
    retryStrategy: 'manual_review',
    retryDelayHours: 24,
  };
}
