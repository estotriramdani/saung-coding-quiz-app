-- CreateEnum
CREATE TYPE "public"."QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."quizzes" ADD COLUMN     "status" "public"."QuizStatus" NOT NULL DEFAULT 'DRAFT';
