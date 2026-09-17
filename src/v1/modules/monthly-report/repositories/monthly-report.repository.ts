import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class MonthlyReportRepository {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    // Traz cada par (produto, nota fiscal) uma unica vez -- o "distinct" aqui
    // e o que garante que duas linhas do mesmo produto na mesma nota nao
    // contam como 2 notas diferentes. Contar quantas notas distintas cada
    // produto tem e decidir se isso basta pra elegibilidade e trabalho do
    // service (CheckReportEligibilityService); o repository so busca dado.
    async findDistinctProductInvoicePairs(companyId: number) {
        return this.prisma.invoiceItem.findMany({
            where: {
                productId: { not: null },
                invoice: { companyId },
            },
            distinct: ['productId', 'invoiceId'],
            select: {
                productId: true,
                invoiceId: true,
            },
        });
    }

    // FR-3/AD-4: produtos distintos comprados pela empresa dentro do mes de
    // referencia. E a partir dessa lista que o ComposeMonthlyReportService
    // decide, produto por produto, se chama GetProductPriceIncreaseService --
    // ele mesmo nao sabe comparar preco, so busca "quais produtos entram na
    // rodada".
    async findDistinctProductsPurchasedInPeriod(companyId: number, range: { start: Date; end: Date }) {
        return this.prisma.invoiceItem.findMany({
            where: {
                productId: { not: null },
                invoice: {
                    companyId,
                    issuedAt: { gte: range.start, lte: range.end },
                },
            },
            distinct: ['productId'],
            select: {
                productId: true,
                description: true,
            },
        });
    }

    // FR-5: todas as empresas cadastradas -- o cron mensal itera sobre elas
    // pra checar elegibilidade uma por uma (CheckReportEligibilityService).
    async findAllCompanyIds(): Promise<number[]> {
        const companies = await this.prisma.company.findMany({ select: { id: true } });
        return companies.map((company) => company.id);
    }

    // Quantos usuários cada empresa elegível tem -- é a base pra decidir se o
    // ciclo passa do limiar de distribuição (AD-6, NFR1: "empresas × usuários
    // elegíveis").
    async countUsersByCompany(companyIds: number[]): Promise<Map<number, number>> {
        const counts = await this.prisma.user.groupBy({
            by: ['companyId'],
            where: { companyId: { in: companyIds } },
            _count: { id: true },
        });

        return new Map(counts.map((count) => [count.companyId, count._count.id]));
    }

    // AD-5: cria uma linha PENDING por empresa agendada. `skipDuplicates`
    // é o que garante a idempotência de verdade -- se o job mensal rodar
    // duas vezes no mesmo ciclo, a segunda chamada não gera linha duplicada
    // pra uma empresa que já tem registro pro mesmo (companyId,
    // referenceMonth, referenceYear), sem precisar checar antes.
    async createPendingRuns(
        entries: { companyId: number; referenceMonth: number; referenceYear: number; scheduledAt: Date }[],
    ): Promise<void> {
        if (entries.length === 0) {
            return;
        }

        await this.prisma.monthlyReportRun.createMany({
            data: entries,
            skipDuplicates: true,
        });
    }

    // AD-6: linhas PENDING cujo scheduledAt já chegou -- é sobre essas que o
    // drain trabalha em cada tick. Traz junto a empresa e o e-mail de cada
    // usuário dela, porque é exatamente disso que o envio precisa (AD-5).
    async findDuePendingRuns(now: Date) {
        return this.prisma.monthlyReportRun.findMany({
            where: {
                status: "PENDING",
                scheduledAt: { lte: now },
            },
            include: {
                company: {
                    include: {
                        users: { select: { email: true } },
                    },
                },
            },
        });
    }

    // AD-5: a transição PENDING -> SENDING só acontece se a linha ainda
    // estiver PENDING no banco na hora exata desta escrita -- é essa
    // condição no `where`, não o valor de scheduledAt, que impede dois ticks
    // do drain sobrepostos (ou duas instâncias do processo) enviarem a mesma
    // empresa duas vezes. `count === 1` diz se ESTA chamada foi quem
    // reivindicou a linha; `count === 0` significa que outra já pegou antes.
    async claimRun(runId: number): Promise<boolean> {
        const result = await this.prisma.monthlyReportRun.updateMany({
            where: { id: runId, status: "PENDING" },
            data: { status: "SENDING" },
        });
        return result.count === 1;
    }

    async markSent(runId: number): Promise<void> {
        await this.prisma.monthlyReportRun.update({
            where: { id: runId },
            data: { status: "SENT", sentAt: new Date() },
        });
    }

    // AD-7: chamado pelo coordinator quando compor, renderizar ou enviar
    // falha pra UMA empresa -- nunca impede as outras de seguirem.
    async markFailed(runId: number, errorMessage: string): Promise<void> {
        await this.prisma.monthlyReportRun.update({
            where: { id: runId },
            data: { status: "FAILED", errorMessage },
        });
    }
}
