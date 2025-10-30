-- Add Account table for NextAuth Prisma Adapter
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,

  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint
ALTER TABLE "Account" ADD CONSTRAINT "Account_provider_providerAccountId_key" 
  UNIQUE ("provider", "providerAccountId");

-- Add index
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

-- Add new fields to User table if they don't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
