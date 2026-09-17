import CheckReportEligibilityService from "./check-report-eligibility.service";

describe("CheckReportEligibilityService", () => {
    let service: CheckReportEligibilityService;
    let fakeRepository: { findDistinctProductInvoicePairs: jest.Mock };
    const companyId = 42;

    beforeEach(() => {
        fakeRepository = {
            findDistinctProductInvoicePairs: jest.fn(),
        };
        service = new CheckReportEligibilityService(fakeRepository as any);
    });

    it("é elegível quando um produto aparece em 2 notas fiscais distintas", async () => {
        // Arrange
        fakeRepository.findDistinctProductInvoicePairs.mockResolvedValue([
            { productId: 1, invoiceId: 10 },
            { productId: 1, invoiceId: 11 },
        ]);

        // Act
        const result = await service.isEligible(companyId);

        // Assert
        expect(result).toBe(true);
    });

    it("não é elegível quando o único produto aparece em só 1 nota fiscal", async () => {
        // Arrange
        fakeRepository.findDistinctProductInvoicePairs.mockResolvedValue([
            { productId: 1, invoiceId: 10 },
        ]);

        // Act
        const result = await service.isEligible(companyId);

        // Assert
        expect(result).toBe(false);
    });

    it("não é elegível quando a empresa não tem nenhuma compra com produto identificado", async () => {
        // Arrange
        fakeRepository.findDistinctProductInvoicePairs.mockResolvedValue([]);

        // Act
        const result = await service.isEligible(companyId);

        // Assert
        expect(result).toBe(false);
    });

    it("é elegível se pelo menos um produto satisfaz a condição, mesmo com outros abaixo do limite", async () => {
        // Arrange: produto 1 só tem 1 nota, produto 2 tem 2 -- basta o 2 pra empresa ser elegível
        fakeRepository.findDistinctProductInvoicePairs.mockResolvedValue([
            { productId: 1, invoiceId: 10 },
            { productId: 2, invoiceId: 20 },
            { productId: 2, invoiceId: 21 },
        ]);

        // Act
        const result = await service.isEligible(companyId);

        // Assert
        expect(result).toBe(true);
    });

    it("não aplica nenhum filtro de período -- elegibilidade é lifetime (FR-1)", async () => {
        // Arrange
        fakeRepository.findDistinctProductInvoicePairs.mockResolvedValue([
            { productId: 1, invoiceId: 10 },
            { productId: 1, invoiceId: 11 },
        ]);

        // Act
        await service.isEligible(companyId);

        // Assert: só o companyId é passado pro repository -- nenhuma janela de data
        expect(fakeRepository.findDistinctProductInvoicePairs).toHaveBeenCalledWith(companyId);
    });
});
