import { BadRequestException, NotFoundException } from "@nestjs/common";
import GetBestSupplierService from "./get-best-supplier.service";

describe("getBestSupplierService", () => {
    let service: GetBestSupplierService;
    let fakeRepository: { findPurchasesByProductInRange: jest.Mock };
    beforeEach(() => {
        fakeRepository = {
            findPurchasesByProductInRange: jest.fn(),
        };
        service = new GetBestSupplierService(fakeRepository as any);
    });

    it("lança BadRequestException se productId não for informado", async () =>{
        await expect(service.getBestSupplier({})).rejects.toThrow(BadRequestException);
        expect(fakeRepository.findPurchasesByProductInRange).not.toHaveBeenCalled();
    });

    it("lança NotFoundException se não houver compras para o produto no período informado", async () =>{
        fakeRepository.findPurchasesByProductInRange.mockResolvedValue([]);
        await expect(service.getBestSupplier({ productId: "3" })).rejects.toThrow(NotFoundException);
        expect(fakeRepository.findPurchasesByProductInRange).toHaveBeenCalled();
    });

    it("Busca o fornecedor com o melhor preço para um produto em um período específico", async () =>{
        fakeRepository.findPurchasesByProductInRange.mockResolvedValue([
            {
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: { supplier: { id: 1, legalName: "Nome Aqui" } },
            },
            {
                unitPrice: 5,
                commercialUnit: "UN",
                invoice: { supplier: { id: 2, legalName: "Outro Nome" } },
            },
        ]);
        const result = await service.getBestSupplier({ productId: 3 })
        expect(result.unitPrice).toBe(5);
        expect(result.supplier).toBe("Outro Nome");
    });

    it("Verifica se a comparação é feita corretamente", async () =>{
        fakeRepository.findPurchasesByProductInRange.mockResolvedValue([
            {
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: { supplier: { id: 1, legalName: "Nome Aqui" } },
            }
        ]);
        const result = await service.getBestSupplier({ productId: 3 })
        expect(result.comparable).toBe(false);
    });

    it("Unidade divergente", async () =>{
        fakeRepository.findPurchasesByProductInRange.mockResolvedValue([
            {
                unitPrice: 10,
                commercialUnit: "UN",
                invoice: { supplier: { id: 1, legalName: "Supplier1" } },
            },
            {
                unitPrice: 12,
                commercialUnit: "UN",
                invoice: { supplier: { id: 2, legalName: "Supplier2" } },
            },
            {
                unitPrice: 5,
                commercialUnit: "CX",
                invoice: { supplier: { id: 3, legalName: "Supplier3" } },
            }
        ]);
        const result = await service.getBestSupplier({ productId: 3 })
        expect(result.supplier).toBe("Supplier1");
        expect(result.commercialUnit).toBe("UN");
        expect(result.excludedByUnitMismatch).toBe(1);
    });
});