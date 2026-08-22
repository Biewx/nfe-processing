import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { FiltersDto } from "../../analytics/dtos/filters.dto";

@Injectable()
export default class InsightsRepository {
    constructor(
        private readonly prisma: PrismaService
    ){}

    // Traz todas as compras de um produto dentro de uma janela de datas, já com
    // o fornecedor de cada uma. Não decide "qual é o melhor" aqui — isso é
    // regra de negócio, fica por conta do service. O repository só busca dado.
    async findPurchasesByProductInRange(productId: number, start: Date, end: Date, companyId: number) {
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
                    companyId,
                    issuedAt: {
                        gte: start,
                        lte: end,
                    },
                },
            },
        });
    }

    async findPurchaseHistoryByProduct(params: FiltersDto, companyId: number) {
        const history = await this.prisma.invoiceItem.findMany({
            select: {
                unitPrice: true,
                invoice: {
                    select: {
                        supplier: {
                            select: {
                                id: true,
                                legalName: true
                            }
                        },
                        issuedAt: true
                    }
                },
            },
            orderBy:{
                invoice: {
                    issuedAt: 'desc'
                }
            },
            where: {
                    productId: params.productId,
                    invoice: { companyId },
                }
        })
        return history
    }

    // Traz 1 registro por produto: a compra mais recente daquele produto,
    // não importa de qual fornecedor. "distinct" + "orderBy" juntos fazem o
    // Prisma manter só o primeiro registro de cada productId na ordem dada —
    // como a ordem é "mais recente primeiro", o primeiro de cada produto já
    // é o mais recente.
    async findLatestPurchasePerProduct(companyId: number) {
        return this.prisma.invoiceItem.findMany({
            where: {
                productId: { not: null },
                invoice: { companyId },
            },
            distinct: ['productId'],
            orderBy: {
                invoice: {
                    issuedAt: 'desc',
                },
            },
            select: {
                productId: true,
                description: true,
                quantity: true,
                unitPrice: true,
                commercialUnit: true,
                invoice: {
                    select: {
                        issuedAt: true,
                        supplier: {
                            select: {
                                id: true,
                                legalName: true,
                            },
                        },
                    },
                },
            },
        });
    }
}