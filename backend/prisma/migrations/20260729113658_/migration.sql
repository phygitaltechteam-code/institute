-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "referId" TEXT;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_referId_fkey" FOREIGN KEY ("referId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
