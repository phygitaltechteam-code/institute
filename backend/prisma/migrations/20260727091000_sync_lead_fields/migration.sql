-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "batchType",
DROP COLUMN "qualification",
ADD COLUMN "degree" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "mode" "BatchType",
ADD COLUMN "pursing" TEXT;
