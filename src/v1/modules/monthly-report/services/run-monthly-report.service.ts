import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import MonthlyReportRepository from "../repositories/monthly-report.repository";
import CheckReportEligibilityService from "./check-report-eligibility.service";
import ComposeMonthlyReportService from "./compose-monthly-report.service";
import RenderMonthlyReportEmailService from "./render-monthly-report-email.service";
import SendMonthlyReportEmailService from "./send-monthly-report-email.service";
import { getPreviousReferenceMonth } from "../utils/get-previous-reference-month";

// Margem de segurança sobre o teto de 300/dia do Brevo (AD-6).
const MAX_RECIPIENTS_PER_DAY = 280;
// NFR1: acima disso, distribui em vez de agendar tudo pra agora.
const DISTRIBUTION_THRESHOLD = 250;

type ScheduleEntry = {
    companyId: number;
    referenceMonth: number;
    referenceYear: number;
    scheduledAt: Date;
};

@Injectable()
export default class RunMonthlyReportService {
    private readonly logger = new Logger(RunMonthlyReportService.name);

    constructor(
        private readonly monthlyReportRepository: MonthlyReportRepository,
        private readonly checkReportEligibilityService: CheckReportEligibilityService,
        private readonly composeMonthlyReportService: ComposeMonthlyReportService,
        private readonly renderMonthlyReportEmailService: RenderMonthlyReportEmailService,
        private readonly sendMonthlyReportEmailService: SendMonthlyReportEmailService,
    ) {}

    // FR-5: dispara todo dia 1, de madrugada ([ASSUMPTION] do PRD, a
    // confirmar). Só decide elegibilidade e agenda (AD-6) -- não compõe nem
    // envia nada aqui, isso é trabalho do drain (Story 2.2). Precisa de
    // ScheduleModule.forRoot() no AppModule pra disparar de verdade.
    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async scheduleMonthlyCycle(): Promise<void> {
        const { month: referenceMonth, year: referenceYear } = getPreviousReferenceMonth();

        const companyIds = await this.monthlyReportRepository.findAllCompanyIds();

        // checagens independentes entre si -- rodar em paralelo em vez de
        // uma de cada vez (achado no code-review)
        const eligibilityResults = await Promise.all(
            companyIds.map(async (companyId) => ({
                companyId,
                eligible: await this.checkReportEligibilityService.isEligible(companyId),
            })),
        );
        const eligibleCompanyIds = eligibilityResults.filter((r) => r.eligible).map((r) => r.companyId);

        if (eligibleCompanyIds.length === 0) {
            this.logger.log(`Ciclo ${referenceMonth}/${referenceYear}: nenhuma empresa elegível.`);
            return;
        }

        const userCountByCompany = await this.monthlyReportRepository.countUsersByCompany(eligibleCompanyIds);

        // Empresa elegível sem nenhum usuário cadastrado não tem pra quem
        // enviar -- agendá-la só geraria um FAILED permanente e previsível
        // (sendMail sem destinatário), achado no code-review.
        const companiesWithRecipients = eligibleCompanyIds.filter((id) => (userCountByCompany.get(id) ?? 0) > 0);
        if (companiesWithRecipients.length < eligibleCompanyIds.length) {
            this.logger.warn(
                `Ciclo ${referenceMonth}/${referenceYear}: ${eligibleCompanyIds.length - companiesWithRecipients.length} empresa(s) elegível(is) sem usuário cadastrado, não agendada(s).`,
            );
        }

        const entries = this.buildScheduleEntries(companiesWithRecipients, userCountByCompany, referenceMonth, referenceYear);

        await this.monthlyReportRepository.createPendingRuns(entries);
        this.logger.log(`Ciclo ${referenceMonth}/${referenceYear}: ${entries.length} empresa(s) agendada(s).`);
    }

    // AD-6: abaixo do limiar, todo mundo agendado pra agora. Acima, distribui
    // ao longo de quantos dias forem necessários pra manter cada dia com no
    // máximo MAX_RECIPIENTS_PER_DAY destinatários -- nunca só dentro de um
    // único dia, senão um ciclo grande estoura o teto diário de qualquer
    // jeito (achado da Reviewer Gate da Architecture).
    //
    // Limite conhecido (achado no code-review): uma ÚNICA empresa cujo
    // userCount já passa de MAX_RECIPIENTS_PER_DAY sozinha estoura o teto do
    // dia mesmo assim -- não tem como evitar sem violar a AD-5 (1 sendMail
    // por empresa, nunca dividido entre os usuários dela). Não é bug
    // corrigível aqui, é um limite real do desenho; documentado, não
    // escondido.
    private buildScheduleEntries(
        companyIds: number[],
        userCountByCompany: Map<number, number>,
        referenceMonth: number,
        referenceYear: number,
    ): ScheduleEntry[] {
        const now = new Date();
        const totalRecipients = companyIds.reduce((sum, id) => sum + (userCountByCompany.get(id) ?? 0), 0);

        if (totalRecipients <= DISTRIBUTION_THRESHOLD) {
            return companyIds.map((companyId) => ({ companyId, referenceMonth, referenceYear, scheduledAt: now }));
        }

        let dayOffset = 0;
        let recipientsScheduledToday = 0;

        return companyIds.map((companyId) => {
            const userCount = userCountByCompany.get(companyId) ?? 0;

            if (recipientsScheduledToday > 0 && recipientsScheduledToday + userCount > MAX_RECIPIENTS_PER_DAY) {
                dayOffset += 1;
                recipientsScheduledToday = 0;
            }
            recipientsScheduledToday += userCount;

            const scheduledAt = new Date(now);
            scheduledAt.setDate(scheduledAt.getDate() + dayOffset);

            return { companyId, referenceMonth, referenceYear, scheduledAt };
        });
    }

    // AD-6: aqui é onde a composição/renderização/envio de verdade
    // acontecem -- o cron mensal só agenda. Roda em intervalo curto pra
    // drenar aos poucos os PENDING que já chegaram na hora, distribuindo o
    // volume ao longo do dia/dias conforme scheduleMonthlyCycle decidiu.
    @Cron(CronExpression.EVERY_10_MINUTES)
    async drainPendingRuns(): Promise<void> {
        const dueRuns = await this.monthlyReportRepository.findDuePendingRuns(new Date());

        for (const run of dueRuns) {
            // AD-5: reivindica atomicamente antes de fazer qualquer trabalho.
            // Se outro tick (ou outra instância do processo) já pegou essa
            // linha entre o findDuePendingRuns e agora, claimRun devolve
            // false e este tick simplesmente pula -- sem enviar de novo.
            const claimed = await this.monthlyReportRepository.claimRun(run.id);
            if (!claimed) {
                continue;
            }

            // AD-7: cada empresa isolada -- uma exceção aqui nunca impede as
            // próximas do mesmo lote de serem processadas.
            try {
                const report = await this.composeMonthlyReportService.composeFullReport(
                    run.companyId,
                    run.referenceMonth,
                    run.referenceYear,
                );
                const recipients = run.company.users.map((user) => user.email);
                const { subject, html } = this.renderMonthlyReportEmailService.render(
                    run.company.name,
                    run.referenceMonth,
                    run.referenceYear,
                    report,
                );

                await this.sendMonthlyReportEmailService.sendMonthlyReport(recipients, subject, html);
                await this.monthlyReportRepository.markSent(run.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(
                    `Ciclo ${run.referenceMonth}/${run.referenceYear}, empresa ${run.companyId}: falha no envio -- ${errorMessage}`,
                );
                await this.monthlyReportRepository.markFailed(run.id, errorMessage);
            }
        }
    }
}
