-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_teacherId_fkey";

-- AlterTable
ALTER TABLE "attendance" ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
