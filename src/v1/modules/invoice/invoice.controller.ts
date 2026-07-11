import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import ProcessInvoiceService from "./services/process-invoice.service";

@Controller('invoice')
export class InvoiceController {
    constructor(
        private readonly processInvoiceService: ProcessInvoiceService,
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file,
    ){
        return await this.processInvoiceService.processXml(file);
    }
}