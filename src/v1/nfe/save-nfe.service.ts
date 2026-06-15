import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { parseStringPromise } from 'xml2js';
import { Nfe } from "./nfe.entity";
import { Repository } from "typeorm";
import NfeDto from "./dtos/nfe.dto";
import ProdutoDto from "../product/dtos/product.dto";
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
            issuedAt: new Date(result.nota?.dataEmissao[0]),
            senderCnpj: result.nota?.emitente?.[0]?.cnpj[0],
            senderCorporateName: result.nota?.emitente?.[0]?.razaoSocial[0],
            receiverCnpj: result.nota?.destinatario?.[0]?.cnpj[0],
            receiverCorporateName: result.nota?.destinatario?.[0]?.razaoSocial[0],
            produtos: result.nota?.produtos[0]?.produto.map((produto) => ({
                code: produto.codigo[0],
                name: produto.nome[0],
                quantity: Number(produto.quantidade[0]),
                unitPrice: Number(produto.valorUnitario[0]),
                category: produto.categoria? produto.categoria[0] : 'Sem categoria'
            }))
        }
    }

    private calculateTotal = (produtos: ProdutoDto[]) => {
        let total = 0
        for (const produto of produtos){
            total += produto.unitPrice * produto.quantity;
        }

        return total;
    }

    private mapToEntity = (nfeDto: NfeDto) => {
        const nfe = new Nfe();
        nfe.numero = nfeDto.numero;
        nfe.issuedAt = nfeDto.issuedAt;
        nfe.senderCnpj = nfeDto.senderCnpj;
        nfe.senderCorporateName = nfeDto.senderCorporateName;
        nfe.receiverCnpj = nfeDto.receiverCnpj;
        nfe.receiverCorporateName = nfeDto.receiverCorporateName;
        nfe.valorTotal = this.calculateTotal(nfeDto.produtos);
        nfe.products = nfeDto.produtos.map(produtoDto => {
            const product = new Product();
            product.code = produtoDto.code;
            product.name = produtoDto.name;
            product.quantity = produtoDto.quantity;
            product.unitPrice = produtoDto.unitPrice;
            product.category = produtoDto.category ?? 'Sem categoria';
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

        await this.nfeRepository.save(nfe);

        return {
            "message": "Nfe salva com sucesso!"
        };
    }
}