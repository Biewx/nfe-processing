import { Module } from "@nestjs/common";
import InsightsController from "./insights.controller";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import ExpensesService from "../analytics/services/expenses.service";
import AnalyticsRepository from "../analytics/repositories/analytics.repository";
import { PrismaService } from "prisma/prisma.service";

@Module({
    imports: [],
    controllers: [InsightsController],
    providers: [
        GetMonthComparisionService,
        ExpensesService,
        AnalyticsRepository,
        PrismaService
    ]
})
export class InsightsModule {}