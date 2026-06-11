import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Nfe } from "./nfe.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class InspectNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ) {}

    async inspect(id: number) {
        const nfe = await this.nfeRepository.findOneBy({ id });
        return nfe;
    }

}