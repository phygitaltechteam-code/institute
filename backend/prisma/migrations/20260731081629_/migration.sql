-- AlterTable
ALTER TABLE "expenditure" ADD COLUMN     "accountId" TEXT;

-- AddForeignKey
ALTER TABLE "expenditure" ADD CONSTRAINT "expenditure_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
