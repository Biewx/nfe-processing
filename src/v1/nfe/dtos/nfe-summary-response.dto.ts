import ProductResponseDto from "src/v1/product/dtos/product-response.dto";

export default class NfeSummaryResponseDto{
    id: number;
    issuedAt: Date;
    number: string;
    totalValue: number;
    sender: string;
    senderCnpj: string;
    receiver: string;
    receiverCnpj: string;
    products: ProductResponseDto[];
}