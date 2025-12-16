
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'user@example.com' }
  })

  if (!user) {
    console.error('User not found')
    process.exit(1)
  }

  const project = await prisma.project.create({
    data: {
      name: 'Manual Test Project',
      description: 'Created for receipt verification',
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: 'IN_PROGRESS',
      createdBy: user.id,
      members: {
        create: [
          {
            userId: user.id,
            role: 'OWNER'
          }
        ]
      }
    }
  })

  console.log('Created project:', project.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
