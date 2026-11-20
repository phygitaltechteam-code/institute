/*
  Warnings:

  - A unique constraint covering the columns `[placementId,studentId]` on the table `placementInterview` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "placementInterview_placementId_studentId_key" ON "placementInterview"("placementId", "studentId");
