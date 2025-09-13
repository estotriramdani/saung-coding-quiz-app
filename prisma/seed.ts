import { PrismaClient, Role, EducatorStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Get admin credentials from environment
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@saungcoding.com'
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Administrator',
        role: Role.ADMIN,
        emailVerified: new Date(),
      }
    })

    console.log('Created admin user:', admin.email)
  } else {
    console.log('Admin user already exists')
  }

  // Create test educator user
  const educatorEmail = 'educator@saungcoding.com'
  const existingEducator = await prisma.user.findUnique({
    where: { email: educatorEmail }
  })

  if (!existingEducator) {
    const hashedPassword = await bcrypt.hash('educator123', 12)

    const educator = await prisma.user.create({
      data: {
        email: educatorEmail,
        password: hashedPassword,
        name: 'Test Educator',
        role: Role.EDUCATOR,
        educatorStatus: EducatorStatus.APPROVED,
        bio: 'Test educator for development',
        qualification: 'Computer Science',
        emailVerified: new Date(),
      }
    })

    console.log('Created educator user:', educator.email)
  } else {
    console.log('Educator user already exists')
  }

  // Create test student user
  const studentEmail = 'student@saungcoding.com'
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail }
  })

  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash('student123', 12)

    const student = await prisma.user.create({
      data: {
        email: studentEmail,
        password: hashedPassword,
        name: 'Test Student',
        role: Role.STUDENT,
        emailVerified: new Date(),
      }
    })

    console.log('Created student user:', student.email)
  } else {
    console.log('Student user already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
