import { Injectable } from "@nestjs/common";
import GetSavingsOpportunitiesService from "../../insights/services/get-savings-opportunities.service";
import GetProductPriceIncreaseService from "../../insights/services/get-product-price-increase.service";
import SuppliersService from "../../analytics/services/suppliers.service";
import { getReferenceMonthWindow } from "../../insights/utils/get-reference-month-window";
import MonthlyReportRepository from "../repositories/monthly-report.repository";

// FR-4: texto-modelo fixo da Situação Normal -- sem lógica de limiar nova,
// só entra quando FR-2 e FR-3 não produzem nenhum conteúdo no período.
const NORMAL_SITUATION_MESSAGE =
    "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados.";

@Injectable()
export default class ComposeMonthlyReportService {
    constructor(
        private readonly getSavingsOpportunitiesService: GetSavingsOpportunitiesService,
        private readonly getProductPriceIncreaseService: GetProductPriceIncreaseService,
        private readonly suppliersService: SuppliersService,
        private readonly monthlyReportRepository: MonthlyReportRepository,
    ) {}

    // FR-2: oportunidades de economia do mes de referencia. So orquestra a
    // chamada pro service de insights (AD-2) -- nenhuma comparacao de preco
    // ou fornecedor acontece aqui, isso continua morando em insights.
    async composeSavingsOpportunities(companyId: number, month: number, year: number) {
        return this.getSavingsOpportunitiesService.getSavingsOpportunities(companyId, month, year);
    }

    // FR-3: alertas de aumento de preco do mes de referencia. GetProductPriceIncreaseService
    // so avalia 1 produto por chamada (exige productId) -- entao primeiro
    // levanta quais produtos a empresa comprou no periodo (query propria,
    // AD-4) e chama o service de insights uma vez por produto, mantendo so
    // as entradas com alert === true. Mesmo padrao de loop que
    // GetSavingsOpportunitiesService ja usa internamente em insights.
    async composePriceIncreaseAlerts(companyId: number, month: number, year: number) {
        const range = getReferenceMonthWindow(month, year);
        const products = await this.monthlyReportRepository.findDistinctProductsPurchasedInPeriod(companyId, range);

        // um produto nao depende do outro -- roda as chamadas em paralelo em
        // vez de uma de cada vez (achado no code-review)
        const bySupplierPerProduct = await Promise.all(
            products.map((product) => {
                // productId nunca e null aqui -- a query ja filtrou isso
                // (where: productId: { not: null } ), mas o Prisma nao
                // consegue expressar esse filtro no tipo do campo selecionado.
                const productId = product.productId as number;
                return this.getProductPriceIncreaseService.getProductPriceIncrease({ month, year, productId }, companyId);
            }),
        );

        const alerts: {
            product: string;
            supplier: string;
            percentageChange: number;
            previousPrice: number;
            currentPrice: number;
        }[] = [];

        products.forEach((product, index) => {
            const bySupplier = bySupplierPerProduct[index];

            for (const entry of Object.values(bySupplier) as any[]) {
                if (!entry.alert) {
                    continue;
                }

                alerts.push({
                    product: product.description,
                    supplier: entry.supplier,
                    percentageChange: entry.percentageChange,
                    previousPrice: entry.previousAverage,
                    currentPrice: Number(entry.lastPrice),
                });
            }
        });

        return alerts;
    }

    // FR-4 + geração sob demanda (Story 1.4, SM-2 do PRD): monta o conteúdo
    // completo do relatório pra uma empresa/período -- exatamente o que o
    // e-mail eventualmente diria. Situação Normal aparece só quando FR-2 e
    // FR-3 não geram nada; o Fornecedor principal aparece sempre, com ou sem
    // alerta (AD-2: nenhuma lógica de comparação nova aqui, só orquestração).
    async composeFullReport(companyId: number, month: number, year: number) {
        const [savingsOpportunities, priceIncreaseAlerts, mainSupplier] = await Promise.all([
            this.composeSavingsOpportunities(companyId, month, year),
            this.composePriceIncreaseAlerts(companyId, month, year),
            this.findMainSupplier(companyId, month, year),
        ]);

        const hasContent = savingsOpportunities.length > 0 || priceIncreaseAlerts.length > 0;

        return {
            savingsOpportunities,
            priceIncreaseAlerts,
            normalSituationMessage: hasContent ? null : NORMAL_SITUATION_MESSAGE,
            mainSupplier,
        };
    }

    // O fornecedor com maior percentual do gasto total no período -- reaproveita
    // GetTopSellerSuppliers (analytics), só escolhe o maior do mapa devolvido.
    private async findMainSupplier(companyId: number, month: number, year: number) {
        const expensesBySupplier = await this.suppliersService.getTopSellerSuppliers({ month, year }, companyId);
        const suppliers = Object.values(expensesBySupplier) as { name: string; total: unknown; percentage: string }[];

        if (suppliers.length === 0) {
            return null;
        }

        return suppliers.reduce((highest, current) =>
            Number(current.percentage) > Number(highest.percentage) ? current : highest,
        );
    }
}
