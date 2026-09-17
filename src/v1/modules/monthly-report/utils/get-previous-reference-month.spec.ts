import { getPreviousReferenceMonth } from "./get-previous-reference-month";

describe("getPreviousReferenceMonth", () => {
    it("volta pro mês anterior dentro do mesmo ano", () => {
        const result = getPreviousReferenceMonth(new Date(2026, 7, 1)); // 1º de agosto/2026

        expect(result).toEqual({ month: 7, year: 2026 }); // julho/2026
    });

    it("volta pra dezembro do ano anterior quando o mês corrente é janeiro", () => {
        const result = getPreviousReferenceMonth(new Date(2026, 0, 1)); // 1º de janeiro/2026

        expect(result).toEqual({ month: 12, year: 2025 }); // dezembro/2025
    });
});
