import { Controller, Get, Query } from "@nestjs/common";
import { FiltersDto } from "../analytics/dtos/filters.dto";
import GetMonthComparisionService from "./services/get-month-comparision.service";
import GetBestSupplierService from "./services/get-best-supplier.service";

@Controller('insights')
export default class InsightsController{
    constructor(
        private readonly getMonthComparisionService: GetMonthComparisionService,
        private readonly getBestSupplierService: GetBestSupplierService
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
}