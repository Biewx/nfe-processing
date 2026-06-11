import ProdutoDto from "./produto.dto";

export default class NfeDto {
    numero: string;
    valorTotal?: number;
    produtos: ProdutoDto[];
}