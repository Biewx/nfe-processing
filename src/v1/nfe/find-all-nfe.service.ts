import { Injectable } from "@nestjs/common";
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import NfeSummaryResponseDto from "./dtos/nfe-summary-response.dto";
import ProductResponseDto from "../product/dtos/product-response.dto";

@Injectable()
export default class FindAllNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ){}

    private mapToResponseDto = (nfe: Nfe): NfeSummaryResponseDto => {
        const dto = new NfeSummaryResponseDto();
            dto.id = nfe.id;
            dto.issuedAt = nfe.issuedAt;
            dto.number = nfe.number;
            dto.sender = nfe.senderCorporateName;
            dto.receiver = nfe.receiverCorporateName;
            dto.totalValue = nfe.totalValue;
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

    async findAll() {
        const list = await this.nfeRepository.createQueryBuilder('nfe')
        .leftJoinAndSelect('nfe.products', 'products')
        .getMany()

        const result = list.map(nfe => 
            this.mapToResponseDto(nfe)
        )

        return result;
    }

}