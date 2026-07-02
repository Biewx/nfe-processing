import { IsArray, IsDate, IsNumber, IsString, ValidateNested } from "class-validator";
import ProdutoDto from "../../product/dtos/product.dto";
import { Type } from "class-transformer";

export default class NfeDto {

    @IsString()
    number: string;

    @IsDate()
    issuedAt: Date;

    @IsNumber()
    totalValue?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProdutoDto)
    products: ProdutoDto[];

    @IsString()
    senderCnpj: string

    @IsString()
    senderCorporateName: string

    @IsString()
    receiverCnpj: string

    @IsString()
    receiverCorporateName: string
}