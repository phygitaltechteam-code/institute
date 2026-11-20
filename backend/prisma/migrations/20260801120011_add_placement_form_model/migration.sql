-- CreateTable
CREATE TABLE "placementForm" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone1" TEXT,
    "phone2" TEXT,
    "gender" "Gender",
    "ssc" TEXT,
    "ssc_year" TEXT,
    "hsc" TEXT,
    "hsc_year" TEXT,
    "diploma" TEXT,
    "diploma_year" TEXT,
    "diploma_course" TEXT,
    "post_graduation" TEXT,
    "post_graduation_year" TEXT,
    "post_course" TEXT,
    "exprience" TEXT,
    "current_working" TEXT,
    "Preferred_Profiles" TEXT,
    "state" TEXT,
    "district" TEXT,
    "preferredLocation" TEXT,
    "aadharcard" TEXT,
    "passport" TEXT,
    "profile_photo" TEXT,
    "resume" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placementForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placementForm_studentId_key" ON "placementForm"("studentId");

-- AddForeignKey
ALTER TABLE "placementForm" ADD CONSTRAINT "placementForm_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
