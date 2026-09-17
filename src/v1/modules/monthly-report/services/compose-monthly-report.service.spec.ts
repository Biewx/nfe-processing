import ComposeMonthlyReportService from "./compose-monthly-report.service";

describe("ComposeMonthlyReportService", () => {
    let service: ComposeMonthlyReportService;
    let fakeGetSavingsOpportunitiesService: { getSavingsOpportunities: jest.Mock };
    let fakeGetProductPriceIncreaseService: { getProductPriceIncrease: jest.Mock };
    let fakeSuppliersService: { getTopSellerSuppliers: jest.Mock };
    let fakeMonthlyReportRepository: { findDistinctProductsPurchasedInPeriod: jest.Mock };
    const companyId = 7;

    beforeEach(() => {
        fakeGetSavingsOpportunitiesService = {
            getSavingsOpportunities: jest.fn(),
        };
        fakeGetProductPriceIncreaseService = {
            getProductPriceIncrease: jest.fn(),
        };
        fakeSuppliersService = {
            getTopSellerSuppliers: jest.fn(),
        };
        fakeMonthlyReportRepository = {
            findDistinctProductsPurchasedInPeriod: jest.fn(),
        };
        service = new ComposeMonthlyReportService(
            fakeGetSavingsOpportunitiesService as any,
            fakeGetProductPriceIncreaseService as any,
            fakeSuppliersService as any,
            fakeMonthlyReportRepository as any,
        );

        // default: sem oportunidade/alerta e um fornecedor principal genérico
        // -- cada teste sobrescreve só o que precisa
        fakeGetSavingsOpportunitiesService.getSavingsOpportunities.mockResolvedValue([]);
        fakeGetProductPriceIncreaseService.getProductPriceIncrease.mockResolvedValue({});
        fakeMonthlyReportRepository.findDistinctProductsPurchasedInPeriod.mockResolvedValue([]);
        fakeSuppliersService.getTopSellerSuppliers.mockResolvedValue({
            1: { name: "Fornecedor Principal", total: 1000, percentage: "60.00" },
            2: { name: "Fornecedor Secundário", total: 400, percentage: "40.00" },
        });
    });

    describe("composeSavingsOpportunities", () => {
        it("repassa companyId, month e year pro service de insights, sem alterar o resultado", async () => {
            // Arrange
            const opportunities = [{ product: "Papel A4", estimatedLoss: 10 }];
            fakeGetSavingsOpportunitiesService.getSavingsOpportunities.mockResolvedValue(opportunities);

            // Act
            const result = await service.composeSavingsOpportunities(companyId, 8, 2026);

            // Assert
            expect(fakeGetSavingsOpportunitiesService.getSavingsOpportunities).toHaveBeenCalledWith(companyId, 8, 2026);
            expect(result).toBe(opportunities);
        });
    });

    describe("composePriceIncreaseAlerts", () => {
        it("devolve lista vazia quando nenhum produto foi comprado no período", async () => {
            // Arrange
            fakeMonthlyReportRepository.findDistinctProductsPurchasedInPeriod.mockResolvedValue([]);

            // Act
            const result = await service.composePriceIncreaseAlerts(companyId, 8, 2026);

            // Assert
            expect(result).toEqual([]);
            expect(fakeGetProductPriceIncreaseService.getProductPriceIncrease).not.toHaveBeenCalled();
        });

        it("inclui só os fornecedores com alert === true, com Produto preenchido", async () => {
            // Arrange
            fakeMonthlyReportRepository.findDistinctProductsPurchasedInPeriod.mockResolvedValue([
                { productId: 1, description: "Papel A4" },
            ]);
            fakeGetProductPriceIncreaseService.getProductPriceIncrease.mockResolvedValue({
                10: {
                    supplier: "Fornecedor Caro",
                    lastPrice: 12,
                    previousAverage: 10,
                    percentageChange: 20,
                    alert: true,
                },
                11: {
                    supplier: "Fornecedor Estável",
                    lastPrice: 5,
                    previousAverage: 5,
                    percentageChange: 0,
                    alert: false,
                },
            });

            // Act
            const result = await service.composePriceIncreaseAlerts(companyId, 8, 2026);

            // Assert
            expect(fakeGetProductPriceIncreaseService.getProductPriceIncrease).toHaveBeenCalledWith(
                { month: 8, year: 2026, productId: 1 },
                companyId,
            );
            expect(result).toEqual([
                {
                    product: "Papel A4",
                    supplier: "Fornecedor Caro",
                    percentageChange: 20,
                    previousPrice: 10,
                    currentPrice: 12,
                },
            ]);
        });

        it("avalia cada produto do período de forma independente", async () => {
            // Arrange
            fakeMonthlyReportRepository.findDistinctProductsPurchasedInPeriod.mockResolvedValue([
                { productId: 1, description: "Papel A4" },
                { productId: 2, description: "Caneta Azul" },
            ]);
            fakeGetProductPriceIncreaseService.getProductPriceIncrease
                .mockResolvedValueOnce({ 10: { supplier: "A", lastPrice: 12, previousAverage: 10, percentageChange: 20, alert: true } })
                .mockResolvedValueOnce({ 11: { supplier: "B", lastPrice: 2, previousAverage: 2, percentageChange: 0, alert: false } });

            // Act
            const result = await service.composePriceIncreaseAlerts(companyId, 8, 2026);

            // Assert: só o Papel A4 gerou alerta
            expect(result).toHaveLength(1);
            expect(result[0].product).toBe("Papel A4");
        });
    });

    describe("composeFullReport", () => {
        it("mostra a Situação Normal quando não há oportunidade nem alerta no período", async () => {
            // Arrange: defaults do beforeEach já não têm oportunidade nem alerta

            // Act
            const result = await service.composeFullReport(companyId, 8, 2026);

            // Assert
            expect(result.normalSituationMessage).toBe(
                "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados.",
            );
        });

        it("não mostra a Situação Normal quando existe alguma oportunidade de economia", async () => {
            // Arrange
            fakeGetSavingsOpportunitiesService.getSavingsOpportunities.mockResolvedValue([
                { product: "Papel A4", estimatedLoss: 10 },
            ]);

            // Act
            const result = await service.composeFullReport(companyId, 8, 2026);

            // Assert
            expect(result.normalSituationMessage).toBeNull();
            expect(result.savingsOpportunities).toHaveLength(1);
        });

        it("sempre inclui o fornecedor principal, com ou sem alerta", async () => {
            // Act
            const result = await service.composeFullReport(companyId, 8, 2026);

            // Assert: o de 60% é o principal, não o de 40%
            expect(result.mainSupplier).toEqual({ name: "Fornecedor Principal", total: 1000, percentage: "60.00" });
        });

        it("mainSupplier vem nulo quando a empresa não tem nenhum fornecedor no período", async () => {
            // Arrange
            fakeSuppliersService.getTopSellerSuppliers.mockResolvedValue({});

            // Act
            const result = await service.composeFullReport(companyId, 8, 2026);

            // Assert
            expect(result.mainSupplier).toBeNull();
        });
    });
});
