import 'server-only'

/**
 * 集中式 API 错误处理器
 * Centralized API error handler to prevent information disclosure
 * 
 * SECURITY: Never expose raw error messages to clients.
 * Log full details server-side for debugging.
 */

type ErrorContext = {
  endpoint?: string
  userId?: string
  action?: string
}

/**
 * 处理 API 错误并返回安全的响应
 * Handles API errors and returns a safe response without leaking internal details.
 */
export function handleApiError(
  error: unknown, 
  context?: ErrorContext | string
): Response {
  // 服务器端记录完整错误信息
  const contextStr = typeof context === 'string' 
    ? context 
    : context?.endpoint || 'unknown'
  
  console.error(`[API Error] [${contextStr}]`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context: typeof context === 'object' ? context : undefined,
    timestamp: new Date().toISOString(),
  })

  // 返回通用错误消息给客户端
  return Response.json(
    { error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  )
}

/**
 * 创建带有特定状态码的错误响应
 * Creates an error response with a specific status code.
 */
export function apiError(
  message: string, 
  status: number = 400
): Response {
  return Response.json({ error: message }, { status })
}

/**
 * 常用错误响应
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => apiError("Unauthorized", 401),
  forbidden: () => apiError("Forbidden", 403),
  notFound: (resource = "Resource") => apiError(`${resource} not found`, 404),
  badRequest: (message = "Invalid request") => apiError(message, 400),
  rateLimited: () => apiError("Too many requests. Please wait.", 429),
  invalidOrigin: () => apiError("Invalid Origin", 403),
  validationError: (message: string) => apiError(`Validation error: ${message}`, 422),
  conflict: (message = "Resource conflict") => apiError(message, 409),
  serviceUnavailable: () => apiError("Service temporarily unavailable", 503),
} as const

/**
 * Validates pagination parameters
 */
export function validatePagination(page: string | null, pageSize: string | null) {
  const parsedPage = parseInt(page || '1')
  const parsedPageSize = parseInt(pageSize || '50')
  
  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new Error('Invalid page number')
  }
  
  if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
    throw new Error('Invalid page size (must be between 1 and 100)')
  }
  
  return {
    page: parsedPage,
    pageSize: parsedPageSize,
    from: (parsedPage - 1) * parsedPageSize,
    to: (parsedPage - 1) * parsedPageSize + parsedPageSize - 1
  }
}

/**
 * Sanitizes search input to prevent SQL injection
 */
export function sanitizeSearchInput(input: string | null, maxLength = 100): string {
  if (!input) return ''
  
  // Trim and limit length
  const trimmed = input.trim().slice(0, maxLength)
  
  // Escape special ILIKE characters
  return trimmed.replace(/[%_]/g, '\\$&')
}
