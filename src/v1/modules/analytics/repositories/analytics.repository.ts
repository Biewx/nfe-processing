import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class AnalyticsRepository{
    constructor(
        private readonly prisma: PrismaService
    ){}

    async getTotalExpenses(where){

        const result = await this.prisma.invoice.aggregate({
            _sum: {
                totalValue: true
            },

            where
        })

        return result._sum.totalValue;
    }
    async getHighestExpenses(where){

        const result = await this.prisma.invoice.findFirst({
            where,

            orderBy: {
                totalValue: 'desc'
            },
            
        })

        return result;
    }

    async getSupplierExpenses(where){

        const suppliersId = await this.prisma.invoice.groupBy({
            by: [`supplierId`],

            _sum:{
                totalValue:true
            },

            orderBy:{
                _sum:{
                    totalValue: "desc"
                }
            },

            take: 3,

        })

		return suppliersId;
        
    }

    async getSuppliersById(ids){
        const suppliers = await this.prisma.supplier.findMany({
            where:{
                id: {
                    in: ids
                }
            }
        })
        return suppliers
    }

	
    async getBestSellingProduct(where){
        const product = await this.prisma.invoiceItem.findFirst({
            where,

            orderBy:{
                quantity: "desc"
            }
        })

        return product;
    }
}