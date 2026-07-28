import { Module } from "@nestjs/common";
import AnalyticsController from "./analytics.controller";
import GetTotalSpentPerMonthService from "./services/expenses.service";
import AnalyticsRepository from "./repositories/analytics.repository";
import { PrismaService } from "prisma/prisma.service";
import ExpensesServices from "./services/expenses.service";
import SuppliersService from "./services/suppliers.service";
import ProductsService from "./services/products.service";

@Module({
    imports: [],
    controllers: [AnalyticsController],
    providers: [
        ExpensesServices,
        SuppliersService,
        ProductsService,
        AnalyticsRepository,
        PrismaService
    ]
})
export class AnalyticsModule {}