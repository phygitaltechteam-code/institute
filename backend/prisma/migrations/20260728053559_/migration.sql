/*
  Warnings:

  - You are about to drop the column `followUp` on the `leadFollowUp` table. All the data in the column will be lost.
  - Added the required column `note` to the `leadFollowUp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leadFollowUp" DROP COLUMN "followUp",
ADD COLUMN     "date" TIMESTAMP(3),
ADD COLUMN     "note" TEXT NOT NULL;
