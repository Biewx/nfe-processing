/*
  Warnings:

  - Added the required column `companyId` to the `invoices` table without a default value. This is not possible if the table is not empty.

  Ajuste manual: o Prisma gera essa migration de um jeito que quebra com
  tabela populada (87 notas já existiam). Reordenei os passos pra criar a
  empresa padrão ANTES de mexer em invoices, popular companyId pra todo
  mundo, e só depois travar a coluna como NOT NULL.
*/

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- Empresa padrão pra "adotar" as notas que já existiam antes de multi-tenancy
-- existir. Sem isso, as 87 notas atuais ficariam sem dono nenhum.
INSERT INTO "companies" ("name", "updatedAt")
VALUES ('Empresa Padrão (dados legados)', CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Usuário de teste pra você conseguir logar e ver o dado que já existia
-- (o seed.ts) sem precisar re-popular o banco do zero. Senha: trocar123
-- -- TROQUE depois de logar uma vez, essa hash está commitada no repo.
INSERT INTO "users" ("email", "passwordHash", "companyId", "updatedAt")
SELECT 'gabrieljnborba@gmail.com', '$2b$10$aljjqxZojVc0HnA9uijIO.2kRXMUKtAj3EisBejST2WZ4ozwQamvq', "id", CURRENT_TIMESTAMP
FROM "companies"
WHERE "name" = 'Empresa Padrão (dados legados)';

-- AlterTable: adiciona companyId como opcional primeiro, porque a tabela já
-- tem 87 linhas -- não dá pra criar já como NOT NULL sem um valor pra elas.
ALTER TABLE "invoices" ADD COLUMN "companyId" INTEGER;

-- Backfill: toda nota que já existia passa a pertencer à empresa padrão.
UPDATE "invoices"
SET "companyId" = (SELECT "id" FROM "companies" WHERE "name" = 'Empresa Padrão (dados legados)');

-- Agora que ninguém está NULL, trava a coluna como obrigatória de verdade.
ALTER TABLE "invoices" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
