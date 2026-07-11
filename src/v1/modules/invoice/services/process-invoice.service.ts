import { Injectable } from "@nestjs/common";
import { parseStringPromise } from 'xml2js';
import MapperService from "../mapper/mapper.service";
import CreateSupplierIfNotExistsService from "../../supplier/services/create-supplier-if-not-exists.service";

@Injectable()
export default class ProcessInvoiceService {
    constructor(
        private readonly mapperService: MapperService,
        private readonly createSupplierIfNotExistsService: CreateSupplierIfNotExistsService
    ) {}

    async processXml(file: any) {
        const xmlContent = file.buffer.toString('utf-8');
        const stringXml = await parseStringPromise(xmlContent);
        const parsedData = this.mapperService.map(stringXml);
        const supplier = await this.createSupplierIfNotExistsService.createSupplierIfNotExists(parsedData.supplier);
        return parsedData;
    }

}