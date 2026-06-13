import { IsNumber, IsOptional, IsString } from "class-validator";

export default class ProdutoDto {
    @IsString()
    nome: string;

    @IsNumber()
    valor: number;

    @IsOptional()
    @IsString()
    categoria?: string;
}