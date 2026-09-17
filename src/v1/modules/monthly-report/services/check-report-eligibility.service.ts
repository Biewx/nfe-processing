import { Injectable } from "@nestjs/common";
import MonthlyReportRepository from "../repositories/monthly-report.repository";

// FR-1: 1 produto em 2+ notas distintas ja basta -- nao e uma media nem um
// minimo por produto, e o primeiro produto que bater essa marca decide.
const MIN_DISTINCT_INVOICES_PER_PRODUCT = 2;

@Injectable()
export default class CheckReportEligibilityService {
    constructor(
        private readonly monthlyReportRepository: MonthlyReportRepository
    ) {}

    // FR-1: uma empresa e elegivel se tiver pelo menos 1 produto comprado em
    // 2+ notas fiscais distintas, de qualquer fornecedor, em qualquer momento
    // do historico. Deliberadamente lifetime -- sem filtro de mes/ano aqui
    // (excecao documentada em AD-2 da Architecture: elegibilidade nao usa a
    // janela de mes de referencia que AD-3/AD-4/AD-8 usam).
    async isEligible(companyId: number): Promise<boolean> {
        const pairs = await this.monthlyReportRepository.findDistinctProductInvoicePairs(companyId);

        const invoiceCountByProduct = new Map<number, number>();
        for (const pair of pairs) {
            // productId nunca e null aqui -- o repository ja filtrou isso na
            // query (where: productId: { not: null } ), mas o Prisma nao
            // consegue expressar esse filtro no tipo do campo selecionado.
            const productId = pair.productId as number;
            invoiceCountByProduct.set(productId, (invoiceCountByProduct.get(productId) ?? 0) + 1);
        }

        for (const distinctInvoiceCount of invoiceCountByProduct.values()) {
            if (distinctInvoiceCount >= MIN_DISTINCT_INVOICES_PER_PRODUCT) {
                return true;
            }
        }

        return false;
    }
}
