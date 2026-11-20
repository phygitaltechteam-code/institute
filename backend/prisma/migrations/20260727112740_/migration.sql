/*
  Warnings:

  - The `interested` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Interested" AS ENUM ('WIN', 'WARM', 'COLD');

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "interested",
ADD COLUMN     "interested" "Interested" DEFAULT 'COLD';
