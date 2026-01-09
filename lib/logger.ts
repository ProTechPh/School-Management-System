import 'server-only'

/**
 * Secure logging utility for production environments
 * Prevents sensitive data leakage in logs
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  userId?: string
  endpoint?: string
  action?: string
  [key: string]: any
}

/**
 * Sanitizes sensitive data from log context
 */
function sanitizeContext(context: LogContext): LogContext {
  const sanitized = { ...context }
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'sessionId']
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

/**
 * Structured logger that sanitizes sensitive information
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === 'test') return false
    if (process.env.NODE_ENV === 'development') return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? sanitizeContext(context) : {}
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedContext,
    })
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        } : String(error),
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }
}

export const logger = new Logger()

/**
 * Usage examples:
 * 
 * logger.info('User logged in', { userId: user.id, endpoint: '/api/auth/login' })
 * logger.error('Database query failed', error, { userId: user.id, query: 'SELECT...' })
 * logger.warn('Rate limit approaching', { userId: user.id, remaining: 2 })
 */
