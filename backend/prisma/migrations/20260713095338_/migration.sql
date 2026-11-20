-- AlterTable
ALTER TABLE "ExamQuestions" ADD COLUMN     "explanation" TEXT;

-- CreateTable
CREATE TABLE "placementStudent" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placementStudent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "placementStudent" ADD CONSTRAINT "placementStudent_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placementStudent" ADD CONSTRAINT "placementStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
