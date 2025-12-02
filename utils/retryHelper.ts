export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'],
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isRetryableError = (error: unknown, config: RetryConfig): boolean => {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (!config.retryableErrors || config.retryableErrors.length === 0) {
    return true;
  }

  return config.retryableErrors.some((retryableError) =>
    errorMessage.includes(retryableError)
  );
};

export const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      console.log(
        `[RETRY] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} for ${operationName}`
      );
      
      const result = await operation();
      
      if (attempt > 0) {
        console.log(`[RETRY] ${operationName} succeeded after ${attempt} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `[RETRY] Attempt ${attempt + 1} failed for ${operationName}:`,
        error
      );

      if (attempt === retryConfig.maxRetries) {
        console.error(
          `[RETRY] All ${retryConfig.maxRetries + 1} attempts failed for ${operationName}`
        );
        break;
      }

      if (!isRetryableError(error, retryConfig)) {
        console.log(`[RETRY] Error is not retryable for ${operationName}`);
        break;
      }

      const backoffDelay = calculateBackoffDelay(attempt, retryConfig);
      console.log(
        `[RETRY] Waiting ${backoffDelay}ms before next attempt for ${operationName}`
      );
      await delay(backoffDelay);
    }
  }

  throw lastError;
}

export async function withRetryBatch<T>(
  operations: { fn: () => Promise<T>; name: string }[],
  config: Partial<RetryConfig> = {}
): Promise<{ success: boolean; result?: T; error?: unknown; name: string }[]> {
  const results = await Promise.allSettled(
    operations.map(async ({ fn, name }) => {
      const result = await withRetry(fn, name, config);
      return { name, result };
    })
  );

  return results.map((result, index) => {
    const { name } = operations[index];
    if (result.status === 'fulfilled') {
      return {
        success: true,
        result: result.value.result,
        name,
      };
    } else {
      return {
        success: false,
        error: result.reason,
        name,
      };
    }
  });
}
