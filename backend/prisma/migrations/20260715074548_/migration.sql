-- CreateTable
CREATE TABLE "leadFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "followUp" TEXT NOT NULL,
    "nextFollowUpDate" TIMESTAMP(3),
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leadFollowUp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "leadFollowUp" ADD CONSTRAINT "leadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leadFollowUp" ADD CONSTRAINT "leadFollowUp_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
