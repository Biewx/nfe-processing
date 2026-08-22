import { Injectable } from "@nestjs/common";
import { FiltersDto } from "../dtos/filters.dto";
import AnalyticsRepository from "../repositories/analytics.repository";

@Injectable()
export default class ProductsService{
    constructor(
        private readonly analyticsRepository: AnalyticsRepository
    ){}

    async getBestSellingProduct(params: FiltersDto, companyId: number){
        // getBestSellingProduct consulta InvoiceItem, não Invoice -- e
        // supplierId/issuedAt/companyId são campos da Invoice, não do item
        // em si. Por isso o filtro precisa ficar aninhado dentro de
        // "invoice", não solto no nível de cima (isso já estava errado
        // antes -- funcionava só quando nenhum filtro era passado).
        const invoiceWhere: any = { companyId };

        if (params.supplierId){
            invoiceWhere.supplierId = Number(params.supplierId)
        }

        if (params.month && params.year){
            invoiceWhere.issuedAt ={
                gte: new Date(params.year, params.month - 1, 1,),
                lte: new Date(params.year, params.month, 0, 23, 59, 59)
            }
        }

        return this.analyticsRepository.getBestSellingProduct({ invoice: invoiceWhere })
    }
}