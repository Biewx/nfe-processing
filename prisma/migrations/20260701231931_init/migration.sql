-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "accessKey" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "operationNature" VARCHAR(60) NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "xmlStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "ncm" VARCHAR(8) NOT NULL,
    "commercialUnit" VARCHAR(10) NOT NULL,
    "cfop" VARCHAR(4) NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "icmsValue" DECIMAL(15,2) NOT NULL,
    "pisValue" DECIMAL(15,2) NOT NULL,
    "cofinsValue" DECIMAL(15,2) NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "cnpj" CHAR(14) NOT NULL,
    "legalName" VARCHAR(120) NOT NULL,
    "tradeName" VARCHAR(120),
    "stateRegistration" VARCHAR(60),
    "city" VARCHAR(60) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_accessKey_key" ON "invoices"("accessKey");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
