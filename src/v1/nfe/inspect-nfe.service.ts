import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Nfe } from "./nfe.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "../product/product.entity";

@Injectable()
export class InspectNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ) {}

    async inspect(id: number) {
        const nfe = await this.nfeRepository.createQueryBuilder('nfe')
        .leftJoinAndSelect('nfe.products', 'products')
        .where('nfe.id = :id', { id })
        .getOne();

        return nfe;
    }

}