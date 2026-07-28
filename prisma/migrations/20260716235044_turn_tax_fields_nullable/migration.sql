-- AlterTable
ALTER TABLE "invoice_items"
RENAME CONSTRAINT "InvoiceItem_pkey" TO "invoice_items_pkey";

ALTER TABLE "invoice_items"
ALTER COLUMN "ncm" DROP NOT NULL,
ALTER COLUMN "commercialUnit" DROP NOT NULL,
ALTER COLUMN "cfop" DROP NOT NULL,
ALTER COLUMN "icmsValue" DROP NOT NULL,
ALTER COLUMN "pisValue" DROP NOT NULL,
ALTER COLUMN "cofinsValue" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices"
RENAME CONSTRAINT "Invoice_pkey" TO "invoices_pkey";

-- AlterTable
ALTER TABLE "suppliers"
RENAME CONSTRAINT "Supplier_pkey" TO "suppliers_pkey";