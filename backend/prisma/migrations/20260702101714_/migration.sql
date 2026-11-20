/*
  Warnings:

  - A unique constraint covering the columns `[batchId]` on the table `TeachingDays` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TeachingDays_batchId_key" ON "TeachingDays"("batchId");
