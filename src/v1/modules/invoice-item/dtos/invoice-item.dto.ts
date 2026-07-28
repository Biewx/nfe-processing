import { IsNumber, IsString, MaxLength } from 'class-validator';

export class InvoiceItemDto {
  @IsString()
  @MaxLength(60)
  code: string;

  @IsString()
  @MaxLength(120)
  description: string;

  @IsString()
  @MaxLength(8)
  ncm: string;

  @IsString()
  @MaxLength(10)
  commercialUnit: string;

  @IsString()
  @MaxLength(4)
  cfop: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;

  @IsNumber()
  icmsValue: number;

  @IsNumber()
  pisValue: number;

  @IsNumber()
  cofinsValue: number;
}