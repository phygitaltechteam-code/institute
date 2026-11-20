-- CreateTable
CREATE TABLE "placement" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "interviewDate" TEXT NOT NULL,
    "interviewMode" TEXT NOT NULL,
    "workSchedule" TEXT NOT NULL,
    "salary" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "placement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "placement" ADD CONSTRAINT "placement_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
