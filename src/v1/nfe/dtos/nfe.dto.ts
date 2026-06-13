import { IsArray, IsDate, IsNumber, IsString, ValidateNested } from "class-validator";
import ProdutoDto from "./produto.dto";
import { Type } from "class-transformer";

export default class NfeDto {
    @IsString()
    numero: string;

    @IsDate()
    issuedAt: Date;

    @IsNumber()
    valorTotal?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProdutoDto)
    produtos: ProdutoDto[];

    @IsString()
    senderCnpj: string

    @IsString()
    senderCorporateName: string

    @IsString()
    receiverCnpj: string

    @IsString()
    receiverCorporateName: string
}