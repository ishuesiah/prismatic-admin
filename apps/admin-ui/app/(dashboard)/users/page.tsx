'use client'

import { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge
} from '@prismatic/ui'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, Search, Filter, UserPlus, Mail, Calendar, Shield } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  picture: string | null
  role: string
  status: string
  createdAt: string
  lastLogin: string | null
  _count: {
    auditLogs: number
  }
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'VIEWER' as 'ADMIN' | 'STAFF' | 'VIEWER'
  })

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, filterRole, filterStatus])

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (filterRole) params.append('role', filterRole)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to load users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite user')
      }

      toast.success('User invited successfully')
      setShowInviteDialog(false)
      setInviteForm({ email: '', role: 'VIEWER' })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
      console.error('Error inviting user:', error)
    } finally {
      setInviting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INVITED': return 'bg-yellow-100 text-yellow-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.split('@')[0][0].toUpperCase()
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team. They'll need to sign in with Google.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@hemlockandoak.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: 'ADMIN' | 'STAFF' | 'VIEWER') => 
                    setInviteForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer - Read-only access</SelectItem>
                    <SelectItem value="STAFF">Staff - Content creation</SelectItem>
                    <SelectItem value="ADMIN">Admin - Full management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INVITED">Invited</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({pagination?.totalCount || 0})
          </CardTitle>
          <CardDescription>
            Team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || filterRole || filterStatus 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by inviting a team member.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {user.picture ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.picture}
                        alt={user.name || user.email}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(user.name, user.email)}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium">
                          {user.name || user.email}
                        </h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.lastLogin && (
                          <span>
                            Last login {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {user._count.auditLogs} actions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.totalCount} total users)
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
