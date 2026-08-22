import { Injectable } from "@nestjs/common";
import AnalyticsRepository from "../repositories/analytics.repository";
import { FiltersDto } from "../dtos/filters.dto";

@Injectable()
export default class ExpensesService{
    constructor(
        private readonly analyticsRepository: AnalyticsRepository
    ){}
    
    async getTotalExpenses(params: FiltersDto, companyId: number){
        // companyId nunca vem do query string do client -- só do usuário
        // autenticado (o controller extrai isso do token, não da URL). Se
        // viesse da URL, qualquer um poderia trocar ?companyId=5 e ver o
        // gasto de outra empresa.
        const where: any = { companyId };

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

    async getHighestExpenses(params: FiltersDto, companyId: number){
        const where: any = { companyId };
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