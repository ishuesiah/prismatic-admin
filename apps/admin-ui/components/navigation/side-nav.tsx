"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  FileEdit, 
  Users, 
  Settings, 
  Network,
  BookOpen,
  Plug,
  BarChart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail
} from "lucide-react"
import { useState } from "react"
import { cn } from "@prismatic/ui"
import type { SessionUser } from "@prismatic/lib/types"

interface SideNavProps {
  user: SessionUser
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, permission: null },
  { name: "Email Responder", href: "/email-responder", icon: Mail, permission: null },
  { name: "Blog Editor", href: "/blog", icon: FileEdit, permission: "blog:read" },
  { name: "Mind Maps", href: "/mindmaps", icon: Network, permission: "mindmap:read" },
  { name: "Onboarding", href: "/onboarding", icon: BookOpen, permission: "onboarding:read" },
  { name: "Integrations", href: "/integrations", icon: Plug, permission: "integrations:read" },
  { name: "Analytics", href: "/analytics", icon: BarChart, permission: null },
  { name: "Users", href: "/users", icon: Users, permission: "users:read" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings:read" },
]

export default function SideNav({ user }: SideNavProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true
    return user.permissions?.includes(item.permission as any)
  })

  return (
    <nav className={cn(
      "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-gray-900">Prismatic Admin</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href))
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    "hover:bg-gray-100 hover:text-gray-900",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Info */}
      <div className="border-t border-gray-200 p-4">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          {user.picture ? (
            <img
              className="h-8 w-8 rounded-full"
              src={user.picture}
              alt={user.name || "User"}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          )}
        </div>
        
        {/* Logout Button */}
        <button
          onClick={() => {/* Handle logout */}}
          className={cn(
            "mt-4 flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
            isCollapsed && "justify-center px-0"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  )
}
