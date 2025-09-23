import type { UserRole, Permission } from './types'

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPERADMIN: [
    'blog:read', 'blog:write', 'blog:publish', 'blog:delete',
    'integrations:read', 'integrations:manage',
    'onboarding:read', 'onboarding:edit',
    'mindmap:read', 'mindmap:write', 'mindmap:share',
    'users:read', 'users:invite', 'users:manage',
    'settings:read', 'settings:write',
    'audit:read'
  ],
  ADMIN: [
    'blog:read', 'blog:write', 'blog:publish', 'blog:delete',
    'integrations:read', 'integrations:manage',
    'onboarding:read', 'onboarding:edit',
    'mindmap:read', 'mindmap:write', 'mindmap:share',
    'users:read', 'users:invite',
    'settings:read', 'settings:write',
    'audit:read'
  ],
  STAFF: [
    'blog:read', 'blog:write',
    'integrations:read',
    'onboarding:read',
    'mindmap:read', 'mindmap:write',
    'users:read',
    'settings:read'
  ],
  VIEWER: [
    'blog:read',
    'integrations:read',
    'onboarding:read',
    'mindmap:read',
    'users:read'
  ]
}

// Domain allow-list for email validation
export const ALLOWED_DOMAINS = ['hemlockandoak.com']

// Superadmin email
export const SUPERADMIN_EMAIL = 'info@hemlockandoak.com'

// Invitation expiry (7 days in milliseconds)
export const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// API rate limits
export const RATE_LIMITS = {
  auth: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts
  },
  api: {
    window: 60 * 1000, // 1 minute
    max: 60 // 60 requests
  },
  webhooks: {
    window: 60 * 1000, // 1 minute
    max: 100 // 100 requests
  }
}

// Job queue names
export const QUEUE_NAMES = {
  email: 'email-queue',
  sync: 'sync-queue',
  webhooks: 'webhook-queue',
  exports: 'export-queue'
}

// Job retry configuration
export const JOB_RETRY_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000
  }
}

// TipTap editor block types
export const EDITOR_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'image',
  'gallery',
  'callout',
  'code',
  'quote',
  'table',
  'embed',
  'list',
  'divider'
]

// Shopify API configuration
export const SHOPIFY_API = {
  version: '2024-10',
  scopes: [
    'read_content',
    'write_content',
    'read_products',
    'read_orders',
    'read_customers'
  ]
}

// File upload configuration
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  imageMaxDimensions: {
    width: 4096,
    height: 4096
  }
}

// Session configuration
export const SESSION_CONFIG = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60 // 24 hours
}
