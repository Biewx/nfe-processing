import { Module } from "@nestjs/common";
import { NfeController } from "./nfe.controller";
import { SaveNfeService } from "./save-nfe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Nfe } from "./nfe.entity";
import FindNfeService from "./find-all-nfe.service";
import { InspectNfeService } from "./inspect-nfe.service";
import { DeleteNfeService } from "./delete-nfe.service";
import { Product } from "../product/product.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Nfe, Product])
    ],
    controllers: [NfeController],
    providers: [
        SaveNfeService,
        FindNfeService,
        InspectNfeService,
        DeleteNfeService
    ]
})
export class NfeModule {}