/*
  Warnings:

  - A unique constraint covering the columns `[placementId,studentId]` on the table `placementStudent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "placementStudent_placementId_studentId_key" ON "placementStudent"("placementId", "studentId");
