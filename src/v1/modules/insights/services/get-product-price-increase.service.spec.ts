import { BadRequestException } from "@nestjs/common";
import GetProductPriceIncreaseService from "./get-product-price-increase.service";

describe("GetProductPriceIncreaseService", () => {
    let service: GetProductPriceIncreaseService;
    let fakeRepository: { findPurchaseHistoryByProduct: jest.Mock };

    beforeEach(() => {
        fakeRepository = {
            findPurchaseHistoryByProduct: jest.fn(),
        };
        service = new GetProductPriceIncreaseService(fakeRepository as any);
    });

    it("lança BadRequestException se productId não for informado", async () => {
        // Arrange: nada a configurar no fake — a validação corta antes de
        // qualquer chamada ao repository

        // Act + Assert
        await expect(service.getProductPriceIncrease({})).rejects.toThrow(BadRequestException);
        expect(fakeRepository.findPurchaseHistoryByProduct).not.toHaveBeenCalled();
    });

    it("marca alert true quando o aumento passa do threshold de 10%", async () => {
        // Arrange: o repository devolve ordenado do mais recente pro mais
        // antigo (mesmo formato que o insights.repository.ts produz de verdade)
        fakeRepository.findPurchaseHistoryByProduct.mockResolvedValue([
            { unitPrice: 57.5, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-07-25" } },
            { unitPrice: 51, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-06-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-05-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-04-25" } },
        ]);

        // Act
        const result = await service.getProductPriceIncrease({ productId: 1 });

        // Assert
        // previousAverage = (51 + 50 + 50) / 3 = 50.33
        // percentageChange = (57.5 - 50.33) / 50.33 * 100 = 14.24
        expect(result[1].supplier).toBe("Fornecedor A");
        expect(result[1].lastPrice).toBe(57.5);
        expect(result[1].previousAverage).toBe(50.33);
        expect(result[1].percentageChange).toBe(14.24);
        expect(result[1].alert).toBe(true);
    });

    it("marca alert false quando o aumento fica abaixo do threshold", async () => {
        // Arrange: variação pequena, não deveria disparar alerta
        fakeRepository.findPurchaseHistoryByProduct.mockResolvedValue([
            { unitPrice: 51, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-07-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-06-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-05-25" } },
        ]);

        // Act
        const result = await service.getProductPriceIncrease({ productId: 1 });

        // Assert: (51 - 50) / 50 * 100 = 2%
        expect(result[1].percentageChange).toBe(2);
        expect(result[1].alert).toBe(false);
    });

    it("marca alert false e percentageChange negativo quando o preço caiu", async () => {
        // Arrange
        fakeRepository.findPurchaseHistoryByProduct.mockResolvedValue([
            { unitPrice: 40, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-07-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-06-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-05-25" } },
        ]);

        // Act
        const result = await service.getProductPriceIncrease({ productId: 1 });

        // Assert: (40 - 50) / 50 * 100 = -20%
        expect(result[1].percentageChange).toBe(-20);
        expect(result[1].alert).toBe(false);
    });

    it("devolve previousAverage, percentageChange e alert nulos quando o fornecedor só tem uma compra", async () => {
        // Arrange: nenhuma compra anterior pra servir de base de comparação
        fakeRepository.findPurchaseHistoryByProduct.mockResolvedValue([
            { unitPrice: 40, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-07-25" } },
        ]);

        // Act
        const result = await service.getProductPriceIncrease({ productId: 1 });

        // Assert
        expect(result[1].lastPrice).toBe(40);
        expect(result[1].previousAverage).toBeNull();
        expect(result[1].percentageChange).toBeNull();
        expect(result[1].alert).toBeNull();
    });

    it("calcula cada fornecedor separadamente, sem misturar o histórico de um com o de outro", async () => {
        // Arrange: dois fornecedores diferentes vendendo o mesmo produto —
        // esse é o cenário que expõe o bug de agrupar pela chave errada
        fakeRepository.findPurchaseHistoryByProduct.mockResolvedValue([
            { unitPrice: 100, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-07-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 2, legalName: "Fornecedor B" }, issuedAt: "2026-07-20" } },
            { unitPrice: 50, invoice: { supplier: { id: 1, legalName: "Fornecedor A" }, issuedAt: "2026-06-25" } },
            { unitPrice: 50, invoice: { supplier: { id: 2, legalName: "Fornecedor B" }, issuedAt: "2026-06-20" } },
        ]);

        // Act
        const result = await service.getProductPriceIncrease({ productId: 1 });

        // Assert: fornecedor A subiu 100%, fornecedor B ficou estável
        expect(result[1].supplier).toBe("Fornecedor A");
        expect(result[1].percentageChange).toBe(100);
        expect(result[1].alert).toBe(true);

        expect(result[2].supplier).toBe("Fornecedor B");
        expect(result[2].percentageChange).toBe(0);
        expect(result[2].alert).toBe(false);
    });
});
