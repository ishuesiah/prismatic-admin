// User roles
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'STAFF' | 'VIEWER'

// User status
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED' | 'SUSPENDED'

// Permissions
export type Permission = 
  | 'blog:read'
  | 'blog:write'
  | 'blog:publish'
  | 'blog:delete'
  | 'integrations:read'
  | 'integrations:manage'
  | 'onboarding:read'
  | 'onboarding:edit'
  | 'mindmap:read'
  | 'mindmap:write'
  | 'mindmap:share'
  | 'users:read'
  | 'users:invite'
  | 'users:manage'
  | 'settings:read'
  | 'settings:write'
  | 'audit:read'

// User type
export interface User {
  id: string
  email: string
  name?: string | null
  picture?: string | null
  role: UserRole
  status: UserStatus
  googleId?: string | null
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date | null
}

// Session type for NextAuth
export interface SessionUser {
  id: string
  email: string
  name?: string | null
  picture?: string | null
  role: UserRole
  permissions: Permission[]
}

// Invitation type
export interface Invitation {
  id: string
  email: string
  token: string
  invitedBy: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  expiresAt: Date
  createdAt: Date
}

// API Service types
export type ApiService = 'shopify' | 'shipstation' | 'klaviyo' | 'slack'

export interface ApiCredential {
  id: string
  service: ApiService
  userId: string
  encryptedCredentials: string
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR'
  lastHealthCheck?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Blog Post type
export interface BlogPost {
  id: string
  userId: string
  title: string
  slug: string
  content: Record<string, any> // JSON content from TipTap
  excerpt?: string | null
  featuredImage?: string | null
  seo?: {
    metaTitle?: string
    metaDescription?: string
    canonicalUrl?: string
    ogImage?: string
  }
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  publishedAt?: Date | null
  shopifyArticleId?: string | null
  createdAt: Date
  updatedAt: Date
}

// Mind Map type
export interface MindMap {
  id: string
  userId: string
  title: string
  description?: string | null
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, any>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type?: string
    data?: Record<string, any>
  }>
  isPublic: boolean
  collaborators: string[]
  createdAt: Date
  updatedAt: Date
}

// Onboarding types
export interface OnboardingWorkflow {
  id: string
  name: string
  description?: string | null
  steps: OnboardingStep[]
  userType: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  content?: Record<string, any> // Rich content blocks
  order: number
  isRequired: boolean
  completionCriteria?: Record<string, any>
}

export interface OnboardingProgress {
  id: string
  userId: string
  workflowId: string
  currentStep: number
  completedSteps: string[]
  startedAt: Date
  completedAt?: Date | null
}

// Audit Log type
export interface AuditLog {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string | null
  details: Record<string, any>
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
}
