/**
 * Custom API Error class for consistent error handling across API routes
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Creates a 400 Bad Request error
   */
  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code);
  }

  /**
   * Creates a 401 Unauthorized error
   */
  static unauthorized(message: string = '인증이 필요합니다.', code?: string): ApiError {
    return new ApiError(401, message, code);
  }

  /**
   * Creates a 403 Forbidden error
   */
  static forbidden(message: string = '권한이 없습니다.', code?: string): ApiError {
    return new ApiError(403, message, code);
  }

  /**
   * Creates a 404 Not Found error
   */
  static notFound(message: string = '리소스를 찾을 수 없습니다.', code?: string): ApiError {
    return new ApiError(404, message, code);
  }

  /**
   * Creates a 409 Conflict error
   */
  static conflict(message: string, code?: string): ApiError {
    return new ApiError(409, message, code);
  }

  /**
   * Creates a 500 Internal Server Error
   */
  static internal(message: string = '서버 오류가 발생했습니다.', code?: string): ApiError {
    return new ApiError(500, message, code);
  }

  /**
   * Converts error to JSON response format
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
