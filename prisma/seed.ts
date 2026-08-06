// Popula o banco com dado pra exercitar os insights de comparação de preço
// por fornecedor (ver src/v1/modules/insights).
//
// Não passa pelo pipeline de upload de XML (parser/mapper) — insere direto
// via Prisma Client. Não substitui testar o parser com XML real, só dá dado
// pra validar as queries de insight sem depender de conseguir NFe de verdade.
//
// Idempotente: usa upsert por chave natural em Supplier/Product, skip por
// accessKey em Invoice, e um PRNG com seed fixa — rodar de novo gera
// exatamente os mesmos dados "aleatórios" de novo, então nada duplica.
//
// Rodar com: npm run seed

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

// PRNG determinístico (mulberry32) — mesma seed sempre gera a mesma sequência,
// o que mantém o script idempotente mesmo usando "aleatoriedade".
function mulberry32(seed: number) {
    return function random() {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const random = mulberry32(42);

function randomBetween(min: number, max: number): number {
    return min + random() * (max - min);
}

function sampleWithoutReplacement<T>(items: T[], count: number): T[] {
    const pool = [...items];
    const sample: T[] = [];
    while (sample.length < count && pool.length > 0) {
        const index = Math.floor(random() * pool.length);
        sample.push(pool.splice(index, 1)[0]);
    }
    return sample;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function fakeAccessKey(sequence: number): string {
    return String(sequence).padStart(44, "0");
}

// EAN sintético com prefixo GS1 fictício, só pra parecer um código de barras real.
function fakeEan(sequence: number): string {
    return `789${String(sequence).padStart(10, "0")}`;
}

// ---------------------------------------------------------------------------
// Helpers de persistência
// ---------------------------------------------------------------------------

async function upsertSupplier(data: {
    cnpj: string;
    legalName: string;
    tradeName?: string;
    city: string;
    state: string;
}) {
    return prisma.supplier.upsert({
        where: { cnpj: data.cnpj },
        update: {},
        create: data,
    });
}

async function upsertProduct(data: { ean: string; description: string }) {
    return prisma.product.upsert({
        where: { ean: data.ean },
        update: {},
        create: data,
    });
}

type SeedInvoiceItem = {
    code: string;
    description: string;
    commercialUnit: string;
    quantity: number;
    unitPrice: number;
    productId?: number;
};

async function seedInvoiceWithItems(
    accessKeySeq: number,
    supplierId: number,
    issuedAt: Date,
    items: SeedInvoiceItem[],
) {
    const accessKey = fakeAccessKey(accessKeySeq);

    const existing = await prisma.invoice.findUnique({ where: { accessKey } });
    if (existing) {
        return { invoice: existing, created: false };
    }

    const totalValue = round2(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));

    const invoice = await prisma.invoice.create({
        data: {
            accessKey,
            number: accessKeySeq,
            series: 1,
            issuedAt,
            operationNature: "Venda de mercadoria",
            totalValue,
            supplierId,
        },
    });

    for (const item of items) {
        await prisma.invoiceItem.create({
            data: {
                code: item.code,
                description: item.description,
                commercialUnit: item.commercialUnit,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: round2(item.quantity * item.unitPrice),
                invoiceId: invoice.id,
                productId: item.productId ?? null,
            },
        });
    }

    return { invoice, created: true };
}

async function main() {
    // -------------------------------------------------------------------
    // PARTE 1 — cenários específicos, escritos à mão pra validar casos-limite
    // exatos (fica fácil de raciocinar sobre o número esperado da query).
    // -------------------------------------------------------------------

    const atacadao = await upsertSupplier({
        cnpj: "11111111000191",
        legalName: "Atacadão Distribuidora Ltda",
        tradeName: "Atacadão",
        city: "São Paulo",
        state: "SP",
    });
    const assai = await upsertSupplier({
        cnpj: "22222222000191",
        legalName: "Assaí Atacadista S.A.",
        tradeName: "Assaí",
        city: "São Paulo",
        state: "SP",
    });
    const carrefour = await upsertSupplier({
        cnpj: "33333333000191",
        legalName: "Carrefour Comércio e Indústria Ltda",
        tradeName: "Carrefour",
        city: "Osasco",
        state: "SP",
    });
    const makro = await upsertSupplier({
        cnpj: "44444444000191",
        legalName: "Makro Atacadista S.A.",
        tradeName: "Makro",
        city: "Guarulhos",
        state: "SP",
    });
    const extra = await upsertSupplier({
        cnpj: "55555555000191",
        legalName: "Extra Hipermercados Ltda",
        tradeName: "Extra",
        city: "Campinas",
        state: "SP",
    });

    // Cenário 1: mesmo EAN, mesma unidade comercial, comprado de dois
    // fornecedores — os preços trocam de posição entre a compra mais antiga
    // e a mais recente de propósito. Se o insight usar média histórica em
    // vez de "última compra por fornecedor", ele recomenda o errado.
    const arroz = await upsertProduct({ ean: "7896006750014", description: "Arroz Tio João Tipo 1 5kg" });
    await seedInvoiceWithItems(1, atacadao.id, new Date("2026-02-10"), [
        { code: "ARZ001", description: "Arroz Tio João Tipo 1 5kg", commercialUnit: "UN", quantity: 20, unitPrice: 21.9, productId: arroz.id },
    ]);
    await seedInvoiceWithItems(2, assai.id, new Date("2026-03-05"), [
        { code: "ARZ001", description: "Arroz Tio João Tipo 1 5kg", commercialUnit: "UN", quantity: 20, unitPrice: 24.0, productId: arroz.id },
    ]);
    await seedInvoiceWithItems(3, atacadao.id, new Date("2026-06-12"), [
        { code: "ARZ001", description: "Arroz Tio João Tipo 1 5kg", commercialUnit: "UN", quantity: 20, unitPrice: 23.5, productId: arroz.id },
    ]);
    await seedInvoiceWithItems(4, assai.id, new Date("2026-07-20"), [
        { code: "ARZ001", description: "Arroz Tio João Tipo 1 5kg", commercialUnit: "UN", quantity: 20, unitPrice: 22.0, productId: arroz.id },
    ]);

    // Cenário 2: mesmo EAN, unidades comerciais diferentes entre
    // fornecedores — não dá pra comparar unitPrice direto (Carrefour vende
    // a caixa fechada, não a unidade). O insight deve excluir esse par da
    // comparação em vez de comparar 4,50 com 48,00 como se fossem iguais.
    const detergente = await upsertProduct({ ean: "7896098700124", description: "Detergente Ypê Neutro 500ml" });
    await seedInvoiceWithItems(5, atacadao.id, new Date("2026-05-15"), [
        { code: "DET010", description: "Detergente Ypê Neutro 500ml", commercialUnit: "UN", quantity: 50, unitPrice: 4.5, productId: detergente.id },
    ]);
    await seedInvoiceWithItems(6, carrefour.id, new Date("2026-06-01"), [
        { code: "DET010-CX", description: "Detergente Ypê Neutro 500ml (caixa c/12)", commercialUnit: "CX", quantity: 5, unitPrice: 48.0, productId: detergente.id },
    ]);

    // Cenário 3: EAN comprado de um único fornecedor — não há com quem
    // comparar. O insight deve responder "sem comparável", em vez de
    // devolver esse fornecedor único como "o melhor".
    const feijao = await upsertProduct({ ean: "7891234567895", description: "Feijão Carioca Camil 1kg" });
    await seedInvoiceWithItems(7, assai.id, new Date("2026-04-18"), [
        { code: "FEJ200", description: "Feijão Carioca Camil 1kg", commercialUnit: "UN", quantity: 30, unitPrice: 8.9, productId: feijao.id },
    ]);

    // -------------------------------------------------------------------
    // PARTE 2 — dataset volumoso e gerado: mais fornecedores "visitando" um
    // catálogo maior ao longo de vários meses. Ajuste as constantes abaixo
    // pra ter mais (ou menos) dado.
    // -------------------------------------------------------------------

    const MONTHS = 7; // jan..jul/2026
    const VISITS_PER_SUPPLIER_PER_MONTH = 2;
    const MIN_ITEMS_PER_VISIT = 3;
    const MAX_ITEMS_PER_VISIT = 6;

    const suppliersByKey = { atacadao, assai, carrefour, makro, extra };
    type SupplierKey = keyof typeof suppliersByKey;

    type CatalogOffer = {
        supplierKey: SupplierKey;
        basePrice: number;
        // variação fracionária de preço por mês (0.01 = +1%/mês). Negativo = preço caindo.
        monthlyTrend: number;
    };
    type CatalogProduct = {
        eanSeq: number;
        description: string;
        code: string;
        commercialUnit: string;
        offers: CatalogOffer[];
    };

    const catalog: CatalogProduct[] = [
        {
            eanSeq: 1, code: "ACU001", description: "Açúcar Cristal União 1kg", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 4.2, monthlyTrend: 0.005 },
                { supplierKey: "assai", basePrice: 4.1, monthlyTrend: 0.003 },
                { supplierKey: "extra", basePrice: 4.35, monthlyTrend: 0.008 },
            ],
        },
        {
            eanSeq: 2, code: "OLE002", description: "Óleo de Soja Liza 900ml", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 7.8, monthlyTrend: 0.01 },
                { supplierKey: "carrefour", basePrice: 7.5, monthlyTrend: 0.002 },
                { supplierKey: "makro", basePrice: 7.6, monthlyTrend: 0.006 },
            ],
        },
        {
            eanSeq: 3, code: "CAF003", description: "Café Pilão 500g", commercialUnit: "UN",
            offers: [
                { supplierKey: "assai", basePrice: 12.9, monthlyTrend: 0.004 },
                { supplierKey: "extra", basePrice: 13.2, monthlyTrend: 0.004 },
            ],
        },
        {
            eanSeq: 4, code: "MAC004", description: "Macarrão Espaguete Renata 500g", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 4.5, monthlyTrend: 0 },
                { supplierKey: "assai", basePrice: 4.6, monthlyTrend: 0 },
                { supplierKey: "carrefour", basePrice: 4.4, monthlyTrend: 0 },
                { supplierKey: "makro", basePrice: 4.55, monthlyTrend: 0 },
            ],
        },
        {
            // Trend forte de alta em todos os fornecedores — bom candidato pra
            // testar "detecção de aumento de preço" (item da visão do produto).
            eanSeq: 5, code: "LEI005", description: "Leite Integral Itambé 1L", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 4.8, monthlyTrend: 0.02 },
                { supplierKey: "assai", basePrice: 4.75, monthlyTrend: 0.02 },
                { supplierKey: "carrefour", basePrice: 4.7, monthlyTrend: 0.018 },
            ],
        },
        {
            eanSeq: 6, code: "PAP006", description: "Papel Higiênico Neve 12un", commercialUnit: "PCT",
            offers: [
                { supplierKey: "carrefour", basePrice: 18.9, monthlyTrend: -0.003 },
                { supplierKey: "makro", basePrice: 19.5, monthlyTrend: -0.001 },
            ],
        },
        {
            // Fornecedor único de propósito — outro caso "sem comparável", agora
            // dentro do dataset volumoso.
            eanSeq: 7, code: "SAB007", description: "Sabonete Dove 90g", commercialUnit: "UN",
            offers: [{ supplierKey: "extra", basePrice: 2.1, monthlyTrend: 0 }],
        },
        {
            // Produto com os 5 fornecedores — o caso mais rico de comparação.
            eanSeq: 8, code: "REF008", description: "Refrigerante Coca-Cola 2L", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 8.9, monthlyTrend: 0.005 },
                { supplierKey: "assai", basePrice: 8.7, monthlyTrend: 0.004 },
                { supplierKey: "carrefour", basePrice: 9.1, monthlyTrend: 0.003 },
                { supplierKey: "extra", basePrice: 8.8, monthlyTrend: 0.006 },
                { supplierKey: "makro", basePrice: 8.6, monthlyTrend: 0.002 },
            ],
        },
        {
            eanSeq: 9, code: "BIS009", description: "Biscoito Recheado Trakinas 130g", commercialUnit: "UN",
            offers: [
                { supplierKey: "assai", basePrice: 3.2, monthlyTrend: 0 },
                { supplierKey: "extra", basePrice: 3.35, monthlyTrend: 0 },
            ],
        },
        {
            eanSeq: 10, code: "MOL010", description: "Molho de Tomate Fugini 340g", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 2.8, monthlyTrend: 0.003 },
                { supplierKey: "makro", basePrice: 2.75, monthlyTrend: 0.003 },
            ],
        },
        {
            eanSeq: 11, code: "FAR011", description: "Farinha de Trigo Dona Benta 1kg", commercialUnit: "UN",
            offers: [
                { supplierKey: "carrefour", basePrice: 5.4, monthlyTrend: 0 },
                { supplierKey: "extra", basePrice: 5.6, monthlyTrend: 0 },
            ],
        },
        {
            eanSeq: 12, code: "AGU012", description: "Água Sanitária Qboa 1L", commercialUnit: "UN",
            offers: [
                { supplierKey: "atacadao", basePrice: 3.1, monthlyTrend: 0.001 },
                { supplierKey: "assai", basePrice: 3.05, monthlyTrend: 0.001 },
                { supplierKey: "makro", basePrice: 3.0, monthlyTrend: 0.001 },
            ],
        },
    ];

    // Upsert de todo o catálogo uma vez só, fora do loop de geração.
    const productByEanSeq = new Map<number, { id: number }>();
    for (const product of catalog) {
        const dbProduct = await upsertProduct({
            ean: fakeEan(product.eanSeq),
            description: product.description,
        });
        productByEanSeq.set(product.eanSeq, dbProduct);
    }

    let accessKeySeq = 1000;
    let createdInvoices = 0;
    let skippedInvoices = 0;

    for (const supplierKey of Object.keys(suppliersByKey) as SupplierKey[]) {
        const supplier = suppliersByKey[supplierKey];

        const offersForSupplier = catalog
            .map((product) => ({
                product,
                offer: product.offers.find((o) => o.supplierKey === supplierKey),
            }))
            .filter((entry): entry is { product: CatalogProduct; offer: CatalogOffer } => Boolean(entry.offer));

        if (offersForSupplier.length === 0) continue;

        for (let month = 0; month < MONTHS; month++) {
            for (let visit = 0; visit < VISITS_PER_SUPPLIER_PER_MONTH; visit++) {
                const itemCount = Math.min(
                    offersForSupplier.length,
                    Math.round(randomBetween(MIN_ITEMS_PER_VISIT, MAX_ITEMS_PER_VISIT)),
                );
                const chosen = sampleWithoutReplacement(offersForSupplier, itemCount);

                const day = Math.round(randomBetween(1, 27));
                const issuedAt = new Date(2026, month, day);

                const items: SeedInvoiceItem[] = chosen.map(({ product, offer }) => {
                    const priceWithTrend = offer.basePrice * Math.pow(1 + offer.monthlyTrend, month);
                    const noisyPrice = priceWithTrend * randomBetween(0.97, 1.03);
                    return {
                        code: product.code,
                        description: product.description,
                        commercialUnit: product.commercialUnit,
                        quantity: Math.round(randomBetween(5, 40)),
                        unitPrice: round2(noisyPrice),
                        productId: productByEanSeq.get(product.eanSeq)!.id,
                    };
                });

                accessKeySeq += 1;
                const result = await seedInvoiceWithItems(accessKeySeq, supplier.id, issuedAt, items);
                if (result.created) createdInvoices += 1;
                else skippedInvoices += 1;
            }
        }
    }

    console.log(
        `Seed concluído: ${Object.keys(suppliersByKey).length} fornecedores, ` +
        `${catalog.length + 3} produtos, ${createdInvoices} notas novas na Parte 2 ` +
        `(${skippedInvoices} já existiam, mais as 7 da Parte 1).`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
