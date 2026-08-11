import { BadRequestException } from "@nestjs/common";
import GetMonthComparisionService from "./get-month-comparision.service";

describe("GetMonthComparisionService", () => {
    let service: GetMonthComparisionService;
    let fakeExpensesService: { getTotalExpenses: jest.Mock };

    beforeEach(() => {
        // repara que fakeExpensesService é criado aqui e usado pra construir o
        // service, na MESMA variável que os testes abaixo vão configurar depois.
        // é isso que estava faltando antes: criar um fake novo dentro do "it"
        // não tem efeito nenhum, porque o service já foi montado com este aqui.
        fakeExpensesService = {
            getTotalExpenses: jest.fn(),
        };
        service = new GetMonthComparisionService(fakeExpensesService as any);
    });

    it("lança BadRequestException se month ou year não forem informados", async () => {
        // Arrange: nada a configurar no fake — a validação corta antes de
        // qualquer chamada a getTotalExpenses

        // Act + Assert
        await expect(service.getMonthComparision({})).rejects.toThrow(BadRequestException);
        expect(fakeExpensesService.getTotalExpenses).not.toHaveBeenCalled();
    });

    it("retorna trend 'increase' quando o mês atual gastou mais que a média anterior", async () => {
        // Arrange: o service chama getTotalExpenses 4 vezes, nesta ordem:
        // 1ª = mês atual, 2ª/3ª/4ª = os 3 meses anteriores.
        // cada .mockResolvedValueOnce programa UMA dessas chamadas, na ordem
        // em que forem encadeadas.
        fakeExpensesService.getTotalExpenses
            .mockResolvedValueOnce(100) // mês atual
            .mockResolvedValueOnce(50) // mês -1
            .mockResolvedValueOnce(50) // mês -2
            .mockResolvedValueOnce(50); // mês -3

        // Act
        const result = await service.getMonthComparision({ month: 1, year: 2023 });

        // Assert
        // previousAverage = (50 + 50 + 50) / 3 = 50
        // percentageChange = (100 - 50) / 50 * 100 = 100
        expect(result.currentTotal).toBe(100);
        expect(result.previousAverage).toBe(50);
        expect(result.percentageChange).toBe(100);
        expect(result.trend).toBe("increase");

        // bônus: confirma que as 4 chamadas esperadas realmente aconteceram
        expect(fakeExpensesService.getTotalExpenses).toHaveBeenCalledTimes(4);
    });

    it("retorna trend 'decrease' quando o mês atual gastou menos que a média anterior", async () => {
        // Arrange
        fakeExpensesService.getTotalExpenses
            .mockResolvedValueOnce(40) // mês atual
            .mockResolvedValueOnce(80) // mês -1
            .mockResolvedValueOnce(80) // mês -2
            .mockResolvedValueOnce(80); // mês -3

        // Act
        const result = await service.getMonthComparision({ month: 1, year: 2023 });

        // Assert
        // previousAverage = (80 + 80 + 80) / 3 = 80
        // percentageChange = (40 - 80) / 80 * 100 = -50
        expect(result.previousAverage).toBe(80);
        expect(result.percentageChange).toBe(-50);
        expect(result.trend).toBe("decrease");
    });

    it("retorna trend 'stable' quando o mês atual gastou igual à média anterior", async () => {
        // Arrange: todos os 4 meses com o mesmo gasto
        fakeExpensesService.getTotalExpenses
            .mockResolvedValueOnce(60)
            .mockResolvedValueOnce(60)
            .mockResolvedValueOnce(60)
            .mockResolvedValueOnce(60);

        // Act
        const result = await service.getMonthComparision({ month: 1, year: 2023 });

        // Assert: percentageChange deve dar exatamente 0
        expect(result.percentageChange).toBe(0);
        expect(result.trend).toBe("stable");
    });

    it("retorna percentageChange e trend nulos quando não houve gasto nos meses anteriores", async () => {
        // Arrange: os 3 meses anteriores vêm zerados — previousAverage vai dar 0,
        // e dividir por 0 não faz sentido, então o service devolve null em vez
        // de tentar calcular uma porcentagem
        fakeExpensesService.getTotalExpenses
            .mockResolvedValueOnce(100) // mês atual
            .mockResolvedValueOnce(0) // mês -1
            .mockResolvedValueOnce(0) // mês -2
            .mockResolvedValueOnce(0); // mês -3

        // Act
        const result = await service.getMonthComparision({ month: 1, year: 2023 });

        // Assert
        expect(result.previousAverage).toBe(0);
        expect(result.percentageChange).toBeNull();
        expect(result.trend).toBeNull();
    });
});
