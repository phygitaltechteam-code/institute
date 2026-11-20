-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('REGULAR', 'FINAL');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "type" "ExamType" NOT NULL DEFAULT 'REGULAR';
