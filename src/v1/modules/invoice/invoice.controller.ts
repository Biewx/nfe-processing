import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import ProcessInvoiceService from "./services/process-invoice.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller('invoice')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
    constructor(
        private readonly processInvoiceService: ProcessInvoiceService,
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file,
        @CurrentUser() user,
    ){
        return await this.processInvoiceService.processXml(file, user.companyId);
    }
}
