"use client"

import { Bell, Search, Menu } from "lucide-react"
import { useState } from "react"
import type { SessionUser } from "@prismatic/lib/types"

interface TopNavProps {
  user: SessionUser
}

export default function TopNav({ user }: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search Bar */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Menu */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
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
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        </button>
      </div>
    </header>
  )
}
