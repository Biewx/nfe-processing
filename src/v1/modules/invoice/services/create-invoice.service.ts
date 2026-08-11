import { ConflictException, Injectable } from "@nestjs/common";
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
            // ConflictException vira 409 automaticamente (o Nest sabe converter
            // exceptions dele em resposta HTTP certa). Um "throw new Error(...)"
            // genérico não é reconhecido pelo Nest, então vira 500 — como se o
            // servidor tivesse quebrado, quando na real é o client mandando uma
            // invoice duplicada de propósito ou por engano.
            throw new ConflictException(`Invoice with access key ${invoice.accessKey} already exists.`);
        }
        const newInvoice = await this.invoiceRepository.createInvoice(invoice, supplier);
        return newInvoice;
    }
}