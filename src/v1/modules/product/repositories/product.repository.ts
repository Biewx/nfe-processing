import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export default class ProductRepository {
    constructor(
        private readonly prisma: PrismaService // Replace 'any' with the actual type of your product repository
    ) {}

    async findOrCreateProduct(item) {
        const productExists = await this.prisma.product.upsert({
            where: { ean: item.ean },
            update: {},
            create: {
                description: item.description,
                ean: item.ean
            }
        });

        return productExists;
    }
}
