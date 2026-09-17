// Smoke test isolado do envio via Brevo -- testa só o transporte SMTP
// (SendMonthlyReportEmailService), sem precisar de nenhum dado no banco nem
// esperar o cron. Não faz parte de nenhuma story; é uma ferramenta de
// verificação manual, no mesmo espírito de scripts/report-preview.ts.
//
// Rodar com: npm run test:brevo -- --to=seuemail@gmail.com

import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import SendMonthlyReportEmailService from "../src/v1/modules/monthly-report/services/send-monthly-report-email.service";

function parseTo(): string {
    const match = process.argv.slice(2).find((arg) => arg.startsWith("--to="));
    if (!match) {
        throw new Error("Uso: npm run test:brevo -- --to=<seu-email>");
    }
    return match.split("=")[1];
}

async function main() {
    const to = parseTo();

    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const sendMonthlyReportEmailService = app.get(SendMonthlyReportEmailService);

        await sendMonthlyReportEmailService.sendMonthlyReport(
            [to],
            "Teste — Relatório Mensal de Inteligência de Compras",
            "<h1>Funcionou!</h1><p>Se você está lendo isso, o SMTP do Brevo está configurado certo.</p>",
        );

        console.log(`E-mail de teste enviado para ${to}. Confere a caixa de entrada (e o spam).`);
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error("Falha ao enviar:", error);
    process.exitCode = 1;
});
