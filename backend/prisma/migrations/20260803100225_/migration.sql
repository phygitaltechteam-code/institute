-- AlterTable
ALTER TABLE "TaskCompletion" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "remark" TEXT;

-- AlterTable
ALTER TABLE "assignmentCompletion" ADD COLUMN     "documentUrl" TEXT,
ADD COLUMN     "remark" TEXT;
