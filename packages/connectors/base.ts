export interface ConnectorConfig {
  name: string
  version: string
  requiresAuth: boolean
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'error'
  message?: string
  lastChecked: Date
  details?: Record<string, any>
}

export interface ConnectorCredentials {
  [key: string]: any
}

export abstract class BaseConnector {
  protected config: ConnectorConfig
  protected credentials?: ConnectorCredentials

  constructor(config: ConnectorConfig) {
    this.config = config
  }

  abstract authenticate(credentials: ConnectorCredentials): Promise<void>
  abstract healthCheck(): Promise<HealthCheckResult>
  abstract disconnect(): Promise<void>

  getName(): string {
    return this.config.name
  }

  getVersion(): string {
    return this.config.version
  }

  isAuthenticated(): boolean {
    return !!this.credentials
  }

  protected async handleError(error: any, context: string): Promise<never> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`${this.config.name} - ${context}: ${errorMessage}`)
  }
}
