import { Injectable } from "@nestjs/common";
import { FiltersDto } from "../dtos/filters.dto";
import AnalyticsRepository from "../repositories/analytics.repository";

@Injectable()
export default class ProductsService{
    constructor(
        private readonly analyticsRepository: AnalyticsRepository
    ){}

    async getBestSellingProduct(params: FiltersDto){
        const where:any = {};

        if (params.supplierId){
            where.supplierId = Number(params.supplierId)
        }

        if (params.month && params.year){
            where.issuedAt ={
                gte: new Date(params.year, params.month - 1, 1,),
                lte: new Date(params.year, params.month, 0, 23, 59, 59)
            }
        }

        return this.analyticsRepository.getBestSellingProduct(where)
    }
}