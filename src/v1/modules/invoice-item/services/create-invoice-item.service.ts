import { Injectable } from "@nestjs/common";
import InvoiceItemRepository from "../repositories/invoice-item.repository";
import { InvoiceItemDto } from "../dtos/invoice-item.dto";

@Injectable()
export default class CreateInvoiceItemService {
    constructor(private readonly invoiceItemRepository: InvoiceItemRepository) {}
    
    async createInvoiceItem(dto: InvoiceItemDto[], invoiceId: number) {
        const invoiceItem = await this.invoiceItemRepository.createInvoice(dto, invoiceId)
    }
}