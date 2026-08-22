import ExpensesService from "./expenses.service";

describe("ExpensesService", () => {
    let service: ExpensesService;
    let fakeRepository: { getTotalExpenses: jest.Mock; getHighestExpenses: jest.Mock };
    const companyId = 99;

    beforeEach(() => {
        fakeRepository = {
            getTotalExpenses: jest.fn(),
            getHighestExpenses: jest.fn(),
        };
        service = new ExpensesService(fakeRepository as any);
    });

    it("busca o total de gastos filtrando só pela empresa quando nenhum outro param é informado", async () => {
        // Arrange
        fakeRepository.getTotalExpenses.mockResolvedValue(1500);

        // Act
        const result = await service.getTotalExpenses({}, companyId);

        // Assert: sem supplierId/month/year, o "where" mandado pro repository
        // só tem o companyId -- é isso que garante que nunca se vê dado de
        // outra empresa, mesmo sem nenhum filtro extra
        expect(fakeRepository.getTotalExpenses).toHaveBeenCalledWith({ companyId });
        expect(result).toBe(1500);
    });

    it("filtra por supplierId quando ele é informado", async () => {
        // Arrange
        fakeRepository.getTotalExpenses.mockResolvedValue(800);

        // Act
        await service.getTotalExpenses({ supplierId: 7 }, companyId);

        // Assert
        expect(fakeRepository.getTotalExpenses).toHaveBeenCalledWith({ companyId, supplierId: 7 });
    });

    it("filtra por período quando month e year são informados", async () => {
        // Arrange
        fakeRepository.getTotalExpenses.mockResolvedValue(1000);

        // Act: agosto de 2026
        await service.getTotalExpenses({ month: 8, year: 2026 }, companyId);

        // Assert: a janela do mês vai do dia 1 às 00:00 até o último dia às 23:59:59
        expect(fakeRepository.getTotalExpenses).toHaveBeenCalledWith({
            companyId,
            issuedAt: {
                gte: new Date(2026, 7, 1),
                lte: new Date(2026, 8, 0, 23, 59, 59),
            },
        });
    });

    it("busca a maior despesa aplicando o mesmo filtro de where", async () => {
        // Arrange
        const highestExpense = { id: 1, totalValue: 9999 };
        fakeRepository.getHighestExpenses.mockResolvedValue(highestExpense);

        // Act
        const result = await service.getHighestExpenses({ supplierId: 3 }, companyId);

        // Assert
        expect(fakeRepository.getHighestExpenses).toHaveBeenCalledWith({ companyId, supplierId: 3 });
        expect(result).toBe(highestExpense);
    });
});
