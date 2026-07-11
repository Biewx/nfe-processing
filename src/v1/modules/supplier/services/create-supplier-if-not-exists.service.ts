import { Injectable } from "@nestjs/common";
import SupplierRepository from "../repositories/supplier.repository";


@Injectable()
export default class CreateSupplierIfNotExistsService {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async createSupplierIfNotExists(supplierData: any): Promise<any> {
        const supplierExists = await this.supplierRepository.findByCnpj(supplierData.cnpj);
        if (!supplierExists) {
            const newSupplier = await this.supplierRepository.create(supplierData);
            return newSupplier;
        }
        return supplierExists;
    }
}