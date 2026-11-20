-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "absentStudent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "presentStudent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStudent" INTEGER NOT NULL DEFAULT 0;
