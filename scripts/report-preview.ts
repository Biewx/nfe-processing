// Gera o conteúdo completo do Relatório Mensal de uma empresa/período sob
// demanda, sem esperar o cron mensal existir (Story 1.4, SM-2 do PRD) --
// serve pra validar exatamente o que o e-mail diria antes de qualquer
// automação de envio estar no ar. Com --send-to, também renderiza e envia
// de verdade (via Brevo) pro endereço informado -- útil pra ver o e-mail
// real, com formatação, e não só o JSON do conteúdo.
//
// Sobe o AppModule inteiro como contexto standalone do Nest (sem HTTP) pra
// reaproveitar o mesmo grafo de injeção de dependência da aplicação real.
// Diferente de prisma/seed.ts (que usa o PrismaClient cru só pra inserir
// dado), este script precisa dos services de verdade -- são o próprio
// ComposeMonthlyReportService/RenderMonthlyReportEmailService/
// SendMonthlyReportEmailService quem decidem conteúdo, formato e envio.
//
// Rodar com: npm run report:preview -- --companyId=1 --month=8 --year=2026
// Ou, pra também enviar por e-mail de verdade:
//   npm run report:preview -- --companyId=1 --month=8 --year=2026 --send-to=seuemail@gmail.com

import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { PrismaService } from "prisma/prisma.service";
import { AppModule } from "../src/app.module";
import ComposeMonthlyReportService from "../src/v1/modules/monthly-report/services/compose-monthly-report.service";
import RenderMonthlyReportEmailService from "../src/v1/modules/monthly-report/services/render-monthly-report-email.service";
import SendMonthlyReportEmailService from "../src/v1/modules/monthly-report/services/send-monthly-report-email.service";

function parseArgs(): { companyId: number; month: number; year: number; sendTo?: string } {
    const parsed: Record<string, string> = {};

    for (const arg of process.argv.slice(2)) {
        const match = arg.match(/^--([^=]+)=(.+)$/);
        if (match) {
            parsed[match[1]] = match[2];
        }
    }

    const companyId = Number(parsed.companyId);
    const month = Number(parsed.month);
    const year = Number(parsed.year);

    if (!companyId || !month || !year) {
        throw new Error(
            "Uso: npm run report:preview -- --companyId=<id> --month=<1-12> --year=<ano> [--send-to=<email>]",
        );
    }

    return { companyId, month, year, sendTo: parsed["send-to"] };
}

async function main() {
    const { companyId, month, year, sendTo } = parseArgs();

    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const composeMonthlyReportService = app.get(ComposeMonthlyReportService);
        const report = await composeMonthlyReportService.composeFullReport(companyId, month, year);

        console.log(JSON.stringify({ companyId, month, year, ...report }, null, 2));

        if (sendTo) {
            const prisma = app.get(PrismaService);
            const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

            const renderMonthlyReportEmailService = app.get(RenderMonthlyReportEmailService);
            const sendMonthlyReportEmailService = app.get(SendMonthlyReportEmailService);

            const { subject, html } = renderMonthlyReportEmailService.render(company.name, month, year, report);
            await sendMonthlyReportEmailService.sendMonthlyReport([sendTo], subject, html);

            console.log(`\nPreview enviado por e-mail pra ${sendTo} (assunto: "${subject}").`);
        }
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
