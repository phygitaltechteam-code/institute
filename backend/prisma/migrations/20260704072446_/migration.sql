/*
  Warnings:

  - Changed the type of `interviewDate` on the `placement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "placement" DROP COLUMN "interviewDate",
ADD COLUMN     "interviewDate" TIMESTAMP(3) NOT NULL;
