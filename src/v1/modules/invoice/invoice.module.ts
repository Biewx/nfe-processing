import { Module } from "@nestjs/common";
import { InvoiceController } from "./invoice.controller";
import ProcessInvoiceService from "./services/process-invoice.service";
import XmlParserService from "./mapper/mapper.service";
import CreateSupplierIfNotExistsService from "../supplier/services/create-supplier-if-not-exists.service";
import SupplierRepository from "../supplier/repositories/supplier.repository";
import { PrismaModule } from "prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [InvoiceController],
    providers: [
        ProcessInvoiceService,
        XmlParserService,
        CreateSupplierIfNotExistsService,
        SupplierRepository,
    ]
})
export class InvoiceModule {}