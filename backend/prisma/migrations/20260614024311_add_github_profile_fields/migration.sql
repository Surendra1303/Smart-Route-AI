-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubBio" TEXT,
ADD COLUMN     "githubFollowers" INTEGER,
ADD COLUMN     "githubFollowing" INTEGER,
ADD COLUMN     "githubLocation" TEXT,
ADD COLUMN     "githubPublicRepos" INTEGER;
