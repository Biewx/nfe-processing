import { Injectable } from "@nestjs/common";
import { parseStringPromise } from 'xml2js';

@Injectable()
export class NfeService {

    private xmlParser = (result: any) => {
        return {
            numero: Number(result.nota?.numero[0]),
            produtos: result.nota?.produtos[0]?.produto.map((produto) => ({
                nome: produto.nome[0],
                valor: Number(produto.valor[0]),
                categoria: produto.categoria? produto.categoria[0] : 'Sem categoria'
            }))
        }
    }

    async processXml(file: any) {
        const xml = file.buffer.toString();
        const result = await parseStringPromise(xml);
        
        const nota = this.xmlParser(result);
        const total = nota.produtos.reduce(
            (acc, produto) => acc + produto.valor,
            0
        );
        return {
            numero: nota.numero,
            produtos: nota.produtos,
            qtdProdutos: nota.produtos.length,
            valorTotal: total
        };
    }
}