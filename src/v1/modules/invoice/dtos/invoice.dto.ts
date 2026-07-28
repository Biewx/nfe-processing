import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class InvoiceDto {
  @IsString()
  accessKey: string;

  @IsInt()
  number: number;

  @IsInt()
  series: number;

  @Type(() => Date)
  @IsDate()
  issuedAt: Date;

  @IsString()
  @MaxLength(60)
  operationNature: string;

  @IsNumber()
  totalValue: number;

  @IsOptional()
  @IsString()
  xmlStorageKey?: string;
}