---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-nfe-processing-2026-09-14/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-nfe-processing-2026-09-14/ARCHITECTURE-SPINE.md
---

# nfe-processing - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for nfe-processing, decomposing the requirements from the PRD (Relatório Mensal de Inteligência de Compras) and the Architecture Spine (monthly-report) into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: O sistema pode determinar se uma Empresa é elegível para receber o Relatório Mensal em um dado ciclo — elegível se tiver ao menos 1 Produto comprado em 2 ou mais notas fiscais distintas (de qualquer Fornecedor) em seu histórico completo (lifetime, sem filtro de período). Empresa sem essa condição não recebe o relatório naquele ciclo. Elegibilidade não depende de haver Oportunidade de Economia ou Alerta de Aumento de Preço no período.

FR2: O sistema pode incluir no Relatório Mensal as Oportunidades de Economia do período (mês anterior completo), reaproveitando `GetSavingsOpportunitiesService` (módulo `insights`). Cada Oportunidade exibe: Produto, Fornecedor usado, Fornecedor mais barato disponível no período, valor estimado perdido. Se não houver Oportunidade no período, a seção não aparece (não impede o envio).

FR3: O sistema pode incluir no Relatório Mensal os Alertas de Aumento de Preço do período, reaproveitando `GetProductPriceIncreaseService` (módulo `insights`) e o Limiar de Aumento já configurado. Cada Alerta exibe: Produto, Fornecedor, percentual de aumento, preço anterior vs. atual. Se não houver Alerta no período, a seção não aparece.

FR4: O sistema pode compor uma seção de Situação Normal quando FR2 e FR3 não geram conteúdo no período, e sempre inclui uma linha de contexto sobre o Fornecedor principal do período (reaproveitando `SuppliersService.getTopSellerSuppliers`, módulo `analytics`), com framing de concentração fixo (sem lógica de limiar nova).

FR5: O sistema deve disparar automaticamente, uma vez por mês (dia 1, de madrugada — `[ASSUMPTION]` a confirmar), o processo de geração e envio do Relatório Mensal para todas as Empresas, cobrindo o mês anterior completo, sem intervenção manual.

FR6: O sistema pode enviar o Relatório Mensal por e-mail, via Brevo, a todos os Usuários de cada Empresa elegível (mesmo e-mail, sem distinção de papel). Se o envio falhar para uma Empresa, o sistema registra o erro e segue para as próximas Empresas — sem interromper o job nem retry automático.

### NonFunctional Requirements

NFR1: O volume de e-mails enviados por ciclo deve respeitar o limite gratuito do Brevo (300 e-mails/dia). Quando empresas × usuários elegíveis passar de 250 num único disparo (margem de 50), o envio deve ser distribuído — ao longo de quantos dias forem necessários pra manter cada dia com no máximo ~280 envios (não só distribuído dentro de um único dia — ver AD-6 na Architecture).

NFR2: Falhas de envio por ciclo devem ficar registradas e auditáveis (não é meta de redução de falhas, é garantia de visibilidade — SM-3 do PRD).

NFR3: O conteúdo do relatório deve priorizar precisão sobre volume de alertas — um falso positivo (economia ou aumento que não existiu) é pior do que nenhum alerta naquele mês (contra-métrica SM-C1 do PRD; não otimizar quantidade de alertas às custas de precisão).

### Additional Requirements

