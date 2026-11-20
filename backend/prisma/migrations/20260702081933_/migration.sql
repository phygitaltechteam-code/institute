/*
  Warnings:

  - You are about to drop the column `city` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `gst` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `pin` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `tagLine` on the `Teacher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "gst",
DROP COLUMN "logo",
DROP COLUMN "pin",
DROP COLUMN "pincode",
DROP COLUMN "state",
DROP COLUMN "tagLine",
ADD COLUMN     "Relationship" TEXT,
ADD COLUMN     "addressProof" TEXT,
ADD COLUMN     "adharcard" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyContactNumber" TEXT,
ADD COLUMN     "panproof" TEXT,
ADD COLUMN     "salary" DOUBLE PRECISION,
ADD COLUMN     "subject" TEXT;
