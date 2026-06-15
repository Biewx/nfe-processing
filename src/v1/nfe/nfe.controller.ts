import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { SaveNfeService } from "./save-nfe.service";
import FindNfeService from "./find-all-nfe.service";
import { InspectNfeService } from "./inspect-nfe.service";
import { DeleteNfeService } from "./delete-nfe.service";

@Controller('xml')
export class NfeController {

    constructor(
        private readonly saveNfeService: SaveNfeService,
        private readonly findNfesService: FindNfeService,
        private readonly inspectNfeService: InspectNfeService,
        private readonly deleteNfeService: DeleteNfeService
    ) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file,
    ){
        return await this.saveNfeService.processXml(file);
    }

    @Get()
    async findAll() {
        return await this.findNfesService.findAll();
    }

    @Get('inspect/:id')
    async inspect(
        @Param('id') id: string
    ) {
        return await this.inspectNfeService.inspect(parseInt(id));
    }

    @Delete('delete/:id') 
    async delete(
        @Param('id') id: string
    ) {
        return await this.deleteNfeService.delete(parseInt(id));
    }
}