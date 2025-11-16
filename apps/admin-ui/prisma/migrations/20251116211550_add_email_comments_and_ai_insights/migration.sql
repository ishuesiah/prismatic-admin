-- AlterTable
ALTER TABLE "EmailCorrespondence" ADD COLUMN "aiInsights" JSONB;

-- CreateTable
CREATE TABLE "EmailComment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailComment_emailId_idx" ON "EmailComment"("emailId");

-- CreateIndex
CREATE INDEX "EmailComment_userId_idx" ON "EmailComment"("userId");

-- AddForeignKey
ALTER TABLE "EmailComment" ADD CONSTRAINT "EmailComment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailCorrespondence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailComment" ADD CONSTRAINT "EmailComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
