import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Nfe } from "./nfe.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "../product/product.entity";
import NfeSummaryResponseDto from "./dtos/nfe-summary-response.dto";
import ProductResponseDto from "../product/dtos/product-response.dto";

@Injectable()
export class InspectNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ) {}

    private mapToResponseDto = (nfe: Nfe): NfeSummaryResponseDto => {
        const dto = new NfeSummaryResponseDto();

        dto.id = nfe.id;
        dto.issuedAt = nfe.issuedAt;
        dto.number = nfe.numero;
        dto.sender = nfe.senderCorporateName;
        dto.receiver = nfe.receiverCorporateName;
        dto.totalValue = nfe.valorTotal;
        dto.products = nfe.products.map(p => {
            const productDto = new ProductResponseDto();

            productDto.id = p.id;
            productDto.code = p.code;
            productDto.name = p.name;
            productDto.unitPrice = p.unitPrice;
            productDto.quantity = p.quantity;

            return productDto;
        })

        return dto;
    }

    async inspect(id: number) {
        const nfe = await this.nfeRepository.createQueryBuilder('nfe')
        .leftJoinAndSelect('nfe.products', 'products')
        .where('nfe.id = :id', { id })
        .getOne();

        if(!nfe) {
            throw new NotFoundException('NFe não encontrada.')
        }

        return this.mapToResponseDto(nfe)
    }

}