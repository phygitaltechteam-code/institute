/*
  Warnings:

  - You are about to drop the column `adminId` on the `Lead` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_adminId_fkey";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "adminId";
