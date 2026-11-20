-- AlterTable
ALTER TABLE "placementStudent" ADD COLUMN     "teacherId" TEXT;

-- AddForeignKey
ALTER TABLE "placementStudent" ADD CONSTRAINT "placementStudent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
