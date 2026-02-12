/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Clinic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Clinic_name_key" ON "Clinic"("name");
