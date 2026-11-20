-- AlterTable
ALTER TABLE "placementStudent" ADD COLUMN     "isApplied" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "placementInterview" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "interviewMode" TEXT NOT NULL,
    "location" TEXT,
    "otherDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placementInterview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "placementInterview" ADD CONSTRAINT "placementInterview_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placementInterview" ADD CONSTRAINT "placementInterview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
