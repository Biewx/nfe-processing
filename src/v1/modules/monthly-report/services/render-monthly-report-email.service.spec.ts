import RenderMonthlyReportEmailService from "./render-monthly-report-email.service";

describe("RenderMonthlyReportEmailService", () => {
    let service: RenderMonthlyReportEmailService;

    beforeEach(() => {
        service = new RenderMonthlyReportEmailService();
    });

    it("inclui o mês por extenso no assunto (mais amigável que '8/2026')", () => {
        const { subject } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [],
            priceIncreaseAlerts: [],
            normalSituationMessage: "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados.",
            mainSupplier: null,
        });

        expect(subject).toContain("agosto de 2026");
    });

    it("formata valores monetários no padrão brasileiro (vírgula decimal)", () => {
        const { html } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [
                {
                    product: "Papel A4",
                    actualSupplier: "Fornecedor Caro",
                    actualPrice: 1234.5,
                    recommendedSupplier: "Fornecedor Barato",
                    recommendedPrice: 8,
                    estimatedLoss: 10,
                },
            ],
            priceIncreaseAlerts: [],
            normalSituationMessage: null,
            mainSupplier: null,
        });

        expect(html).toContain("R$ 1.234,50");
        expect(html).not.toContain("1234.5");
    });

    it("escapa HTML no nome da empresa, fornecedor e produto (dado vem do XML da NFe, não é confiável)", () => {
        const { html } = service.render("A & B Ltda <script>", 8, 2026, {
            savingsOpportunities: [
                {
                    product: 'Produto "especial" <tag>',
                    actualSupplier: "Fornecedor & Cia",
                    actualPrice: 10,
                    recommendedSupplier: "Outro Fornecedor",
                    recommendedPrice: 8,
                    estimatedLoss: 10,
                },
            ],
            priceIncreaseAlerts: [],
            normalSituationMessage: null,
            mainSupplier: { name: "Fornecedor & Cia", percentage: "50.00" },
        });

        expect(html).not.toContain("<script>");
        expect(html).not.toContain('Produto "especial" <tag>');
        expect(html).toContain("A &amp; B Ltda &lt;script&gt;");
        expect(html).toContain("Fornecedor &amp; Cia");
        expect(html).toContain("Produto &quot;especial&quot; &lt;tag&gt;");
    });

    it("mostra a Situação Normal quando não há oportunidade nem alerta", () => {
        const { html } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [],
            priceIncreaseAlerts: [],
            normalSituationMessage: "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados.",
            mainSupplier: null,
        });

        expect(html).toContain("Nenhuma mudança relevante de preço identificada");
        expect(html).not.toContain("Oportunidades de Economia");
        expect(html).not.toContain("Alertas de Aumento de Preço");
    });

    it("mostra a seção de Oportunidades de Economia e omite a Situação Normal quando há conteúdo", () => {
        const { html } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [
                {
                    product: "Papel A4",
                    actualSupplier: "Fornecedor Caro",
                    actualPrice: 10,
                    recommendedSupplier: "Fornecedor Barato",
                    recommendedPrice: 8,
                    estimatedLoss: 10,
                },
            ],
            priceIncreaseAlerts: [],
            normalSituationMessage: null,
            mainSupplier: null,
        });

        expect(html).toContain("Oportunidades de Economia");
        expect(html).toContain("Papel A4");
        expect(html).toContain("Fornecedor Barato");
        expect(html).not.toContain("Nenhuma mudança relevante");
    });

    it("mostra a seção de Alertas de Aumento de Preço quando há alerta", () => {
        const { html } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [],
            priceIncreaseAlerts: [
                {
                    product: "Óleo de Soja",
                    supplier: "Fornecedor X",
                    percentageChange: 15,
                    previousPrice: 8,
                    currentPrice: 9.2,
                },
            ],
            normalSituationMessage: null,
            mainSupplier: null,
        });

        expect(html).toContain("Alertas de Aumento de Preço");
        expect(html).toContain("Óleo de Soja");
        expect(html).toContain("15.00%");
    });

    it("sempre inclui a linha do fornecedor principal quando presente, com ou sem alerta (FR-4)", () => {
        const { html } = service.render("Mercado do Zé", 8, 2026, {
            savingsOpportunities: [],
            priceIncreaseAlerts: [],
            normalSituationMessage: "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados.",
            mainSupplier: { name: "Atacadão", percentage: "60.00" },
        });

        expect(html).toContain("Atacadão");
        expect(html).toContain("60.00%");
        expect(html).toContain("respondendo por");
    });
});
