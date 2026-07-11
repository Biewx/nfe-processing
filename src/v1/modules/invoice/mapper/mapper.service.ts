import { Injectable } from "@nestjs/common";

@Injectable()
export default class NfeMapperService {
    map(xmlData: any) {
       return {
            "invoice":{
                accessKey: xmlData?.NFe?.infNFe?.[0]?.$.Id?.replace("NFe", ""),
                number: Number(xmlData?.NFe?.infNFe?.[0]?.ide?.[0]?.nNF?.[0]),
                series: Number(xmlData?.NFe?.infNFe?.[0]?.ide?.[0]?.serie?.[0]),
                issuedAt: new Date(xmlData?.NFe?.infNFe?.[0]?.ide?.[0]?.dhEmi?.[0]),
                operationNature: xmlData?.NFe?.infNFe?.[0]?.ide?.[0]?.natOp?.[0],
                totalValue: xmlData?.NFe?.infNFe?.[0]?.total?.[0]?.ICMSTot?.[0]?.vNF?.[0]
            },
            
            "invoiceItems": xmlData?.NFe?.infNFe?.[0]?.det?.map((item) => ({
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
                cnpj: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.CNPJ?.[0],
                legalName: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.xNome?.[0],
                tradeName: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.xFant?.[0],
                stateRegistration: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.IE?.[0],
                city: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.enderEmit?.[0]?.xMun?.[0],
                state: xmlData?.NFe?.infNFe?.[0]?.emit?.[0]?.enderEmit?.[0]?.UF?.[0],
            }
       }
    }
}