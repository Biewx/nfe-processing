import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";

@Injectable()
export class DeleteNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ){}

    async delete(id: number) {
        await this.nfeRepository.delete(id);
        return `Nfe with id ${id} deleted successfully.`;
    }
}