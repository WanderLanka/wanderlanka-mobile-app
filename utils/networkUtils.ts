/**
 * Network utility functions for handling connectivity and network errors
 */

export interface NetworkState {
  isConnected: boolean;
  connectionType?: string;
}

export interface NetworkError {
  type: 'NO_INTERNET' | 'SERVER_ERROR' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
  originalError?: Error;
}

/**
 * Check internet connectivity status
 */
export const checkInternetConnection = async (): Promise<NetworkState> => {
  try {
    // For React Native, we can use a simple fetch to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      return {
        isConnected: response.ok,
        connectionType: 'unknown'
      };
    } catch {
      clearTimeout(timeoutId);
      return {
        isConnected: false,
        connectionType: 'none'
      };
    }
  } catch {
    return {
      isConnected: false,
      connectionType: 'none'
    };
  }
};

/**
 * Classify network errors into different types
 */
export const classifyNetworkError = (error: Error): NetworkError => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network request failed') || message.includes('no internet')) {
    return {
      type: 'NO_INTERNET',
      message: 'No internet connection available. Please check your network settings.',
      originalError: error
    };
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return {
      type: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
      originalError: error
    };
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('502') || message.includes('503')) {
    return {
      type: 'SERVER_ERROR',
      message: 'Server error occurred. Please try again later.',
      originalError: error
    };
  }
  
  return {
    type: 'UNKNOWN',
    message: 'An unexpected error occurred. Please try again.',
    originalError: error
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      // Do not retry on explicitly non-retryable errors (e.g., auth/session)
      if ((lastError as any)?.noRetry) {
        break;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError!;
};

/**
 * Simple delay utility
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is a network-related error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = (error as Error).message?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('internet') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('aborted')
  );
};