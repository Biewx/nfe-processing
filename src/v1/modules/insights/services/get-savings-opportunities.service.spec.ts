import GetSavingsOpportunitiesService from "./get-savings-opportunities.service";

describe("GetSavingsOpportunitiesService", () => {
    let service: GetSavingsOpportunitiesService;
    let fakeRepository: { findLatestPurchasePerProduct: jest.Mock };
    let fakeBestSupplierService: { getBestSupplier: jest.Mock };
    const companyId = 99;

    beforeEach(() => {
        fakeRepository = {
            findLatestPurchasePerProduct: jest.fn(),
        };
        fakeBestSupplierService = {
            getBestSupplier: jest.fn(),
        };
        service = new GetSavingsOpportunitiesService(
            fakeRepository as any,
            fakeBestSupplierService as any,
        );
    });

    it("devolve lista vazia quando não há nenhuma compra recente", async () => {
        // Arrange
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([]);

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert
        expect(result).toEqual([]);
        expect(fakeBestSupplierService.getBestSupplier).not.toHaveBeenCalled();
    });

    it("encontra uma oportunidade quando o fornecedor comprado não é o mais barato", async () => {
        // Arrange: comprou do "Fornecedor Caro" por 10, mas o mais barato era 8
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([
            {
                productId: 1,
                description: "Papel A4",
                quantity: 5,
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: {
                    issuedAt: new Date(2026, 6, 15), // julho de 2026
                    supplier: { id: 1, legalName: "Fornecedor Caro" },
                },
            },
        ]);
        fakeBestSupplierService.getBestSupplier.mockResolvedValue({
            supplier: "Fornecedor Barato",
            unitPrice: 8,
            commercialUnit: "UN",
            suppliersCompared: 2,
            comparable: true,
            excludedByUnitMismatch: 0,
        });

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert
        expect(fakeBestSupplierService.getBestSupplier).toHaveBeenCalledWith({
            productId: 1,
            month: 7,
            year: 2026,
        }, companyId);
        expect(result).toEqual([
            {
                product: "Papel A4",
                actualSupplier: "Fornecedor Caro",
                actualPrice: 10,
                recommendedSupplier: "Fornecedor Barato",
                recommendedPrice: 8,
                quantity: 5,
                estimatedLoss: 10, // (10 - 8) * 5
            },
        ]);
    });

    it("não gera oportunidade quando já comprou do fornecedor mais barato", async () => {
        // Arrange
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([
            {
                productId: 1,
                description: "Papel A4",
                quantity: 5,
                unitPrice: 8,
                commercialUnit: "UN",
                invoice: {
                    issuedAt: new Date(2026, 6, 15),
                    supplier: { id: 2, legalName: "Fornecedor Barato" },
                },
            },
        ]);
        fakeBestSupplierService.getBestSupplier.mockResolvedValue({
            supplier: "Fornecedor Barato",
            unitPrice: 8,
            commercialUnit: "UN",
            suppliersCompared: 2,
            comparable: true,
            excludedByUnitMismatch: 0,
        });

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert
        expect(result).toEqual([]);
    });

    it("não gera oportunidade quando só existe um fornecedor pra comparar", async () => {
        // Arrange: comparable false -- não há base pra recomendar ninguém
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([
            {
                productId: 1,
                description: "Papel A4",
                quantity: 5,
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: {
                    issuedAt: new Date(2026, 6, 15),
                    supplier: { id: 1, legalName: "Fornecedor Único" },
                },
            },
        ]);
        fakeBestSupplierService.getBestSupplier.mockResolvedValue({
            supplier: "Fornecedor Único",
            unitPrice: 10,
            commercialUnit: "UN",
            suppliersCompared: 1,
            comparable: false,
            excludedByUnitMismatch: 0,
        });

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert
        expect(result).toEqual([]);
    });

    it("não gera oportunidade quando a unidade comercial da compra diverge da unidade dominante", async () => {
        // Arrange: a última compra foi em "CX", mas a comparação do
        // GetBestSupplierService foi feita em cima da unidade "UN"
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([
            {
                productId: 1,
                description: "Papel A4",
                quantity: 5,
                unitPrice: 10,
                commercialUnit: "CX",
                invoice: {
                    issuedAt: new Date(2026, 6, 15),
                    supplier: { id: 1, legalName: "Fornecedor Caro" },
                },
            },
        ]);
        fakeBestSupplierService.getBestSupplier.mockResolvedValue({
            supplier: "Fornecedor Barato",
            unitPrice: 8,
            commercialUnit: "UN",
            suppliersCompared: 2,
            comparable: true,
            excludedByUnitMismatch: 1,
        });

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert
        expect(result).toEqual([]);
    });

    it("avalia cada produto de forma independente, só listando os que têm oportunidade", async () => {
        // Arrange: 2 produtos -- o primeiro tem oportunidade, o segundo não
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([
            {
                productId: 1,
                description: "Papel A4",
                quantity: 5,
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: {
                    issuedAt: new Date(2026, 6, 15),
                    supplier: { id: 1, legalName: "Fornecedor Caro" },
                },
            },
            {
                productId: 2,
                description: "Caneta Azul",
                quantity: 20,
                unitPrice: 2,
                commercialUnit: "UN",
                invoice: {
                    issuedAt: new Date(2026, 5, 10),
                    supplier: { id: 3, legalName: "Fornecedor Certo" },
                },
            },
        ]);
        fakeBestSupplierService.getBestSupplier
            .mockResolvedValueOnce({
                supplier: "Fornecedor Barato",
                unitPrice: 8,
                commercialUnit: "UN",
                suppliersCompared: 2,
                comparable: true,
                excludedByUnitMismatch: 0,
            })
            .mockResolvedValueOnce({
                supplier: "Fornecedor Certo",
                unitPrice: 2,
                commercialUnit: "UN",
                suppliersCompared: 2,
                comparable: true,
                excludedByUnitMismatch: 0,
            });

        // Act
        const result = await service.getSavingsOpportunities(companyId);

        // Assert: só o Papel A4 vira oportunidade
        expect(result).toHaveLength(1);
        expect(result[0].product).toBe("Papel A4");
    });

    it("sem month/year, não passa nenhuma janela pro repository (comportamento atual preservado)", async () => {
        // Arrange
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([]);

        // Act
        await service.getSavingsOpportunities(companyId);

        // Assert
        expect(fakeRepository.findLatestPurchasePerProduct).toHaveBeenCalledWith(companyId, undefined);
    });

    it("com month/year, passa a janela do mês de referência pro repository (AD-3)", async () => {
        // Arrange
        fakeRepository.findLatestPurchasePerProduct.mockResolvedValue([]);

        // Act
        await service.getSavingsOpportunities(companyId, 8, 2026);

        // Assert
        expect(fakeRepository.findLatestPurchasePerProduct).toHaveBeenCalledWith(companyId, {
            start: new Date(2026, 7, 1),
            end: new Date(2026, 7, 31, 23, 59, 59),
        });
    });
});
