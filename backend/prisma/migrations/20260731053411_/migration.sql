-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "collegeName" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "feeOptionId" TEXT,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "referId" TEXT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_referId_fkey" FOREIGN KEY ("referId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_feeOptionId_fkey" FOREIGN KEY ("feeOptionId") REFERENCES "feeOptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
