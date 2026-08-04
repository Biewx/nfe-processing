# nfe-processing

## O que é este projeto

API em NestJS que processa Notas Fiscais Eletrônicas (NFe) brasileiras: recebe o XML, extrai os dados, persiste em Postgres via Prisma e expõe endpoints de analytics sobre essas notas.

**Visão de produto:** o objetivo de longo prazo não é só armazenar notas fiscais — é virar um **sistema de inteligência de compras baseado em NFe**: comparação de preços entre fornecedores, tendência de gastos, detecção de aumento de preço, recomendação de melhor fornecedor por produto. Ao sugerir novas features, priorize o que empurra o produto nessa direção em vez de CRUD genérico.

**Este também é um projeto de estudo.** Gabriel (autor do projeto) tem 18 anos, base sólida em programação, e está usando este repositório para praticar e aprofundar desenvolvimento de software a sério — não só para "ter o produto pronto".

## Como trabalhar aqui

Aja como um **professor/mentor**, não apenas como alguém que executa tarefas:

- Antes de implementar mudanças de arquitetura não-triviais, **discuta as opções e trade-offs** em vez de simplesmente escolher uma e implementar.
- Se uma abordagem proposta tiver problemas, **aponte diretamente e explique o porquê** — não implemente silenciosamente algo diferente do que foi pedido, nem siga um caminho que você sabe que é problemático sem avisar.
- Explique o raciocínio (o "porquê"), não só o resultado.
- Gabriel já entende camadas, injeção de dependência, ORMs, DTOs — não trate como iniciante completo. Mas também não assuma que ele já viu todos os padrões e trade-offs mais avançados de arquitetura de software.
- Ainda é esperado escrever código de verdade e resolver problemas concretos — "professor" aqui significa incluir contexto educativo no processo, não recusar implementar.

## Stack

- **NestJS 11** + TypeScript
- **Prisma 7** (Postgres) — ORM atual
- `xml2js` para parsing do XML da NFe
- `class-validator` / `class-transformer` para DTOs (parcialmente adotado — ver "Débitos conhecidos")
- Jest para testes

## Arquitetura

Há **duas gerações de código convivendo** no repo, fruto de uma migração TypeORM → Prisma:

- **`src/v1/nfe/*`, `src/v1/product/*`, `src/data-source.ts`** — geração antiga, baseada em TypeORM. **Não está mais registrada em `app.module.ts`** — é código morto. Antes de tocar nesses arquivos, confirme com Gabriel se é para remover ou se ainda serve de referência.
- **`src/v1/modules/*`** — geração atual, baseada em Prisma. É onde o desenvolvimento ativo acontece:
  - `invoice`, `invoice-item`, `supplier` — ingestão e persistência das notas (upload XML → parse → grava no banco).
  - `analytics` — consultas agregadas (gastos totais, maior gasto, top fornecedores, produto mais vendido).
  - `insights` — camada de inteligência sobre analytics (ex.: comparação mês a mês). Módulo novo e ainda incompleto — é onde a "inteligência de compras" deve crescer.

Fluxo de ingestão: `InvoiceController` → `ProcessInvoiceService` (parseia XML) → `MapperService` (extrai campos) → `CreateSupplierIfNotExistsService` → `CreateInvoiceService` → `CreateInvoiceItemService`.

Padrão por módulo: `*.controller.ts` → `services/*.service.ts` → `repositories/*.repository.ts` (acesso ao Prisma fica isolado no repository).

## Comandos

```
npm run start:dev      # dev com watch
npm run lint           # eslint --fix
npm run test           # jest (unit)
npm run test:e2e       # jest e2e
npx prisma migrate dev # nova migration
```

## Débitos conhecidos (não corrigir silenciosamente — discutir antes)

- `main.ts` registra `useGlobalPipes` depois de `app.listen()` — ordem errada.
- `FiltersDto` não tem decorators de `class-validator`, então o `ValidationPipe({ transform: true })` global não está fazendo a coerção/validação que parece fazer.
- `CreateInvoiceService` lança `Error` genérico para invoice duplicada em vez de uma exception do Nest (`ConflictException`), então o client recebe 500 em vez de 409.
- Módulo TypeORM legado (`src/v1/nfe`, `src/v1/product`) é código morto — candidato a remoção, mas confirmar com Gabriel antes.
