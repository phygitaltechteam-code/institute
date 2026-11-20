-- CreateEnum
CREATE TYPE "graduation_type" AS ENUM ('POST_GRADUATION', 'GRADUATION', 'DIPLOMA');

-- AlterTable
ALTER TABLE "placementForm" ADD COLUMN     "companies" TEXT,
ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "currentProfile" TEXT,
ADD COLUMN     "experience_years" INTEGER,
ADD COLUMN     "isCurrentlyWorking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workProfile" TEXT;

-- CreateTable
CREATE TABLE "degree" (
    "id" TEXT NOT NULL,
    "score" TEXT,
    "course" TEXT,
    "passingyear" TEXT,
    "graduation_type" "graduation_type" NOT NULL,
    "placementFormId" TEXT NOT NULL,

    CONSTRAINT "degree_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "degree" ADD CONSTRAINT "degree_placementFormId_fkey" FOREIGN KEY ("placementFormId") REFERENCES "placementForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
