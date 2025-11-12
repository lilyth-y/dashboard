import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

describe('Auth API Integration Tests', () => {
  let testUser: { id: string; email: string }

  beforeAll(async () => {
    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email: 'integration-test@example.com' }
    })
  })

  afterAll(async () => {
    // Clean up
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('User Database Operations', () => {
    it('should create a new user in database', async () => {
      const hashedPassword = await hash('Test123!@#', 10)
      
      const user = await prisma.user.create({
        data: {
          email: 'integration-test@example.com',
          password: hashedPassword,
          name: 'Integration Test User',
          role: 'USER'
        }
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('integration-test@example.com')
      expect(user.name).toBe('Integration Test User')
      expect(user.role).toBe('USER')
      
      testUser = user
    })

    it('should find user by email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'integration-test@example.com' }
      })

      expect(user).toBeDefined()
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe('integration-test@example.com')
    })

    it('should update user name', async () => {
      const updated = await prisma.user.update({
        where: { id: testUser.id },
        data: { name: 'Updated Integration User' }
      })

      expect(updated.name).toBe('Updated Integration User')
    })

    it('should reject duplicate email (database constraint)', async () => {
      const hashedPassword = await hash('Test123!@#', 10)
      
      await expect(
        prisma.user.create({
          data: {
            email: 'integration-test@example.com',
            password: hashedPassword,
            name: 'Duplicate User'
          }
        })
      ).rejects.toThrow()
    })

    it('should list all users', async () => {
      const users = await prisma.user.findMany()
      
      expect(users.length).toBeGreaterThan(0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testUserInList = users.find((u: any) => u.id === testUser.id)
      expect(testUserInList).toBeDefined()
    })
  })
})
