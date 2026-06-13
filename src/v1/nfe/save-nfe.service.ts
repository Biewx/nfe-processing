import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { parseStringPromise } from 'xml2js';
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";
import NfeDto from "./dtos/nfe.dto";
import ProdutoDto from "./dtos/produto.dto";
import { Product } from "../product/product.entity";

@Injectable()
export class SaveNfeService {

    constructor(
        @InjectRepository(Nfe)
        private readonly nfeRepository: Repository<Nfe>,

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

    private mapToEntity = (nfeDto: NfeDto) => {
        const nfe = new Nfe();
        nfe.numero = nfeDto.numero;
        nfe.valorTotal = this.calculateTotal(nfeDto.produtos);
        nfe.products = nfeDto.produtos.map(produtoDto => {
            const product = new Product();
            product.name = produtoDto.nome;
            product.price = produtoDto.valor;
            product.category = produtoDto.categoria ?? 'Sem categoria';
            product.nfe = nfe;
            return product;
        });
        return nfe;
    }

    private findByNumber = (numero: string) => {
        const nfe = this.nfeRepository
        .findOneBy({ numero })

        return nfe;
    }

    async processXml(file: any) {
        const xml = file.buffer.toString();
        const result = await parseStringPromise(xml);
        
        const nota = this.parseXml(result);

        const exists = await this.findByNumber(nota.numero)
        
        const nfe = this.mapToEntity(nota);

        if (exists){
            throw new ConflictException('Essa NFe já foi procesada!')
        }
        return this.nfeRepository.save(nfe);
    }
}