'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button, Input, Label, Avatar, AvatarFallback, AvatarImage, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@prismatic/ui'
import { toast } from 'react-hot-toast'
import { Loader2, Camera } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  picture: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
  lastLogin: string | null
}

export default function ProfileSettings() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    picture: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const data = await response.json()
      setProfile(data.user)
      setFormData({
        name: data.user.name || '',
        picture: data.user.picture || ''
      })
    } catch (error) {
      toast.error('Failed to load profile')
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          picture: formData.picture || null
        })
      })

      if (!response.ok) throw new Error('Failed to update profile')

      const data = await response.json()
      setProfile(data.user)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.split('@')[0][0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={formData.picture || profile.picture || ''} 
                    alt={profile.name || profile.email}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="picture">Profile Picture URL</Label>
                  <Input
                    id="picture"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.picture}
                    onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
                    className="w-[300px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a URL to your profile picture
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-[300px]"
                />
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-[300px] opacity-50"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Role (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-[200px] opacity-50"
                />
              </div>

              <Button 
                type="submit" 
                disabled={saving}
                className="w-fit"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.lastLogin 
                      ? new Date(profile.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${
                    profile.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm capitalize">{profile.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
