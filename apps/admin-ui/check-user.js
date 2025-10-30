const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'info@hemlockandoak.com' }
    })
    
    console.log('User found:', JSON.stringify(user, null, 2))
    
    const allUsers = await prisma.user.findMany()
    console.log('\nTotal users in database:', allUsers.length)
    
  } catch (error) {
    console.error('Error checking user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
