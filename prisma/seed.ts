import { PrismaClient, Role, EducatorStatus, QuestionType } from '@prisma/client'
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

  let student
  if (!existingStudent) {
    const hashedPassword = await bcrypt.hash('student123', 12)

    student = await prisma.user.create({
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
    student = existingStudent
    console.log('Student user already exists')
  }

  // Get the educator for creating quizzes
  const educator = await prisma.user.findUnique({
    where: { email: educatorEmail }
  })

  if (educator && student) {
    // Create sample quizzes
    const existingQuiz = await prisma.quiz.findFirst({
      where: { title: 'JavaScript Basics' }
    })

    if (!existingQuiz) {
      // Create a sample quiz
      const sampleQuiz = await prisma.quiz.create({
        data: {
          title: 'JavaScript Basics',
          description: 'Test your knowledge of JavaScript fundamentals',
          code: 'JS001',
          timeLimit: 30,
          maxAttempts: 3,
          isActive: true,
          createdById: educator.id,
          questions: {
            create: [
              {
                question: 'What is the correct way to declare a variable in JavaScript?',
                type: QuestionType.MULTIPLE_CHOICE,
                options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
                correctAnswer: 'var x = 5;',
                explanation: 'In JavaScript, variables are declared using var, let, or const keywords.',
                points: 1
              },
              {
                question: 'JavaScript is a compiled language',
                type: QuestionType.TRUE_FALSE,
                correctAnswer: 'False',
                explanation: 'JavaScript is an interpreted language, not compiled.',
                points: 1
              },
              {
                question: 'What does console.log() do?',
                type: QuestionType.SHORT_ANSWER,
                correctAnswer: 'prints output to console',
                explanation: 'console.log() outputs data to the browser console for debugging.',
                points: 1
              }
            ]
          }
        }
      })

      // Create another sample quiz
      const quiz2 = await prisma.quiz.create({
        data: {
          title: 'HTML & CSS Fundamentals',
          description: 'Basic web development concepts',
          code: 'WEB001',
          timeLimit: 25,
          maxAttempts: null, // Unlimited attempts
          isActive: true,
          createdById: educator.id,
          questions: {
            create: [
              {
                question: 'What does HTML stand for?',
                type: QuestionType.SHORT_ANSWER,
                correctAnswer: 'HyperText Markup Language',
                explanation: 'HTML stands for HyperText Markup Language.',
                points: 2
              },
              {
                question: 'Which tag is used for the largest heading?',
                type: QuestionType.MULTIPLE_CHOICE,
                options: ['<h1>', '<h6>', '<heading>', '<head>'],
                correctAnswer: '<h1>',
                explanation: 'The <h1> tag creates the largest heading in HTML.',
                points: 1
              }
            ]
          }
        }
      })

      // Create quiz enrollments for the student
      await prisma.quizEnrollment.create({
        data: {
          userId: student.id,
          quizId: sampleQuiz.id,
        }
      })

      await prisma.quizEnrollment.create({
        data: {
          userId: student.id,
          quizId: quiz2.id,
        }
      })

      // Create a quiz attempt for the first quiz
      await prisma.quizAttempt.create({
        data: {
          userId: student.id,
          quizId: sampleQuiz.id,
          score: 2.5,
          totalPoints: 3,
          startedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          completedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          timeSpent: 600, // 10 minutes in seconds
        }
      })

      console.log('Created sample quizzes and enrollments')
    } else {
      console.log('Sample quizzes already exist')
    }
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
