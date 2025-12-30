-- AlterTable
ALTER TABLE "otp_tokens" ADD COLUMN     "full_name" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'signin';
