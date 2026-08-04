import { Injectable } from "@nestjs/common";
import ProductRepository from "../repositories/product.repository";

const EAN_PLACEHOLDER = "SEM GTIN";

@Injectable()
export default class CreateProductIfNotExistsService {
    constructor(
        private readonly productRepository: ProductRepository
    ) {}

    async createProductIfNotExists(invoiceItems) {
        // Dedupe por EAN antes de disparar os upserts em paralelo: se a mesma nota
        // tiver duas linhas com o mesmo EAN, upserts concorrentes para a mesma chave
        // única correm risco de colisão (P2002) porque nenhuma das duas ainda viu a
        // outra ter criado a linha.
        const uniqueItemsByEan = new Map<string, any>();
        for (const item of invoiceItems) {
            if (this.hasValidEan(item.ean) && !uniqueItemsByEan.has(item.ean)) {
                uniqueItemsByEan.set(item.ean, item);
            }
        }

        const createdProducts = await Promise.all(
            Array.from(uniqueItemsByEan.values()).map((item) =>
                this.productRepository.findOrCreateProduct(item)
            )
        );

        const productsByEan = new Map(createdProducts.map((product) => [product.ean, product]));

        return invoiceItems.map((item) =>
            this.hasValidEan(item.ean) ? (productsByEan.get(item.ean) ?? null) : null
        );
    }

    private hasValidEan(ean: string): boolean {
        return Boolean(ean) && ean.trim().toUpperCase() !== EAN_PLACEHOLDER;
    }
}