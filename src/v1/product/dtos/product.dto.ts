import { IsNumber, IsOptional, IsString } from "class-validator";

export default class ProdutoDto {
    @IsString()
    code: string

    @IsString()
    name: string;

    @IsNumber()
    unitPrice: number;

    @IsNumber()
    quantity: number

    @IsOptional()
    @IsString()
    category?: string;
}