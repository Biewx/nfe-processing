-- CreateEnum
CREATE TYPE "MonthlyReportRunStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "monthly_report_runs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "status" "MonthlyReportRunStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_report_runs_companyId_referenceMonth_referenceYear_key" ON "monthly_report_runs"("companyId", "referenceMonth", "referenceYear");

-- AddForeignKey
ALTER TABLE "monthly_report_runs" ADD CONSTRAINT "monthly_report_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
