import { Module } from "@nestjs/common";
import { NfeController } from "./nfe.controller";
import { NfeService } from "./nfe.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Nfe } from "./nfe.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Nfe])
    ],
    controllers: [NfeController],
    providers: [NfeService]
})
export class NfeModule {}