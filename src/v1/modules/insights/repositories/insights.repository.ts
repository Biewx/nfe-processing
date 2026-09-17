import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { FiltersDto } from "../../analytics/dtos/filters.dto";
import { getReferenceMonthWindow } from "../utils/get-reference-month-window";

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

    // `params.month`/`params.year` são opcionais (AD-4): quando informados,
    // aplica um corte SUPERIOR de data (issuedAt <= fim do mês de
    // referência) -- não um corte de janela completo como em
    // findLatestPurchasePerProduct. A média histórica ("previousAverage",
    // calculada pelo service a partir do restante da lista) continua olhando
    // todo o passado antes do corte; só a compra "atual" fica ancorada no
    // mês de referência, em vez de puxar uma compra futura já lançada no
    // banco quando o job roda. Omitidos, preserva o comportamento de sempre
    // -- o endpoint `/insights/product_history` ao vivo não muda.
    async findPurchaseHistoryByProduct(params: FiltersDto, companyId: number) {
        const upperBound = params.month && params.year
            ? getReferenceMonthWindow(params.month, params.year).end
            : undefined;

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
                    invoice: {
                        companyId,
                        ...(upperBound ? { issuedAt: { lte: upperBound } } : {}),
                    },
                }
        })
        return history
    }

    // Traz 1 registro por produto: a compra mais recente daquele produto,
    // não importa de qual fornecedor. "distinct" + "orderBy" juntos fazem o
    // Prisma manter só o primeiro registro de cada productId na ordem dada —
    // como a ordem é "mais recente primeiro", o primeiro de cada produto já
    // é o mais recente.
    //
    // `range` é opcional (AD-3): quando informado, só entram produtos cuja
    // compra mais recente caiu DENTRO da janela -- não é só um corte
    // superior. Um produto cuja última compra foi meses antes do início da
    // janela não deve aparecer só porque nada mais recente existe; ele
    // simplesmente não teve compra "do período". Omitido, preserva o
    // comportamento de sempre (compra mais recente, sem limite) -- o
    // endpoint `/insights/savings_opportunities` ao vivo não muda.
    async findLatestPurchasePerProduct(companyId: number, range?: { start: Date; end: Date }) {
        return this.prisma.invoiceItem.findMany({
            where: {
                productId: { not: null },
                invoice: {
                    companyId,
                    ...(range ? { issuedAt: { gte: range.start, lte: range.end } } : {}),
                },
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