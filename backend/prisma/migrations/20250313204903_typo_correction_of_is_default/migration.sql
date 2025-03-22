/*
  Warnings:

  - You are about to drop the column `idDefault` on the `Address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "idDefault",
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;
