import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { InvoiceDto } from "../dtos/invoice.dto";

@Injectable()
export default class InvoiceRepository {

    constructor(private readonly prisma: PrismaService) {}

    async findByInvoiceNumber(accessKey: string) {
        const invoiceExists = await this.prisma.invoice.findUnique({
            where: {
                accessKey: accessKey,
            },
        });
        return invoiceExists;
    }

    async createInvoice(dto: InvoiceDto, supplierId: number) {
        console.log(dto);
        console.log(supplierId);
        const invoice = await this.prisma.invoice.create({
            data:{
                ...dto,
                supplier:{
                    connect:{
                        id: supplierId,
                    },
                },
            },
        });
        return invoice;
    }
}