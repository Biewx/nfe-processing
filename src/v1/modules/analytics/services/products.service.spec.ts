import ProductsService from "./products.service";

describe("ProductsService", () => {
    let service: ProductsService;
    let fakeRepository: { getBestSellingProduct: jest.Mock };

    beforeEach(() => {
        fakeRepository = {
            getBestSellingProduct: jest.fn(),
        };
        service = new ProductsService(fakeRepository as any);
    });

    it("busca o produto mais vendido sem filtro quando nenhum param é informado", async () => {
        // Arrange
        const bestSellingProduct = { id: 1, productId: 10, quantity: 500 };
        fakeRepository.getBestSellingProduct.mockResolvedValue(bestSellingProduct);

        // Act
        const result = await service.getBestSellingProduct({});

        // Assert
        expect(fakeRepository.getBestSellingProduct).toHaveBeenCalledWith({});
        expect(result).toBe(bestSellingProduct);
    });

    it("filtra por fornecedor e período quando informados", async () => {
        // Arrange
        fakeRepository.getBestSellingProduct.mockResolvedValue(null);

        // Act: fornecedor 5, mês 3 de 2026
        await service.getBestSellingProduct({ supplierId: 5, month: 3, year: 2026 });

        // Assert
        expect(fakeRepository.getBestSellingProduct).toHaveBeenCalledWith({
            supplierId: 5,
            issuedAt: {
                gte: new Date(2026, 2, 1),
                lte: new Date(2026, 3, 0, 23, 59, 59),
            },
        });
    });
});
