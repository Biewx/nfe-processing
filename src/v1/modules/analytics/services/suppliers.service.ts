import { Injectable } from "@nestjs/common";
import { FiltersDto } from "../dtos/filters.dto";
import { PrismaService } from "prisma/prisma.service";
import AnalyticsRepository from "../repositories/analytics.repository";

@Injectable()
export default class SuppliersService{
    constructor(
        private readonly prisma: PrismaService,
        private readonly analyticsRepository: AnalyticsRepository
    ){}

    async getTopSellerSuppliers(params: FiltersDto){
        const where: any = {};

        if (params.month && params.year){
            where.issuedAt ={
                gte: new Date(params.year, params.month - 1, 1,),
                lte: new Date(params.year, params.month, 0, 23, 59, 59)
            }
        }

        const total = await this.analyticsRepository.getTotalExpenses(where);
        const supplierExpenses = await this.analyticsRepository.getSupplierExpenses(where);

        const ids = supplierExpenses.map(supplier => {
			return supplier.supplierId
		})

        const suppliers = await this.analyticsRepository.getSuppliersById(ids)

        const suppliersMap = {};

        for (const supplier of suppliers){
            suppliersMap[supplier.id] = {name: supplier.legalName};
        }

        for (const s of supplierExpenses){
            suppliersMap[s.supplierId].total = s._sum.totalValue;
            suppliersMap[s.supplierId].percentage = Number((Number(s._sum.totalValue)/Number(total)) * 100).toFixed(2);
        }

        return suppliersMap;
    }
}