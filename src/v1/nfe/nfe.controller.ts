import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { NfeService } from "./nfe.service";

@Controller('xml')
export class NfeController {

    constructor(
        private readonly nfeService: NfeService
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file,
    ){
        return await this.nfeService.processXml(file);
    }
}