/*
  Warnings:

  - You are about to drop the column `date` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `task` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentId` on the `TaskCompletion` table. All the data in the column will be lost.
  - Added the required column `deadline` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskCompletion" DROP CONSTRAINT "TaskCompletion_assignmentId_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "date",
DROP COLUMN "task",
DROP COLUMN "topic",
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "remark" TEXT;

-- AlterTable
ALTER TABLE "TaskCompletion" DROP COLUMN "assignmentId";
