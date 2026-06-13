import { IsNumber, IsOptional, IsString } from "class-validator";

export default class ProdutoDto {
    @IsString()
    code: string

    @IsString()
    nome: string;

    @IsNumber()
    unitPrice: number;

    @IsNumber()
    quantity: number

    @IsOptional()
    @IsString()
    categoria?: string;


}