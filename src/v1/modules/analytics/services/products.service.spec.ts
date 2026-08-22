import ProductsService from "./products.service";

describe("ProductsService", () => {
    let service: ProductsService;
    let fakeRepository: { getBestSellingProduct: jest.Mock };
    const companyId = 99;

    beforeEach(() => {
        fakeRepository = {
            getBestSellingProduct: jest.fn(),
        };
        service = new ProductsService(fakeRepository as any);
    });

    it("busca o produto mais vendido filtrando só pela empresa quando nenhum outro param é informado", async () => {
        // Arrange
        const bestSellingProduct = { id: 1, productId: 10, quantity: 500 };
        fakeRepository.getBestSellingProduct.mockResolvedValue(bestSellingProduct);

        // Act
        const result = await service.getBestSellingProduct({}, companyId);

        // Assert: o filtro fica dentro de "invoice" porque a query real é
        // contra InvoiceItem, e companyId/supplierId/issuedAt são campos da
        // Invoice, não do item em si
        expect(fakeRepository.getBestSellingProduct).toHaveBeenCalledWith({
            invoice: { companyId },
        });
        expect(result).toBe(bestSellingProduct);
    });

    it("filtra por fornecedor e período quando informados", async () => {
        // Arrange
        fakeRepository.getBestSellingProduct.mockResolvedValue(null);

        // Act: fornecedor 5, mês 3 de 2026
        await service.getBestSellingProduct({ supplierId: 5, month: 3, year: 2026 }, companyId);

        // Assert
        expect(fakeRepository.getBestSellingProduct).toHaveBeenCalledWith({
            invoice: {
                companyId,
                supplierId: 5,
                issuedAt: {
                    gte: new Date(2026, 2, 1),
                    lte: new Date(2026, 3, 0, 23, 59, 59),
                },
            },
        });
    });
});
