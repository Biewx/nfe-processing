import { Module } from "@nestjs/common";
import InsightsController from "./insights.controller";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import ExpensesService from "../analytics/services/expenses.service";
import AnalyticsRepository from "../analytics/repositories/analytics.repository";
import { PrismaService } from "prisma/prisma.service";
import GetBestSupplierService from "./services/get-best-supplier.service";
import InsightsRepository from "./repositories/insights.repository";

@Module({
    imports: [],
    controllers: [InsightsController],
    providers: [
        GetMonthComparisionService,
        GetBestSupplierService,
        ExpensesService,
        AnalyticsRepository,
        InsightsRepository,
        PrismaService
    ]
})
export class InsightsModule {}