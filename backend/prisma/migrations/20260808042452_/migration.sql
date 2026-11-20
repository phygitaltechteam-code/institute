-- AlterTable
ALTER TABLE "subject" ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject" ADD CONSTRAINT "subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
