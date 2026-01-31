import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Default password for existing users: "Password1"
const DEFAULT_PASSWORD = 'Password1'

async function main() {
  console.log('Setting passwords for existing users...')

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  // Update all users that don't have a password
  const result = await prisma.user.updateMany({
    where: {
      passwordHash: null,
    },
    data: {
      passwordHash,
    },
  })

  console.log(`Updated ${result.count} users with default password: ${DEFAULT_PASSWORD}`)
  console.log('Please change your password after logging in!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
