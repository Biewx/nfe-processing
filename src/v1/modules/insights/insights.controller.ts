import { Controller, Get, Query } from "@nestjs/common";
import { FiltersDto } from "../analytics/dtos/filters.dto";
import GetMonthComparisionService from "./services/get-month-comparision.service";

@Controller('insights')
export default class InsightsController{
    constructor(
        private readonly getMonthComparisionService: GetMonthComparisionService
    ){}

    @Get('/month_comparision')
    monthComparision(
        @Query() params: FiltersDto){
        return this.getMonthComparisionService.getMonthComparision(params)
    }
}