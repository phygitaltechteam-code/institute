-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'REJECTED', 'NOT_ATTENDED');

-- AlterTable
ALTER TABLE "placementInterview" ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED';
