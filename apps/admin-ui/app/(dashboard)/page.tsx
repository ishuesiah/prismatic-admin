import { auth } from "@/lib/auth"
import { 
  Users, 
  FileEdit, 
  TrendingUp, 
  Package,
  Activity,
  DollarSign
} from "lucide-react"

async function getStats() {
  // This would fetch from your database
  return {
    totalUsers: 24,
    blogPosts: 142,
    activeIntegrations: 4,
    monthlyRevenue: 12584,
    orderCount: 356,
    conversionRate: 3.2
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const stats = await getStats()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user.name || session?.user.email}
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Blog Posts"
          value={stats.blogPosts}
          icon={FileEdit}
          trend="+5%"
          trendUp={true}
        />
        <StatCard
          title="Active Integrations"
          value={stats.activeIntegrations}
          icon={Activity}
          trend="0%"
          trendUp={false}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="+18%"
          trendUp={true}
        />
        <StatCard
          title="Orders"
          value={stats.orderCount}
          icon={Package}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          trend="-2%"
          trendUp={false}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            label="Write Blog Post"
            href="/blog/new"
            icon={FileEdit}
          />
          <QuickActionButton
            label="Create Mind Map"
            href="/mindmaps/new"
            icon={Activity}
          />
          <QuickActionButton
            label="Invite User"
            href="/users/invite"
            icon={Users}
          />
          <QuickActionButton
            label="View Analytics"
            href="/analytics"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem
            action="Published blog post"
            description="'10 Tips for E-commerce Success'"
            time="2 hours ago"
          />
          <ActivityItem
            action="Shopify sync completed"
            description="142 products updated"
            time="4 hours ago"
          />
          <ActivityItem
            action="New user registered"
            description="jane@hemlockandoak.com"
            time="Yesterday"
          />
          <ActivityItem
            action="Mind map created"
            description="'Q1 Marketing Strategy'"
            time="2 days ago"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp 
}: {
  title: string
  value: string | number
  icon: any
  trend: string
  trendUp: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className={`mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend} from last month
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ 
  label, 
  href, 
  icon: Icon 
}: {
  label: string
  href: string
  icon: any
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Icon className="h-5 w-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </a>
  )
}

function ActivityItem({
  action,
  description,
  time
}: {
  action: string
  description: string
  time: string
}) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
      <div className="h-2 w-2 mt-2 rounded-full bg-blue-600"></div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
}
