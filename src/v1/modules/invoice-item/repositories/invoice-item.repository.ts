import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { InvoiceItemDto } from "../dtos/invoice-item.dto";

@Injectable()
export default class InvoiceItemRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createInvoice(dto: InvoiceItemDto[], invoiceId) {
        await this.prisma.invoiceItem.createMany({
            data: dto.map(item => ({
                ...item,
                invoiceId
            }))
        });
    }
}
