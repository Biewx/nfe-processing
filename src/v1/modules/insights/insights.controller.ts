import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { FiltersDto } from "../analytics/dtos/filters.dto";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import GetBestSupplierService from "./services/get-best-supplier.service";
import GetProductPriceIncreaseService from "./services/get-product-price-increase.service";
import GetSavingsOpportunitiesService from "./services/get-savings-opportunities.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller('insights')
@UseGuards(JwtAuthGuard)
export default class InsightsController{
    constructor(
        private readonly getMonthComparisionService: GetMonthComparisionService,
        private readonly getBestSupplierService: GetBestSupplierService,
        private readonly getProductPriceIncreaseService: GetProductPriceIncreaseService,
        private readonly getSavingsOpportunitiesService: GetSavingsOpportunitiesService
    ){}

    @Get('/month_comparision')
    monthComparision(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.getMonthComparisionService.getMonthComparision(params, user.companyId)
    }
    @Get('/best_supplier')
    bestSupplier(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.getBestSupplierService.getBestSupplier(params, user.companyId)
    }
    @Get('/product_history')
    productHistory(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.getProductPriceIncreaseService.getProductPriceIncrease(params, user.companyId)
    }
    @Get('/savings_opportunities')
    savingsOpportunities(
        @CurrentUser() user){
        return this.getSavingsOpportunitiesService.getSavingsOpportunities(user.companyId)
    }
}
