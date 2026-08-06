import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class InsightsRepository {
    constructor(
        private readonly prisma: PrismaService
    ){}

    // Traz todas as compras de um produto dentro de uma janela de datas, já com
    // o fornecedor de cada uma. Não decide "qual é o melhor" aqui — isso é
    // regra de negócio, fica por conta do service. O repository só busca dado.
    async findPurchasesByProductInRange(productId: number, start: Date, end: Date) {
        return this.prisma.invoiceItem.findMany({
            select: {
                unitPrice: true,
                commercialUnit: true,
                invoice: {
                    select: {
                        supplier: {
                            select: {
                                id: true,
                                legalName: true
                            }
                        },
                    }
                },
            },
            where: {
                productId,
                invoice: {
                    issuedAt: {
                        gte: start,
                        lte: end,
                    },
                },
            },
        });
    }
}