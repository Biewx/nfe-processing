import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class FiltersDto {
    // query params sempre chegam como string (?month=8) — o @Type(() => Number)
    // converte pra number ANTES do class-validator checar @IsInt/@Min/@Max,
    // e é o "transform: true" do ValidationPipe global (main.ts) que aplica
    // essa conversão de verdade na requisição.
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    year?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    supplierId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    productId?: number;
}
