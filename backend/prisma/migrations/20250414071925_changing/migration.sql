/*
  Warnings:

  - You are about to drop the column `idCardImage` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "idCardImage",
ADD COLUMN     "profilePicture" TEXT;
