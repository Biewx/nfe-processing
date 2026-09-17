import { getReferenceMonthWindow } from "./get-reference-month-window";

describe("getReferenceMonthWindow", () => {
    it("começa no dia 1 do mês, 00:00", () => {
        const { start } = getReferenceMonthWindow(8, 2026);

        expect(start).toEqual(new Date(2026, 7, 1));
    });

    it("termina no último dia do mês, 23:59:59", () => {
        const { end } = getReferenceMonthWindow(8, 2026);

        expect(end).toEqual(new Date(2026, 7, 31, 23, 59, 59));
    });

    it("acerta o último dia de meses com 30 dias", () => {
        const { end } = getReferenceMonthWindow(4, 2026); // abril tem 30 dias

        expect(end.getDate()).toBe(30);
    });

    it("acerta fevereiro em ano bissexto", () => {
        const { end } = getReferenceMonthWindow(2, 2028); // 2028 é bissexto

        expect(end.getDate()).toBe(29);
    });

    it("acerta fevereiro fora de ano bissexto", () => {
        const { end } = getReferenceMonthWindow(2, 2026);

        expect(end.getDate()).toBe(28);
    });
});
