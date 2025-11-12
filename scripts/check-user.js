/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
    console.log('User:', u ? u.email : 'not found');
    console.log('Has password:', !!(u && u.password));
    if (u && u.password) {
      const ok = await bcrypt.compare('user123!', u.password);
      console.log('Password matches user123! =>', ok);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
