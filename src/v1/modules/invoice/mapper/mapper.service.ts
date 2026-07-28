import { Injectable } from "@nestjs/common";
import { error } from "console";

@Injectable()
export default class NfeMapperService {
    private getInfNfe(xmlData: any){
        return (
            xmlData?.Nfe?.infNfe?.[0] ??
            xmlData?.nfeProc?.NFe?.[0]?.infNFe?.[0]
        );
    }

    map(xmlData: any) {
        const infNFe = this.getInfNfe(xmlData)

        if (!infNFe){
            throw new Error("Estrutura de NFe não conhceida!")
        }

        const emit = infNFe.emit?.[0];

        return {
            "invoice":{
                accessKey: infNFe.$?.Id?.replace("NFe", ""),
                number: Number(infNFe.ide?.[0]?.nNF?.[0]),
                series: Number(infNFe.ide?.[0]?.serie?.[0]),
                issuedAt: new Date(infNFe.ide?.[0]?.dhEmi?.[0]),
                operationNature: infNFe.ide?.[0]?.natOp?.[0],
                totalValue: infNFe.total?.[0]?.ICMSTot?.[0]?.vNF?.[0]
            },
            
            "invoiceItems": infNFe.det?.map((item) => ({
                    code: item?.prod?.[0]?.cProd?.[0],
                    description: item?.prod?.[0]?.xProd?.[0],
                    ncm: item?.prod?.[0]?.NCM?.[0],
                    commercialUnit: item?.prod?.[0]?.uCom?.[0],
                    cfop: item?.prod?.[0]?.CFOP?.[0],
                    quantity: item?.prod?.[0]?.qCom?.[0],
                    unitPrice: item?.prod?.[0]?.vUnCom?.[0],
                    totalPrice: item?.prod?.[0]?.vProd?.[0],
                    icmsValue: item?.imposto?.[0]?.ICMS?.[0]?.ICMS00?.[0]?.vICMS?.[0],
                    pisValue: item?.imposto?.[0]?.PIS?.[0]?.PISAliq?.[0]?.vPIS?.[0],
                    cofinsValue: item?.imposto?.[0]?.COFINS?.[0]?.COFINSAliq?.[0]?.vCOFINS?.[0]
            })),

            "supplier": {
                cnpj: emit.CNPJ?.[0],
                legalName: emit.xNome?.[0],
                tradeName: emit.xFant?.[0],
                stateRegistration: emit.IE?.[0],
                city: emit.enderEmit?.[0]?.xMun?.[0],
                state: emit.enderEmit?.[0]?.UF?.[0],
            }
       }
    }
}