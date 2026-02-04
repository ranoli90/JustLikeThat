export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  
  if (error instanceof Error) {
    if (error.message === 'Network error' || error.name === 'TypeError') {
      return new AppError(
        'Unable to connect. Please check your internet connection.',
        'NETWORK_ERROR',
        'high'
      );
    }
  }
  
  return new AppError(
    'Something went wrong. Please try again.',
    'UNKNOWN_ERROR',
    'medium'
  );
};
