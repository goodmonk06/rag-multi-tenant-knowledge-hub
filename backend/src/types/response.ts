export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}
