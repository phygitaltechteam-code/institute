-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_courseId_fkey";

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "courseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
