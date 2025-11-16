// Debug utility for customer service platform

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: any
}

class DebugLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isEnabled = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

  log(level: LogLevel, category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    }

    this.logs.push(entry)

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with colors
    if (this.isEnabled) {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        success: '✅',
        debug: '🔍'
      }[level]

      const color = {
        info: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',    // Yellow
        error: '\x1b[31m',   // Red
        success: '\x1b[32m', // Green
        debug: '\x1b[35m'    // Magenta
      }[level]

      const reset = '\x1b[0m'

      console.log(`${emoji} ${color}[${category}]${reset} ${message}`, data || '')
    }

    // Store in localStorage for client-side debugging
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('debug_logs') || '[]')
        stored.push(entry)
        // Keep last 500 logs in localStorage
        const trimmed = stored.slice(-500)
        localStorage.setItem('debug_logs', JSON.stringify(trimmed))
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data)
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data)
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data)
  }

  success(category: string, message: string, data?: any) {
    this.log('success', category, message, data)
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data)
  }

  getLogs(): LogEntry[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug_logs')
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Time a function execution
  async time<T>(category: string, label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    this.debug(category, `⏱️ Starting: ${label}`)

    try {
      const result = await fn()
      const duration = Date.now() - start
      this.success(category, `⏱️ Completed: ${label} (${duration}ms)`)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(category, `⏱️ Failed: ${label} (${duration}ms)`, error)
      throw error
    }
  }
}

export const logger = new DebugLogger()

// Category-specific loggers
export const gmailLogger = {
  info: (msg: string, data?: any) => logger.info('Gmail', msg, data),
  warn: (msg: string, data?: any) => logger.warn('Gmail', msg, data),
  error: (msg: string, data?: any) => logger.error('Gmail', msg, data),
  success: (msg: string, data?: any) => logger.success('Gmail', msg, data),
  debug: (msg: string, data?: any) => logger.debug('Gmail', msg, data),
}

export const aiLogger = {
  info: (msg: string, data?: any) => logger.info('AI', msg, data),
  warn: (msg: string, data?: any) => logger.warn('AI', msg, data),
  error: (msg: string, data?: any) => logger.error('AI', msg, data),
  success: (msg: string, data?: any) => logger.success('AI', msg, data),
  debug: (msg: string, data?: any) => logger.debug('AI', msg, data),
}

export const shopifyLogger = {
  info: (msg: string, data?: any) => logger.info('Shopify', msg, data),
  warn: (msg: string, data?: any) => logger.warn('Shopify', msg, data),
  error: (msg: string, data?: any) => logger.error('Shopify', msg, data),
  success: (msg: string, data?: any) => logger.success('Shopify', msg, data),
  debug: (msg: string, data?: any) => logger.debug('Shopify', msg, data),
}

export const shipstationLogger = {
  info: (msg: string, data?: any) => logger.info('ShipStation', msg, data),
  warn: (msg: string, data?: any) => logger.warn('ShipStation', msg, data),
  error: (msg: string, data?: any) => logger.error('ShipStation', msg, data),
  success: (msg: string, data?: any) => logger.success('ShipStation', msg, data),
  debug: (msg: string, data?: any) => logger.debug('ShipStation', msg, data),
}

export const bulkReplyLogger = {
  info: (msg: string, data?: any) => logger.info('BulkReply', msg, data),
  warn: (msg: string, data?: any) => logger.warn('BulkReply', msg, data),
  error: (msg: string, data?: any) => logger.error('BulkReply', msg, data),
  success: (msg: string, data?: any) => logger.success('BulkReply', msg, data),
  debug: (msg: string, data?: any) => logger.debug('BulkReply', msg, data),
}
