import SuppliersService from "./suppliers.service";

describe("SuppliersService", () => {
    let service: SuppliersService;
    let fakeRepository: {
        getTotalExpenses: jest.Mock;
        getSupplierExpenses: jest.Mock;
        getSuppliersById: jest.Mock;
    };

    beforeEach(() => {
        fakeRepository = {
            getTotalExpenses: jest.fn(),
            getSupplierExpenses: jest.fn(),
            getSuppliersById: jest.fn(),
        };
        // o construtor também pede um PrismaService, mas o service nunca usa
        // ele de verdade dentro da lógica — só o analyticsRepository. Por isso
        // um objeto vazio serve de fake aqui.
        service = new SuppliersService({} as any, fakeRepository as any);
    });

    it("monta nome, total e percentual de cada fornecedor no ranking", async () => {
        // Arrange: gasto total do período e os 2 fornecedores que mais compraram
        fakeRepository.getTotalExpenses.mockResolvedValue(1000);
        fakeRepository.getSupplierExpenses.mockResolvedValue([
            { supplierId: 1, _sum: { totalValue: 500 } },
            { supplierId: 2, _sum: { totalValue: 300 } },
        ]);
        fakeRepository.getSuppliersById.mockResolvedValue([
            { id: 1, legalName: "Fornecedor A" },
            { id: 2, legalName: "Fornecedor B" },
        ]);

        // Act
        const result = await service.getTopSellerSuppliers({}, 99);

        // Assert: fornecedor 1 gastou 500 de 1000 no total = 50%;
        // fornecedor 2 gastou 300 de 1000 = 30%.
        // repara que o service devolve a porcentagem como STRING (usa
        // .toFixed(2) internamente), não como number — o teste reflete isso.
        expect(result).toEqual({
            1: { name: "Fornecedor A", total: 500, percentage: "50.00" },
            2: { name: "Fornecedor B", total: 300, percentage: "30.00" },
        });
    });

    it("busca só os fornecedores dos ids retornados por getSupplierExpenses", async () => {
        // Arrange
        fakeRepository.getTotalExpenses.mockResolvedValue(100);
        fakeRepository.getSupplierExpenses.mockResolvedValue([
            { supplierId: 9, _sum: { totalValue: 100 } },
        ]);
        fakeRepository.getSuppliersById.mockResolvedValue([
            { id: 9, legalName: "Fornecedor Único" },
        ]);

        // Act
        await service.getTopSellerSuppliers({}, 99);

        // Assert: getSuppliersById precisa ser chamado com a lista de ids que
        // vieram de getSupplierExpenses, não com todos os fornecedores
        expect(fakeRepository.getSuppliersById).toHaveBeenCalledWith([9]);
    });
});
