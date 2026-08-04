import { BadRequestException, Injectable } from "@nestjs/common";
import ExpensesService from "../../analytics/services/expenses.service";
import { FiltersDto } from "../../analytics/dtos/filters.dto";

const MONTHS_IN_BASELINE = 3;

@Injectable()
export default class GetMonthComparisionService {

    constructor(
        private readonly expensesService: ExpensesService
    ) {}

    async getMonthComparision(params: FiltersDto) {
        if (!params.month || !params.year) {
            throw new BadRequestException("Os parâmetros 'month' e 'year' são obrigatórios.");
        }

        const offsets = Array.from({ length: MONTHS_IN_BASELINE + 1 }, (_, offset) => offset);
        const [currentTotal, ...previousTotals] = await Promise.all(
            offsets.map((offset) => this.getExpensesForOffset(params, offset)),
        );

        const previousAverage = previousTotals.reduce((sum, value) => sum + value, 0) / MONTHS_IN_BASELINE;
        const percentageChange = previousAverage === 0
            ? null
            : ((currentTotal - previousAverage) / previousAverage) * 100;

        return {
            currentTotal,
            previousAverage,
            percentageChange,
            trend: this.getTrend(percentageChange),
        };
    }

    private async getExpensesForOffset(params: FiltersDto, offset: number) {
        const reference = new Date(Number(params.year), Number(params.month) - 1 - offset, 1);
        const total = await this.expensesService.getTotalExpenses({
            ...params,
            month: reference.getMonth() + 1,
            year: reference.getFullYear(),
        });
        return Number(total ?? 0);
    }

    private getTrend(percentageChange: number | null) {
        if (percentageChange === null) return null;
        if (percentageChange > 0) return "increase";
        if (percentageChange < 0) return "decrease";
        return "stable";
    }
}
