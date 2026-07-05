/*
  Warnings:

  - A unique constraint covering the columns `[userId,githubId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Repository_githubId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_githubId_key" ON "Repository"("userId", "githubId");
