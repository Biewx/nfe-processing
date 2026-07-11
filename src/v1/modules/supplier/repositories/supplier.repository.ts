import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class SupplierRepository {
    constructor(private readonly prisma: PrismaService) {}
    async findByCnpj(cnpj: string): Promise<any> {
        const supplierExists = await this.prisma.supplier.findUnique({
            where: {
                cnpj: cnpj,
            },
        });
        return supplierExists;
    }

    async create(supplierData: any): Promise<any> {
        const newSupplier = await this.prisma.supplier.create({
            data: supplierData,
        });
        return newSupplier;
    }
}