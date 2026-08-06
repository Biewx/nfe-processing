import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { FiltersDto } from "../../analytics/dtos/filters.dto";
import InsightsRepository from "../repositories/insights.repository";

type CheapestOffer = {
    legalName: string;
    unitPrice: number;
};

type Purchase = {
    unitPrice: unknown;
    commercialUnit: string | null;
    invoice: { supplier: { id: number; legalName: string } };
};

@Injectable()
export default class GetBestSupplierService {
    constructor(
        private readonly insightsRepository: InsightsRepository
    ) {}

    async getBestSupplier(params: FiltersDto) {
        if (!params.productId) {
            throw new BadRequestException("Product ID is required");
        }

        const { start, end } = this.getDateWindow(params);
        const purchases = await this.insightsRepository.findPurchasesByProductInRange(
            Number(params.productId),
            start,
            end,
        );

        if (purchases.length === 0) {
            throw new NotFoundException("Nenhuma compra encontrada para esse produto no período informado.");
        }

        // Preços em unidades comerciais diferentes (ex.: "UN" vs "CX") não são
        // comparáveis entre si — comparar direto seria como dizer que uma caixa
        // fechada é mais cara que uma unidade avulsa. Fica só com o grupo da
        // unidade mais comum no período e descarta o resto da comparação.
        const { filtered: comparablePurchases, unit, excludedByUnit } = this.filterByDominantUnit(purchases);

        const cheapestBySupplier = this.groupCheapestBySupplier(comparablePurchases);
        const [best] = [...cheapestBySupplier.values()].sort((a, b) => a.unitPrice - b.unitPrice);

        return {
            supplier: best.legalName,
            unitPrice: best.unitPrice,
            commercialUnit: unit,
            suppliersCompared: cheapestBySupplier.size,
            // Com 1 fornecedor só não há comparação de verdade — é só o único
            // preço observado, não uma recomendação. O client decide o que
            // fazer com isso, mas o insight não finge que comparou algo.
            comparable: cheapestBySupplier.size >= 2,
            excludedByUnitMismatch: excludedByUnit,
        };
    }

    // O EAN identifica o produto do fabricante, mas nada impede duas notas
    // declararem unidades comerciais diferentes pra ele (uma vende a unidade,
    // outra vende a caixa fechada). Fica só com o grupo da unidade que mais
    // aparece no período — as outras não entram na comparação.
    private filterByDominantUnit(purchases: Purchase[]) {
        const countByUnit = new Map<string | null, number>();
        for (const purchase of purchases) {
            countByUnit.set(purchase.commercialUnit, (countByUnit.get(purchase.commercialUnit) ?? 0) + 1);
        }

        let dominantUnit: string | null = null;
        let dominantCount = -1;
        for (const [unit, count] of countByUnit) {
            if (count > dominantCount) {
                dominantUnit = unit;
                dominantCount = count;
            }
        }

        const filtered = purchases.filter((purchase) => purchase.commercialUnit === dominantUnit);
        return { filtered, unit: dominantUnit, excludedByUnit: purchases.length - filtered.length };
    }

    // Não dá pra usar groupBy/distinct do Prisma aqui porque supplierId vive em
    // Invoice, não em InvoiceItem — então o agrupamento por fornecedor é feito
    // em memória: mantém só a compra mais barata já vista de cada fornecedor.
    private groupCheapestBySupplier(purchases: Purchase[]) {
        const cheapestBySupplier = new Map<number, CheapestOffer>();

        for (const purchase of purchases) {
            const supplierId = purchase.invoice.supplier.id;
            const unitPrice = Number(purchase.unitPrice);
            const current = cheapestBySupplier.get(supplierId);

            if (!current || unitPrice < current.unitPrice) {
                cheapestBySupplier.set(supplierId, {
                    legalName: purchase.invoice.supplier.legalName,
                    unitPrice,
                });
            }
        }

        return cheapestBySupplier;
    }

    // Janela padrão: mês de referência (params.month/year, ou o mês atual se
    // não vier nada) + o mês imediatamente anterior. Isso evita comparar preço
    // de hoje com preço de meses atrás, sem exigir que sempre haja compra no
    // mês corrente pra ter uma resposta.
    private getDateWindow(params: FiltersDto) {
        const now = new Date();
        const referenceYear = params.year ? Number(params.year) : now.getFullYear();
        const referenceMonth = params.month ? Number(params.month) : now.getMonth() + 1;

        const start = new Date(referenceYear, referenceMonth - 2, 1);
        const end = new Date(referenceYear, referenceMonth, 0, 23, 59, 59);

        return { start, end };
    }
}