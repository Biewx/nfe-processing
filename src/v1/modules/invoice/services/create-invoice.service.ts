import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import InvoiceRepository from "../repositories/invoice.repository";
import { InvoiceDto } from "../dtos/invoice.dto";

@Injectable()
export default class CreateInvoiceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly invoiceRepository: InvoiceRepository
    ) {}

    async createInvoiceIfNotExists(invoice, supplier) {
        const invoiceExists = await this.invoiceRepository.findByInvoiceNumber(invoice.accessKey);
        if (invoiceExists) {
            throw new Error(`Invoice with access key ${invoice.accessKey} already exists.`);
        }
        const newInvoice = await this.invoiceRepository.createInvoice(invoice, supplier);
        return newInvoice;
    }
}