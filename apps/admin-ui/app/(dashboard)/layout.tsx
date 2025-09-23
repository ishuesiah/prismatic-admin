import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SideNav from "@/components/navigation/side-nav"
import TopNav from "@/components/navigation/top-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Side Navigation */}
      <SideNav user={session.user} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav user={session.user} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
