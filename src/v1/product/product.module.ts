import { Module } from "@nestjs/common";
import { Product } from "./product.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    controllers: [],
    providers: []
})
export class ProductModule {}