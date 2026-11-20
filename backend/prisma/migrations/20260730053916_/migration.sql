-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "totalFees" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalPaidFees" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "totalPendingFees" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "feesCollect" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "teacherId" TEXT,
    "pendingAmount" DOUBLE PRECISION,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feesCollect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeFollowup" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "pendingAmount" DOUBLE PRECISION,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT,

    CONSTRAINT "feeFollowup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "feesCollect" ADD CONSTRAINT "feesCollect_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feesCollect" ADD CONSTRAINT "feesCollect_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feesCollect" ADD CONSTRAINT "feesCollect_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeFollowup" ADD CONSTRAINT "feeFollowup_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeFollowup" ADD CONSTRAINT "feeFollowup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
