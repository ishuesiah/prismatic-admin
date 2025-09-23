import { PrismaClient } from '@prisma/client'
import { SUPERADMIN_EMAIL } from '@prismatic/lib/constants'

const prisma = new PrismaClient()

async function main() {
  // Check if superadmin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL }
  })

  if (!existingSuperAdmin) {
    // Create superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        email: SUPERADMIN_EMAIL,
        name: 'Super Admin',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
      }
    })

    console.log('✅ Superadmin user created:', superAdmin.email)
  } else {
    console.log('ℹ️ Superadmin user already exists')
  }

  // Create default onboarding workflows
  const workflows = [
    {
      name: 'Admin Onboarding',
      description: 'Onboarding workflow for administrators',
      userType: 'ADMIN' as const,
      steps: [
        {
          id: '1',
          title: 'Welcome to Prismatic Admin',
          description: 'Get started with your admin dashboard',
          order: 1,
          isRequired: true
        },
        {
          id: '2',
          title: 'Connect Integrations',
          description: 'Set up Shopify, Klaviyo, and other integrations',
          order: 2,
          isRequired: true
        },
        {
          id: '3',
          title: 'Invite Team Members',
          description: 'Add users and set their permissions',
          order: 3,
          isRequired: false
        }
      ]
    },
    {
      name: 'Staff Onboarding',
      description: 'Onboarding workflow for staff members',
      userType: 'STAFF' as const,
      steps: [
        {
          id: '1',
          title: 'Welcome',
          description: 'Learn about the platform',
          order: 1,
          isRequired: true
        },
        {
          id: '2',
          title: 'Create Your First Blog Post',
          description: 'Learn how to use the blog editor',
          order: 2,
          isRequired: true
        }
      ]
    }
  ]

  for (const workflow of workflows) {
    const existing = await prisma.onboardingWorkflow.findFirst({
      where: { name: workflow.name }
    })

    if (!existing) {
      await prisma.onboardingWorkflow.create({
        data: {
          name: workflow.name,
          description: workflow.description,
          userType: workflow.userType,
          steps: workflow.steps,
          isActive: true
        }
      })
      console.log(`✅ Created onboarding workflow: ${workflow.name}`)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
