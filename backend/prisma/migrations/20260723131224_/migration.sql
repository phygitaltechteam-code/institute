/*
  Warnings:

  - A unique constraint covering the columns `[examId,studentId]` on the table `ExamResults` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExamResults" ADD COLUMN     "correctAnswer" INTEGER,
ADD COLUMN     "percentage" DOUBLE PRECISION,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "totalAnswer" INTEGER,
ADD COLUMN     "wrongAnswer" INTEGER;

-- CreateTable
CREATE TABLE "studentExamSubmitted" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studentExamSubmitted_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studentExamSubmitted_resultId_questionId_key" ON "studentExamSubmitted"("resultId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResults_examId_studentId_key" ON "ExamResults"("examId", "studentId");

-- AddForeignKey
ALTER TABLE "studentExamSubmitted" ADD CONSTRAINT "studentExamSubmitted_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ExamResults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studentExamSubmitted" ADD CONSTRAINT "studentExamSubmitted_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