- **Sem starter template** — projeto brownfield existente (NestJS 11 + Prisma 7); esta feature estende módulos já ativos, não parte de um scaffold novo.
- **AD-1 (fronteira de módulo):** `InsightsModule` e `AnalyticsModule` ganham `exports` para os services que o novo módulo `monthly-report` consome (`GetSavingsOpportunitiesService`, `GetProductPriceIncreaseService`, `SuppliersService`); `monthly-report` usa `imports: [InsightsModule, AnalyticsModule, PrismaModule]` — nunca redeclara provider.
- **AD-3 (correção em `insights`):** `GetSavingsOpportunitiesService.getSavingsOpportunities` ganha parâmetros opcionais `month`/`year`; sem eles, comportamento atual do endpoint `/insights/savings_opportunities` é preservado.
- **AD-4 (correção em `insights`):** `InsightsRepository.findPurchaseHistoryByProduct` precisa aplicar um corte superior de data (`issuedAt <= fim do mês de referência`) quando `month`/`year` são passados — hoje ignora esses campos por completo, apesar do service já os receber via `FiltersDto`. Sem eles, comportamento atual do endpoint `/insights/product_history` é preservado.
- **AD-5 (modelo de dados novo):** tabela Prisma `MonthlyReportRun` — uma linha por `(companyId, referenceMonth, referenceYear)` com `@@unique` na tripla; status `PENDING → SENDING → SENT | FAILED`; `errorMessage`, `scheduledAt`, `sentAt`. A transição `PENDING → SENDING` deve ser uma escrita condicional atômica (evita double-send entre ticks do drain sobrepostos). Envio é 1 chamada `sendMail` por empresa (todos os usuários no campo `to`), não por usuário.
- **AD-6 (agendamento):** dois `@Cron` — mensal (dia 1, só calcula elegibilidade e agenda, não compõe conteúdo) e "drain" (intervalo curto, ex. 10min, compõe/renderiza/envia os `PENDING` já na hora). `ScheduleModule.forRoot()` precisa ser adicionado aos `imports` de `AppModule` — sem isso os `@Cron` não disparam.
- **AD-7 (isolamento de falha):** cada empresa processada em `try/catch` isolado no coordinator; exceção de uma empresa nunca aborta o ciclo inteiro.
- **AD-8 (janela de período compartilhada):** uma única função (`getReferenceMonthWindow(month, year)`) usada pelas queries de período desta feature (AD-3, AD-4) — nenhuma recalcula a janela por conta própria. **Não se aplica à elegibilidade** (FR-1 é lifetime, sem janela — AD-2). Vive em `insights/utils/get-reference-month-window.ts` — não em `monthly-report` — porque é o próprio repository de `insights` que precisa dela internamente (AD-1: `insights` não pode depender de `monthly-report`). Timezone: local do servidor (convenção já existente no projeto).
- **Stack nova:** `@nestjs/schedule` ^6.1.3 — **não** ^12.x, que é ESM puro e quebra o Jest deste projeto (achado na implementação da Story 2.1); `nodemailer` ^10.0.10 (SMTP Brevo). Adicionar `engines.node: ">=20"` ao `package.json` (nodemailer 10 exige Node ≥20; projeto hoje não fixa versão de Node em lugar nenhum).
- **Estrutura de módulo (seed):** novo módulo `src/v1/modules/monthly-report/` com `services/` (coordinator + 4 estágios), `utils/get-reference-month-window.ts`, `repositories/monthly-report.repository.ts` (leitura de empresas/usuários/produtos do período; escrita de `MonthlyReportRun`).
- **Explicitamente fora de escopo desta quebra em stories** (Deferred na Architecture — não criar stories para isto): canal WhatsApp; limiar de concentração de fornecedor configurável; monitoramento proativo de falha recorrente por empresa (OQ8); fila dedicada BullMQ/Redis; retrofit de `PrismaModule` nos módulos existentes (`invoice`, `auth`, `analytics`, `insights`); Dockerfile/CI/hospedagem; unificação de timezone (UTC) no projeto todo.
- **Decisão explícita adiada para a story** (Deferred, mas *dentro* do escopo de alguma story): mecanismo de preview/disparo manual do relatório (para SM-2 — mostrar conteúdo a alguém fora do projeto); motor de template do e-mail (string simples vs. handlebars/react-email).

### UX Design Requirements

N/A — não existe documento de UX para esta feature. O PRD exclui explicitamente dashboard ou interface web (§5 Non-Goals): a única interface desta iteração é o e-mail em si, cujo conteúdo é especificado pelos próprios FR2–FR4 e pela AD-6 (motor de template é decisão de story, não de UX).

### FR Coverage Map

FR1: Epic 1 - Elegibilidade da empresa (lifetime, ≥1 produto em 2+ notas)
FR2: Epic 1 - Oportunidades de Economia do período
FR3: Epic 1 - Alertas de Aumento de Preço do período
FR4: Epic 1 - Situação Normal + contexto de Fornecedor principal
NFR3: Epic 1 - Precisão do conteúdo > volume de alertas
FR5: Epic 2 - Agendamento mensal automático
FR6: Epic 2 - Envio via Brevo com falha isolada por empresa
NFR1: Epic 2 - Teto do Brevo / distribuição multi-dia
NFR2: Epic 2 - Auditabilidade de envio/falha

## Epic List

