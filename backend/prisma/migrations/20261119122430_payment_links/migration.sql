-- CreateTable
CREATE TABLE "PaymentLink" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "paymentId" TEXT,
    "feesCollectId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLink_linkId_key" ON "PaymentLink"("linkId");

-- CreateIndex
CREATE INDEX "PaymentLink_adminId_studentId_idx" ON "PaymentLink"("adminId", "studentId");
