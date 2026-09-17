import { Module } from "@nestjs/common";
import InsightsController from "./insights.controller";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import ExpensesService from "../analytics/services/expenses.service";
import AnalyticsRepository from "../analytics/repositories/analytics.repository";
import { PrismaService } from "prisma/prisma.service";
import GetBestSupplierService from "./services/get-best-supplier.service";
import InsightsRepository from "./repositories/insights.repository";
import GetProductPriceIncreaseService from "./services/get-product-price-increase.service";
import GetSavingsOpportunitiesService from "./services/get-savings-opportunities.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Module({
    imports: [],
    controllers: [InsightsController],
    providers: [
        GetMonthComparisionService,
        GetBestSupplierService,
        GetProductPriceIncreaseService,
        GetSavingsOpportunitiesService,
        ExpensesService,
        AnalyticsRepository,
        InsightsRepository,
        PrismaService,
        JwtAuthGuard
    ],
    // monthly-report consome estes services diretamente (AD-1) -- nunca os
    // redeclara como provider proprio, importa este modulo.
    exports: [
        GetSavingsOpportunitiesService,
        GetProductPriceIncreaseService,
    ]
})
export class InsightsModule {}