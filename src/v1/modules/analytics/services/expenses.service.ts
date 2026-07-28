import { Injectable } from "@nestjs/common";
import AnalyticsRepository from "../repositories/analytics.repository";
import { FiltersDto } from "../dtos/filters.dto";

@Injectable()
export default class ExpensesServices{
    constructor(
        private readonly analyticsRepository: AnalyticsRepository
    ){}
    
    async getTotalExpenses(params: FiltersDto){
        const where: any = {};

        if (params.supplierId){
            where.supplierId = Number(params.supplierId)
        }

        if (params.month && params.year){
            where.issuedAt ={
                gte: new Date(params.year, params.month - 1, 1,),
                lte: new Date(params.year, params.month, 0, 23, 59, 59)
            }
        }

        const result = this.analyticsRepository.getTotalExpenses(where)
        return result;
    }

    async getHighestExpenses(params: FiltersDto){
        const where: any = {};
        if (params.supplierId){
            where.supplierId = Number(params.supplierId)
        }

        if (params.month && params.year){
            where.issuedAt ={
                gte: new Date(params.year, params.month - 1, 1,),
                lte: new Date(params.year, params.month, 0, 23, 59, 59)
            }
        }

        return this.analyticsRepository.getHighestExpenses(where);
    }
}