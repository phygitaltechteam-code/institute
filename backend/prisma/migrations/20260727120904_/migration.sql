-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_batchId_fkey";

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "batchId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
