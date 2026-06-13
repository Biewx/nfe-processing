import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";
import ProdutoDto from "./produto.dto";
import { Type } from "class-transformer";

export default class NfeDto {
    @IsString()
    numero: string;

    @IsNumber()
    valorTotal?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProdutoDto)
    produtos: ProdutoDto[];
}