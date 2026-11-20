-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "attendance" TEXT,
ADD COLUMN     "finalExam" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "internship" TEXT,
ADD COLUMN     "interviewsGiven" INTEGER DEFAULT 0,
ADD COLUMN     "paidFees" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "pendingFees" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "placementForm" TEXT,
ADD COLUMN     "placementReceived" TEXT,
ADD COLUMN     "referrals" INTEGER DEFAULT 0,
ADD COLUMN     "totalExams" INTEGER DEFAULT 0;
