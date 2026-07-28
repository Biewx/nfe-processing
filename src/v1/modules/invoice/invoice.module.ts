import { Module } from "@nestjs/common";
import { InvoiceController } from "./invoice.controller";
import ProcessInvoiceService from "./services/process-invoice.service";
import XmlParserService from "./mapper/mapper.service";
import CreateSupplierIfNotExistsService from "../supplier/services/create-supplier-if-not-exists.service";
import SupplierRepository from "../supplier/repositories/supplier.repository";
import { PrismaModule } from "prisma/prisma.module";
import InvoiceRepository from "./repositories/invoice.repository";
import CreateInvoiceService from "./services/create-invoice.service";
import CreateInvoiceItemService from "../invoice-item/services/create-invoice-item.service";
import InvoiceItemRepository from "../invoice-item/repositories/invoice-item.repository";

@Module({
    imports: [PrismaModule],
    controllers: [InvoiceController],
    providers: [
        ProcessInvoiceService,
        XmlParserService,
        CreateSupplierIfNotExistsService,
        SupplierRepository,
        InvoiceRepository,
        CreateInvoiceService,
        InvoiceItemRepository,
        CreateInvoiceItemService
    ]
})
export class InvoiceModule {}