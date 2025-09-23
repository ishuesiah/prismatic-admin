"use client"

import { signIn } from "next-auth/react"
import { Button } from "@prismatic/ui"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prismatic Admin
            </h1>
            <p className="text-gray-600">
              Sign in to manage your business
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Google Sign In */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="h-5 w-5" />
              <span className="text-gray-700 font-medium">
                Continue with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Secure authentication
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only authorized email addresses from @hemlockandoak.com domain can sign in.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
