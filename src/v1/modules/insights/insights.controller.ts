import { Controller, Get, Query } from "@nestjs/common";
import { FiltersDto } from "../analytics/dtos/filters.dto";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import GetBestSupplierService from "./services/get-best-supplier.service";
import GetProductPriceIncreaseService from "./services/get-product-price-increase.service";

@Controller('insights')
export default class InsightsController{
    constructor(
        private readonly getMonthComparisionService: GetMonthComparisionService,
        private readonly getBestSupplierService: GetBestSupplierService,
        private readonly getProductPriceIncreaseService: GetProductPriceIncreaseService
    ){}

    @Get('/month_comparision')
    monthComparision(
        @Query() params: FiltersDto){
        return this.getMonthComparisionService.getMonthComparision(params)
    }
    @Get('/best_supplier')
    bestSupplier(
        @Query() params: FiltersDto){
        return this.getBestSupplierService.getBestSupplier(params)
    }
    @Get('/product_history')
    productHistory(
        @Query() params: FiltersDto){
        return this.getProductPriceIncreaseService.getProductPriceIncrease(params)
    }
}