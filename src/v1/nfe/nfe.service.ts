import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { parseStringPromise } from 'xml2js';
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";
import NfeDto from "./dtos/nfe.dto";
import ProdutoDto from "./dtos/produto.dto";

@Injectable()
export class NfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>
    ) {}

    private parseXml = (result: any) : NfeDto => {
        return {
            numero: result.nota?.numero[0],
            produtos: result.nota?.produtos[0]?.produto.map((produto) => ({
                nome: produto.nome[0],
                valor: Number(produto.valor[0]),
                categoria: produto.categoria? produto.categoria[0] : 'Sem categoria'
            }))
        }
    }

    private calculateTotal = (produtos: ProdutoDto[]) => {
        return produtos.reduce((acc, produto) => acc + produto.valor, 0);
    }

    async processXml(file: any) {
        const xml = file.buffer.toString();
        const result = await parseStringPromise(xml);
        
        const nota = this.parseXml(result);
        const total = this.calculateTotal(nota.produtos);
        
        const nfe = this.nfeRepository.create({
            numero: nota.numero.toString(),
            valorTotal: total
        });

        return this.nfeRepository.save(nfe);
    }
}