import { Injectable } from "@nestjs/common";

type FullReport = {
    savingsOpportunities: {
        product: string;
        actualSupplier: string;
        actualPrice: number;
        recommendedSupplier: string;
        recommendedPrice: number;
        estimatedLoss: number;
    }[];
    priceIncreaseAlerts: {
        product: string;
        supplier: string;
        percentageChange: number;
        previousPrice: number;
        currentPrice: number;
    }[];
    normalSituationMessage: string | null;
    mainSupplier: { name: string; percentage: string } | null;
};

const MONTH_NAMES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// R$ 1.234,56 -- separador de milhar e decimal no padrão brasileiro, não o
// "1,234.56" que toFixed(2) sozinho produziria.
function formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonthYear(month: number, year: number): string {
    return `${MONTH_NAMES[month - 1]} de ${year}`;
}

// Nome de empresa, fornecedor e descrição de produto vêm do XML da NFe --
// dado externo, não digitado por um usuário confiável do sistema. Sem
// escapar, um "&" ou "<" na razão social de um fornecedor (achado no
// code-review) quebra o layout do e-mail ou injeta markup no HTML enviado a
// todos os usuários da empresa.
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Paleta e tipografia inline de propósito -- e-mail não é web: a maioria dos
// clientes (Gmail, Outlook) ignora <style> no <head> e CSS externo por
// completo. Tudo que precisa aparecer certo vai inline, estilo por estilo.
const COLORS = {
    ink: "#1b2320",
    inkSoft: "#5b675e",
    border: "#e2e8e4",
    surface: "#f6f8f6",
    accent: "#2f6f4e",
    accentSoft: "#e8f2ec",
    amber: "#8a5a12",
    amberSoft: "#faf1e0",
};

// Motor de template: string simples (template literal), sem lib nova --
// decisão de story (Deferred na Architecture), não muda nenhum invariante.
// Se o e-mail crescer em complexidade visual, revisitar (handlebars,
// react-email etc.) fica fácil de isolar já que tudo mora só aqui.
@Injectable()
export default class RenderMonthlyReportEmailService {
    render(companyName: string, month: number, year: number, report: FullReport): { subject: string; html: string } {
        const monthYear = formatMonthYear(month, year);
        const subject = `Relatório Mensal de Compras — ${monthYear}`;

        const sections: string[] = [];

        // FR-2
        if (report.savingsOpportunities.length > 0) {
            const cards = report.savingsOpportunities.map((opportunity) => this.renderSavingsCard(opportunity)).join("");
            sections.push(this.renderSection("💰 Oportunidades de Economia", cards));
        }

        // FR-3
        if (report.priceIncreaseAlerts.length > 0) {
            const cards = report.priceIncreaseAlerts.map((alert) => this.renderAlertCard(alert)).join("");
            sections.push(this.renderSection("📈 Alertas de Aumento de Preço", cards));
        }

        // FR-4: Situação Normal só entra quando nem FR-2 nem FR-3 geraram conteúdo.
        if (report.normalSituationMessage) {
            sections.push(`
                <tr><td style="padding:0 24px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.accentSoft};border-radius:8px;">
                        <tr><td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${COLORS.ink};">
                            ✅ ${report.normalSituationMessage}
                        </td></tr>
                    </table>
                </td></tr>
            `);
        }

        // FR-4: linha fixa de Fornecedor principal, com ou sem alerta -- texto-modelo
        // do PRD, sem lógica de limiar nova.
        if (report.mainSupplier) {
            sections.push(`
                <tr><td style="padding:0 24px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;">
                        <tr><td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${COLORS.inkSoft};">
                            🏆 Seu fornecedor principal este mês foi <strong style="color:${COLORS.ink};">${escapeHtml(report.mainSupplier.name)}</strong>,
                            respondendo por <strong style="color:${COLORS.ink};">${report.mainSupplier.percentage}%</strong> das suas compras —
                            vale avaliar se essa concentração te deixa numa boa posição pra negociar.
                        </td></tr>
                    </table>
                </td></tr>
            `);
        }

        const html = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
    <tr><td style="background:${COLORS.accent};padding:28px 24px;">
        <p style="margin:0;color:#ffffff;font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.85;">Relatório Mensal de Compras</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;">${escapeHtml(companyName)}</h1>
        <p style="margin:4px 0 0;color:#ffffff;font-size:14px;opacity:.9;">Referente a ${monthYear}</p>
    </td></tr>
    <tr><td style="height:20px;"></td></tr>
    ${sections.join("")}
    <tr><td style="padding:20px 24px;border-top:1px solid ${COLORS.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLORS.inkSoft};">
        Gerado automaticamente a partir das notas fiscais recebidas — nfe-processing.
    </td></tr>
</table>
</td></tr>
</table>`;

        return { subject, html };
    }

    private renderSection(title: string, cardsHtml: string): string {
        return `
            <tr><td style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 12px;font-size:16px;color:${COLORS.ink};">${title}</h2>
            </td></tr>
            <tr><td style="padding:0 24px 20px;">${cardsHtml}</td></tr>
        `;
    }

    private renderSavingsCard(opportunity: FullReport["savingsOpportunities"][number]): string {
        return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:10px;">
                <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:${COLORS.ink};">${escapeHtml(opportunity.product)}</p>
                    <p style="margin:0;font-size:13.5px;line-height:1.5;color:${COLORS.inkSoft};">
                        Comprado de <strong>${escapeHtml(opportunity.actualSupplier)}</strong> por ${formatCurrency(opportunity.actualPrice)},
                        enquanto <strong>${escapeHtml(opportunity.recommendedSupplier)}</strong> vendia por ${formatCurrency(opportunity.recommendedPrice)}.
                    </p>
                    <p style="margin:8px 0 0;font-size:13.5px;color:${COLORS.accent};font-weight:bold;">
                        Perda estimada: ${formatCurrency(opportunity.estimatedLoss)}
                    </p>
                </td></tr>
            </table>
        `;
    }

    private renderAlertCard(alert: FullReport["priceIncreaseAlerts"][number]): string {
        return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:10px;">
                <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:${COLORS.ink};">${escapeHtml(alert.product)} <span style="font-weight:normal;color:${COLORS.inkSoft};">— ${escapeHtml(alert.supplier)}</span></p>
                    <p style="margin:0;font-size:13.5px;line-height:1.5;color:${COLORS.inkSoft};">
                        Foi de ${formatCurrency(alert.previousPrice)} para ${formatCurrency(alert.currentPrice)}.
                    </p>
                    <p style="margin:8px 0 0;font-size:13.5px;color:${COLORS.amber};font-weight:bold;background:${COLORS.amberSoft};display:inline-block;padding:2px 8px;border-radius:999px;">
                        ▲ ${alert.percentageChange.toFixed(2)}%
                    </p>
                </td></tr>
            </table>
        `;
    }
}
