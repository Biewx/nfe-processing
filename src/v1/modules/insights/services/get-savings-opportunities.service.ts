import { Injectable } from "@nestjs/common";
import InsightsRepository from "../repositories/insights.repository";
import GetBestSupplierService from "./get-best-supplier.service";

@Injectable()
export default class GetSavingsOpportunitiesService {
    constructor(
        private readonly insightsRepository: InsightsRepository,
        private readonly getBestSupplierService: GetBestSupplierService,
    ) {}

    // Pra cada produto, olha a compra mais recente e pergunta pro
    // GetBestSupplierService: "nesse mês, qual era o fornecedor mais barato
    // pra esse produto?". Se a resposta for diferente de quem realmente
    // vendeu, é uma oportunidade de economia perdida.
    async getSavingsOpportunities(companyId: number) {
        const latestPurchases = await this.insightsRepository.findLatestPurchasePerProduct(companyId);

        const opportunities: any[] = [];

        for (const purchase of latestPurchases) {
            const issuedAt = purchase.invoice.issuedAt;
            const month = issuedAt.getMonth() + 1;
            const year = issuedAt.getFullYear();

            // productId nunca é null aqui -- o repository já filtrou isso na
            // query (where: productId: { not: null } ), mas o Prisma não
            // consegue expressar esse filtro no tipo do campo, só no dado
            // retornado. O "as number" só avisa o TypeScript disso.
            const best = await this.getBestSupplierService.getBestSupplier({
                productId: purchase.productId as number,
                month,
                year,
            }, companyId);

            // sem pelo menos 2 fornecedores comparados nesse mês, não existe
            // recomendação de verdade -- não dá pra dizer que perdeu dinheiro
            if (!best.comparable) {
                continue;
            }

            // a compra mais recente pode ter sido feita numa unidade comercial
            // diferente da que o GetBestSupplierService usou como dominante
            // (ex.: comprou em "CX" dessa vez, mas a maioria histórica é "UN")
            // -- comparar preço entre unidades diferentes não faz sentido
            if (purchase.commercialUnit !== best.commercialUnit) {
                continue;
            }

            const actualSupplierName = purchase.invoice.supplier.legalName;

            // já comprou do fornecedor certo -- não há oportunidade perdida
            if (best.supplier === actualSupplierName) {
                continue;
            }

            const unitPriceDifference = Number(purchase.unitPrice) - best.unitPrice;
            const estimatedLoss = unitPriceDifference * Number(purchase.quantity);

            opportunities.push({
                product: purchase.description,
                actualSupplier: actualSupplierName,
                actualPrice: Number(purchase.unitPrice),
                recommendedSupplier: best.supplier,
                recommendedPrice: best.unitPrice,
                quantity: Number(purchase.quantity),
                estimatedLoss: Number(estimatedLoss.toFixed(2)),
            });
        }

        return opportunities;
    }
}
