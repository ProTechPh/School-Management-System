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
} as const
