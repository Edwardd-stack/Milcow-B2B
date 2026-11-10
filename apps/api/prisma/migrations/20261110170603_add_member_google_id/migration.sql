/*
  Warnings:

  - A unique constraint covering the columns `[member_google_id]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "member_google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "members_member_google_id_key" ON "members"("member_google_id");
