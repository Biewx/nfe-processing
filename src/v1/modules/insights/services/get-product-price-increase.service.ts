import { BadRequestException, Injectable } from "@nestjs/common";
import InsightsRepository from "../repositories/insights.repository";
import { FiltersDto } from "../../analytics/dtos/filters.dto";
import { getReferenceMonthWindow } from "../utils/get-reference-month-window";

// fora da classe porque não depende de nenhum parâmetro do método -- não faz
// sentido recriar esse valor toda vez que getProductPriceIncrease é chamado
const PRICE_INCREASE_ALERT_THRESHOLD = 10; // %

@Injectable()
export default class GetProductPriceIncreaseService {
    constructor(
        private readonly insightsRepository: InsightsRepository
    ) {}

    async getProductPriceIncrease(params: FiltersDto, companyId: number) {
        if (!params.productId) {
            throw new BadRequestException("Product ID is required");
        }

        const history = await this.insightsRepository.findPurchaseHistoryByProduct(params, companyId);

        // agrupa as compras por fornecedor -- cada fornecedor tem seu proprio
        // historico de preco, entao nao faz sentido comparar preco de um com
        // a media de outro (mesmo problema de unidade divergente que ja vimos
        // no GetBestSupplierService, so que agora com fornecedor)
        const bySupplier = new Map<number, typeof history>();

        for (const historyItem of history) {
            const existing = bySupplier.get(historyItem.invoice.supplier.id);
            if (existing) {
                existing.push(historyItem);
            } else {
                bySupplier.set(historyItem.invoice.supplier.id, [historyItem]);
            }
        }

        // Map nao vira JSON direito na resposta HTTP (JSON.stringify(map) da
        // "{}") -- transforma em array de pares [supplierId, compras[]] antes
        // de montar o resultado final
        const bySupplierArray = Array.from(bySupplier.entries());

        const result: Record<number, any> = {};

        // Quando um mes de referencia foi pedido, so essa janela -- nao "antes
        // do corte" -- decide quem tem uma compra "atual". Achado no
        // code-review: sem isso, um fornecedor sem nenhuma compra dentro do
        // mes de referencia mas com historico antigo (findPurchaseHistoryByProduct
        // so aplica corte SUPERIOR, AD-4) ainda aparecia com sua ultima compra
        // de meses atras tratada como "atual" -- um alerta de marco reportado
        // (e repetido) no relatorio de agosto.
        const referenceWindow = params.month && params.year
            ? getReferenceMonthWindow(params.month, params.year)
            : undefined;

        bySupplierArray.forEach((supplier) => {
            const supplierId = supplier[0];
            const purchases = supplier[1];

            // o repository ordena por issuedAt desc, entao o primeiro item da
            // lista e sempre a compra mais recente; o resto e o historico
            const [current, ...previousPurchases] = purchases;

            if (referenceWindow) {
                const purchasedAt = current.invoice.issuedAt;
                const purchasedInWindow = purchasedAt >= referenceWindow.start && purchasedAt <= referenceWindow.end;
                if (!purchasedInWindow) {
                    return;
                }
            }

            // sem compras anteriores, nao existe base pra comparar -- nao da
            // pra calcular uma media nem dizer se houve aumento de verdade.
            // sem esse guard, total/0 vira NaN e o alerta sai errado (falso
            // negativo) em vez de avisar "ainda nao sei".
            if (previousPurchases.length === 0) {
                result[supplierId] = {
                    supplier: current.invoice.supplier.legalName,
                    lastPrice: current.unitPrice,
                    previousAverage: null,
                    percentageChange: null,
                    alert: null,
                };
                return;
            }

            let total = 0;
            for (const purchase of previousPurchases) {
                total += Number(purchase.unitPrice);
            }
            const averageValue = total / previousPurchases.length;

            // "quanto o preco atual mudou EM RELACAO A BASE" -- o denominador
            // tem que ser a media anterior (o ponto de partida), nao o preco
            // novo, senao a porcentagem sai errada, principalmente em altas
            // grandes
            const percentageChange = ((Number(current.unitPrice) - averageValue) / averageValue) * 100;

            result[supplierId] = {
                supplier: current.invoice.supplier.legalName,
                lastPrice: current.unitPrice,
                previousAverage: Number(averageValue.toFixed(2)),
                percentageChange: Number(percentageChange.toFixed(2)),
                alert: percentageChange >= PRICE_INCREASE_ALERT_THRESHOLD,
            };
        });

        return result;
    }
}
