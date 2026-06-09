import { Module } from "@nestjs/common";
import { NfeController } from "./nfe.controller";
import { NfeService } from "./nfe.service";

@Module({
    controllers: [NfeController],
    providers: [NfeService]
})
export class NfeModule {}