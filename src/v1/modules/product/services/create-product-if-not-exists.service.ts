import { Injectable } from "@nestjs/common";
import ProductRepository from "../repositories/product.repository";

const EAN_PLACEHOLDER = "SEM GTIN";

@Injectable()
export default class CreateProductIfNotExistsService {
    constructor(
        private readonly productRepository: ProductRepository
    ) {}

    async createProductIfNotExists(invoiceItems) {
        const product = invoiceItems.map(async (item) => {
            if (!this.hasValidEan(item.ean)) {
                return null;
            }
            return await this.productRepository.findOrCreateProduct(item);
        });
        return Promise.all(product);
    }

    private hasValidEan(ean: string): boolean {
        return Boolean(ean) && ean.trim().toUpperCase() !== EAN_PLACEHOLDER;
    }
}