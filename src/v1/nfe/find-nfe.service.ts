import { Injectable } from "@nestjs/common";
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export default class FindNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ){}

    async findAll() {
        return this.nfeRepository.find();
    }
}