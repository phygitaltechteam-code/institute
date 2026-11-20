/*
  Warnings:

  - You are about to drop the column `batchId` on the `Exam` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_batchId_fkey";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "batchId";

-- CreateTable
CREATE TABLE "examBatches" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examBatches_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "examBatches" ADD CONSTRAINT "examBatches_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examBatches" ADD CONSTRAINT "examBatches_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
