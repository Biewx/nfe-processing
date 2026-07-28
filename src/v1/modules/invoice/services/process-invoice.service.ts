import { Injectable } from "@nestjs/common";
import { parseStringPromise } from 'xml2js';
import MapperService from "../mapper/mapper.service";
import CreateSupplierIfNotExistsService from "../../supplier/services/create-supplier-if-not-exists.service";
import CreateInvoiceService from "./create-invoice.service";
import CreateInvoiceItemService from "../../invoice-item/services/create-invoice-item.service";

@Injectable()
export default class ProcessInvoiceService {
    constructor(
        private readonly mapperService: MapperService,
        private readonly createSupplierIfNotExistsService: CreateSupplierIfNotExistsService,
        private readonly createInvoiceService: CreateInvoiceService,
        private readonly createInvoiceItemService: CreateInvoiceItemService
    ) {}

    async processXml(file: any) {
        const xmlContent = file.buffer.toString('utf-8');
        const stringXml = await parseStringPromise(xmlContent);
        const parsedData = this.mapperService.map(stringXml);
        const supplier = await this.createSupplierIfNotExistsService.createSupplierIfNotExists(parsedData.supplier);
        const invoice = await this.createInvoiceService.createInvoiceIfNotExists(parsedData.invoice, supplier.id);
        const invoiceItem = await this.createInvoiceItemService.createInvoiceItem(parsedData.invoiceItems, invoice.id)
        return parsedData;
    }

}