### Epic 1: Conteúdo do Relatório Mensal
Constrói o motor que decide elegibilidade e compõe o conteúdo do relatório (oportunidades de economia, alertas de aumento de preço, situação normal, fornecedor principal) para uma empresa e período dados, com um jeito de gerar esse conteúdo sob demanda — sem depender do cron mensal existir. Entrega valor standalone real: dá pra ver exatamente o que o relatório diria, hoje, pra validar a hipótese central do produto (SM-2) antes de qualquer automação de envio estar no ar.
**FRs covered:** FR1, FR2, FR3, FR4, NFR3
**Arquitetura:** AD-1 (fronteira de módulo — feita aqui porque todo o resto depende dela), AD-2, AD-3, AD-4, AD-8

### Epic 2: Envio Automático e Auditável
Usa o motor de conteúdo do Epic 1 e o transforma em produto de verdade: dispara sozinho todo mês (dia 1), envia o relatório por e-mail via Brevo a todos os usuários de cada empresa elegível, respeita o teto de envio do Brevo distribuindo ao longo de múltiplos dias quando necessário, e deixa rastro auditável (quem recebeu, quem falhou, por quê) sem interromper o ciclo por causa de uma empresa. Depende do Epic 1; o Epic 1 continua funcionando (gerando conteúdo sob demanda) independente deste.
**FRs covered:** FR5, FR6, NFR1, NFR2
**Arquitetura:** AD-5, AD-6, AD-7

## Epic 1: Conteúdo do Relatório Mensal

Constrói o motor que decide elegibilidade e compõe o conteúdo do relatório (oportunidades de economia, alertas de aumento de preço, situação normal, fornecedor principal) para uma empresa e período dados, com um jeito de gerar esse conteúdo sob demanda — sem depender do cron mensal existir.

### Story 1.1: Verificar elegibilidade de uma empresa

As a sistema,
I want determinar se uma empresa tem histórico de compra comparável suficiente,
So that só empresas com dado real recebam o relatório.

**Acceptance Criteria:**

**Given** uma empresa com 1 produto comprado em 2+ notas fiscais de fornecedores diferentes
**When** a checagem de elegibilidade roda pra essa empresa
**Then** o resultado é elegível = true

**Given** uma empresa cujo único produto comprado aparece em só 1 nota fiscal
**When** a checagem roda
**Then** o resultado é elegível = false

**Given** o histórico relevante da empresa é de muitos meses atrás
**When** a checagem roda
**Then** a empresa ainda conta como elegível se a condição de "2+ notas" for satisfeita em qualquer momento do histórico
**And** a query de elegibilidade não depende de nenhum service de `insights`/`analytics` — é lifetime, sem filtro de período (FR1, exceção documentada em AD-2)

### Story 1.2: Compor Oportunidades de Economia do período

As a sistema,
I want buscar as oportunidades de economia de uma empresa presas ao mês de referência,
So that o relatório nunca cite uma oportunidade de um mês diferente do anunciado.

**Acceptance Criteria:**

**Given** a última compra do produto foi dentro do mês de referência e existia fornecedor mais barato disponível no período
**When** o conteúdo de oportunidades é composto pra esse mês
**Then** a oportunidade aparece com Produto, Fornecedor usado, Fornecedor mais barato disponível, valor estimado perdido

**Given** a última compra do produto foi 3 meses antes do mês de referência
**When** o conteúdo é composto pro mês de referência
**Then** essa oportunidade NÃO aparece

**Given** `getSavingsOpportunities(companyId)` é chamado sem `month`/`year`
**When** executado
**Then** o comportamento é idêntico ao de antes da mudança — o endpoint `/insights/savings_opportunities` ao vivo não muda
**And** o helper `getReferenceMonthWindow` (AD-8) é a única fonte da janela `{start, end}` usada aqui

### Story 1.3: Compor Alertas de Aumento de Preço do período

As a sistema,
I want buscar os alertas de aumento de preço de uma empresa presos ao mês de referência,
So that o relatório não use uma compra fora do período como "atual" na comparação.

**Acceptance Criteria:**

**Given** um produto com preço acima do limiar de aumento dentro do mês de referência, comparado à média histórica anterior
**When** os alertas do período são compostos
**Then** o alerta aparece com Produto, Fornecedor, percentual de aumento, preço anterior vs. atual

**Given** já existe no banco uma compra do mesmo produto lançada num mês posterior ao mês de referência
**When** os alertas do mês de referência são compostos
**Then** essa compra futura não é usada como "atual" — `findPurchaseHistoryByProduct` respeita o corte superior de data (`issuedAt <= fim do mês de referência`, AD-4)

**Given** nenhum produto foi comprado pela empresa no mês de referência
**When** os alertas são compostos
**Then** a lista de alertas vem vazia, sem erro
**And** `getProductPriceIncrease` sem `month`/`year` preserva o comportamento atual do endpoint `/insights/product_history`

### Story 1.4: Situação Normal, Fornecedor principal, e geração sob demanda

As a operador (Gabriel),
I want gerar o conteúdo completo do relatório de uma empresa/período sob demanda,
So that eu possa validar exatamente o que o e-mail diria antes de qualquer automação de envio existir.

**Acceptance Criteria:**

**Given** uma empresa elegível sem nenhuma Oportunidade de Economia nem Alerta de Aumento de Preço no mês de referência
**When** o conteúdo completo é composto
**Then** aparece a seção de Situação Normal em vez de uma seção vazia ou ausente

**Given** qualquer empresa elegível, com ou sem alerta
**When** o conteúdo completo é composto
**Then** sempre aparece a linha de contexto do Fornecedor principal do período com seu percentual do gasto total, reaproveitando `SuppliersService.getTopSellerSuppliers`

**Given** uma empresa e um mês/ano válidos
**When** Gabriel roda `npm run report:preview -- --companyId=1 --month=8 --year=2026` (script `ts-node`, mesmo padrão de `prisma/seed.ts`)
**Then** o conteúdo completo do relatório daquela empresa/período é impresso no mesmo formato que seria usado no e-mail — sem precisar de nenhum cron ou envio real

## Epic 2: Envio Automático e Auditável

Usa o motor de conteúdo do Epic 1 e o transforma em produto de verdade: dispara sozinho todo mês, envia por e-mail via Brevo, respeita o teto de envio distribuindo por múltiplos dias quando necessário, e deixa rastro auditável sem interromper o ciclo por causa de uma empresa.

### Story 2.1: Registrar e agendar o ciclo mensal

As a sistema,
I want uma vez por mês criar um registro auditável por empresa elegível com um horário de envio distribuído,
So that o envio possa acontecer depois sem recalcular elegibilidade nem estourar o teto diário do Brevo.

**Acceptance Criteria:**

**Given** empresas elegíveis cujo total de usuários no ciclo é ≤ 250
**When** o cron mensal (dia 1) roda
**Then** uma linha `PENDING` é criada por empresa elegível, com `scheduledAt = now()`

**Given** o total do ciclo passa de 250 mas cabe em 2 dias respeitando ~280/dia
**When** o cron mensal roda
**Then** as linhas `PENDING` são distribuídas ao longo de 2 dias — nunca só dentro de um único dia (AD-6)

**Given** o job mensal roda duas vezes pro mesmo ciclo (ex.: restart do processo)
**When** a segunda execução roda
**Then** nenhuma linha duplicada é criada pra uma empresa que já tem registro pro mesmo `(companyId, referenceMonth, referenceYear)` — respeita o `@@unique` (AD-5)

### Story 2.2: Enviar o relatório e registrar o resultado com isolamento por empresa

As a sistema,
I want enviar os relatórios já agendados e registrar o resultado por empresa, isolando a falha de uma só,
So that um e-mail inválido ou erro de SMTP numa empresa nunca trave o ciclo nem seja enviado duas vezes.

**Acceptance Criteria:**

**Given** uma linha `PENDING` com `scheduledAt <= agora`
**When** o drain roda
**Then** a linha é reivindicada atomicamente (`PENDING → SENDING`) antes de compor/enviar — dois ticks do drain sobrepostos não enviam a mesma empresa duas vezes (AD-5)

**Given** uma empresa com 3 usuários
**When** o envio acontece
**Then** é 1 única chamada `sendMail` com os 3 e-mails no campo `to`, e a linha vira `SENT`

**Given** a composição ou o envio de uma empresa lança uma exceção
**When** o drain processa o lote daquele tick
**Then** a linha dessa empresa vira `FAILED` com `errorMessage` preenchido, e as outras empresas do lote continuam sendo processadas normalmente (AD-7)

**Given** a aplicação sobe
**When** `AppModule` é carregado
**Then** `ScheduleModule.forRoot()` está registrado e os dois crons (mensal e drain) aparecem no `SchedulerRegistry` do Nest — cobre o erro silencioso encontrado na Reviewer Gate da Architecture (AD-6)
