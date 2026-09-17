---
title: Relatório Mensal de Inteligência de Compras
status: final
created: 2026-09-14
updated: 2026-09-14
---

# PRD: Relatório Mensal de Inteligência de Compras
*Working title — confirmar.*

## 0. Document Purpose

Este PRD descreve a primeira iteração de um relatório mensal por e-mail que entrega, a quem usa o nfe-processing, a inteligência de compras que o sistema já calcula. É dirigido a quem for desenhar a arquitetura técnica (`bmad-architecture`) e quebrar isto em stories (`bmad-create-epics-and-stories`) em seguida. Os requisitos funcionais (FR) são numerados globalmente e referenciados por ID por esses documentos posteriores; suposições sem validação de campo são marcadas inline como `[ASSUMPTION]` e listadas na seção 9; pontos que exigem uma decisão de produto antes de seguir para arquitetura/stories são marcados inline como `[NOTE FOR PM]`. Este PRD parte do `brief.md` e `addendum.md` já existentes em `_bmad-output/planning-artifacts/briefs/brief-nfe-processing-2026-09-10/` — detalhe técnico e rationale de decisões rejeitadas (ex.: escolha do provedor de e-mail) vivem no `addendum.md` deste mesmo workspace, não aqui.

## 1. Vision

O nfe-processing já resolve o processamento e a ingestão de Notas Fiscais Eletrônicas (NFe): recebe o XML, extrai os dados, persiste, e sobre esses dados calcula inteligência real — comparação de preço entre fornecedores, tendência de gastos, detecção de aumento de preço e recomendação do melhor fornecedor por produto. Esse motor analítico existe e funciona no módulo `insights`.

O problema não é falta de inteligência — é falta de acesso a ela. Hoje, a única forma de ver esses insights é chamar a API diretamente, o que na prática significa que só o Gabriel os vê. O valor calculado nunca chega a quem ele deveria ajudar: o dono de um pequeno negócio que compra de fornecedores recorrentes e, na hipótese que motiva este produto, não tem visibilidade sistemática sobre se está pagando o preço certo. `[ASSUMPTION: essa dor ainda não foi validada com nenhum dono de negócio real — é uma hipótese fundamentada em raciocínio e pesquisa de mercado informal, não em evidência de campo; tratá-la como confirmada seria enganoso. Ver §8 OQ3.]`

O Relatório Mensal de Inteligência de Compras é a primeira interface desse motor — não adiciona nova análise, mas entrega, uma vez por mês e por e-mail, o que o sistema já sabe: quanto foi perdido em oportunidades de economia não aproveitadas, quais fornecedores aumentaram preço acima do esperado, e — mesmo quando não há nada de alarmante — um retrato honesto da situação de compras da empresa naquele período. É o primeiro passo pra transformar "dado calculado" em "valor entregue", numa trajetória de longo prazo que pretende crescer de "descobrir a perda" para "recomendar a ação" (trocar de fornecedor, renegociar) — o e-mail mensal é só o primeiro degrau dessa escada, não o destino final.

## 2. Target User

### 2.1 Jobs To Be Done

- Donos de pequenos negócios com fornecedores recorrentes (mercearias, lojas de material de construção, e afins) que compram de forma repetida e, na hipótese que motiva este produto (`[ASSUMPTION]`, ver §1), querem saber, sem esforço manual, se estão pagando o preço certo pelos produtos que compram sempre.
- Querem isso sem precisar aprender uma ferramenta nova, abrir um dashboard, ou digitar preços/catálogos manualmente — o e-mail chega sozinho, a partir de dado que a empresa já gera por obrigação fiscal (a NFe recebida).

### 2.2 Non-Users (v1)

- `[ASSUMPTION]` Nenhum nicho vertical específico foi escolhido ainda — o relatório vai para qualquer empresa cadastrada no sistema, independente do ramo. Isso é uma aposta deliberada e também um risco em aberto (ver §8), não uma decisão fechada com convicção.
- Empresas sem histórico de compra comparável (ver FR de elegibilidade em §4) não recebem o relatório neste v1 — não porque não sejam público-alvo, mas porque o sistema ainda não tem dado suficiente pra dizer algo honesto sobre elas.

## 3. Glossary

- **Empresa** — o tenant/cliente do sistema (multi-tenant, isolado por autenticação). Tem um ou mais **Usuários**.
- **Usuário** — pessoa autenticada vinculada a uma Empresa; todos os Usuários de uma Empresa recebem o relatório, sem distinção de papel/dono neste v1.
- **Fornecedor** — origem de uma compra registrada via NFe.
- **Produto** — item comprado, identificado de forma consistente entre notas fiscais para permitir comparação entre Fornecedores.
- **Oportunidade de Economia** — um Produto comprado de um Fornecedor mais caro quando um Fornecedor mais barato para o mesmo Produto existia disponível no período; calculada pelo endpoint existente `savings_opportunities` do módulo `insights`.
- **Alerta de Aumento de Preço** — sinalização de que um Fornecedor aumentou o preço de um Produto acima do Limiar de Aumento já definido no sistema; baseado no histórico de preço (`product_history`) do módulo `insights`.
- **Limiar de Aumento** — percentual de aumento de preço, já configurado no sistema (fora do escopo deste PRD), acima do qual um Alerta de Aumento de Preço é gerado.
- **Situação Normal** — estado do relatório de um período em que nenhuma Oportunidade de Economia nem Alerta de Aumento de Preço foi identificado, mas a Empresa tinha dado suficiente para a checagem ser válida.
- **Fornecedor principal** — o Fornecedor com maior percentual do gasto total da Empresa no período, calculado via `GET /analytics/topSeller`.
- **Relatório Mensal** — o e-mail enviado uma vez por mês a cada Usuário de cada Empresa elegível, contendo Oportunidades de Economia, Alertas de Aumento de Preço, e/ou Situação Normal do período.

## 4. Features

### 4.1 Relatório Mensal de Inteligência de Compras

**Description:** Uma vez por mês, o sistema verifica quais Empresas têm dado suficiente para uma leitura honesta, monta um e-mail com o que o motor de `insights` e `analytics` já sabe sobre o período, e envia a todos os Usuários de cada Empresa elegível via Brevo. Não introduz nenhuma análise nova — reaproveita três fontes de dado já existentes (`savings_opportunities`, `product_history`, `topSeller`) e concentra o trabalho novo em elegibilidade, composição do texto, agendamento e envio.

**Functional Requirements:**

#### FR-1: Elegibilidade de envio

O sistema pode determinar se uma Empresa é elegível para receber o Relatório Mensal em um dado ciclo.

**Consequências (testáveis):**
- Empresa é elegível se tiver ao menos 1 Produto comprado em 2 ou mais notas fiscais distintas (de qualquer Fornecedor) em seu histórico.
- Empresa sem nenhum Produto nessa condição não recebe o relatório naquele ciclo.
- Elegibilidade não depende de haver Oportunidade de Economia ou Alerta de Aumento de Preço no período — só da existência de dado comparável.

`[ASSUMPTION: threshold "1 produto em 2+ notas" definido por raciocínio técnico, sem dado de campo para calibrar; revisar quando houver sinal real de uso.]`

#### FR-2: Composição — Oportunidades de Economia

O sistema pode incluir no Relatório Mensal as Oportunidades de Economia identificadas no período, reaproveitando o endpoint existente `savings_opportunities` do módulo `insights`.

**Consequências (testáveis):**
- Cada Oportunidade de Economia exibida mostra: Produto, Fornecedor usado, Fornecedor mais barato disponível no período, valor estimado perdido.
- Se não houver Oportunidade de Economia no período, esta seção não aparece no e-mail (não impede o envio — ver FR-4).

#### FR-3: Composição — Alertas de Aumento de Preço

O sistema pode incluir no Relatório Mensal os Alertas de Aumento de Preço do período, reaproveitando o histórico de preço (`product_history`) do módulo `insights` e o Limiar de Aumento já configurado no sistema.

**Consequências (testáveis):**
- Cada Alerta de Aumento de Preço exibido mostra: Produto, Fornecedor, percentual de aumento, preço anterior vs. preço atual.
- Se não houver Alerta de Aumento de Preço no período, esta seção não aparece no e-mail.

#### FR-4: Composição — Situação Normal e contexto de Fornecedor principal

O sistema pode compor uma seção de Situação Normal quando nem FR-2 nem FR-3 geram conteúdo no período, e sempre inclui uma linha de contexto sobre o Fornecedor principal do período, reaproveitando `GET /analytics/topSeller`.

**Consequências (testáveis):**
- Quando FR-2 e FR-3 não produzem conteúdo, o e-mail exibe uma mensagem de Situação Normal (ex.: "Nenhuma mudança relevante de preço identificada este mês nos produtos acompanhados") em vez de seção vazia ou e-mail incompleto.
- Toda edição do relatório — com ou sem alerta — inclui uma linha fixa citando o Fornecedor principal do período e seu percentual do gasto total, com framing de concentração (texto-modelo fixo, sem lógica de limiar nova). Ex.: "Seu fornecedor principal este mês foi [Fornecedor], respondendo por [X]% das suas compras — vale avaliar se essa concentração te deixa numa boa posição pra negociar."

**Out of Scope:**
- Limiar de concentração que dispara destaque/alerta automático (ex.: só mostrar se >50%) — deferido, ver §5 Non-Goals.

#### FR-5: Agendamento

O sistema deve disparar automaticamente, uma vez por mês, o processo de geração e envio do Relatório Mensal para todas as Empresas.

**Consequências (testáveis):**
- O job roda em cadência mensal sem intervenção manual.
- Cada execução cobre o período do mês anterior completo.

`[ASSUMPTION: disparo no dia 1 de cada mês, de madrugada, cobrindo o mês anterior inteiro — a confirmar.]`

#### FR-6: Envio

O sistema pode enviar o Relatório Mensal por e-mail, via Brevo, a todos os Usuários de cada Empresa elegível.

**Consequências (testáveis):**
- Todo Usuário de uma Empresa elegível recebe o mesmo e-mail, sem distinção de papel/dono.
- Se o envio falhar para uma Empresa, o sistema registra o erro e segue para as próximas Empresas — sem interromper o job nem tentar reenviar automaticamente. `[ASSUMPTION: aceito conscientemente como trade-off do v1 — simplicidade sobre resiliência. Uma Empresa cujo envio falha repetidamente (vários ciclos seguidos) só é detectável revisando log manualmente; não há alerta proativo pra isso. Ver §8 OQ8.]`

**Feature-specific NFRs:**
- O volume de e-mails enviados por ciclo deve respeitar o limite gratuito do Brevo (300 e-mails/dia) — ver addendum para o rationale da escolha do provedor. Quando o número de Empresas × Usuários elegíveis ultrapassar 250 e-mails num único disparo (margem de 50 sobre o limite diário), o envio deve ser distribuído ao longo do dia em vez de disparado tudo de uma vez.

## 5. Non-Goals (Explicit)

- **Canal WhatsApp** para alertas — não nesta iteração. É o "cotovelo natural" se o e-mail validar a tese, mas não faz parte deste PRD. `[NOTE FOR PM: sem critério definido de "quando" considerar o e-mail validado o suficiente pra justificar esse próximo passo.]`
- **Dashboard ou interface web** — o e-mail é a única interface desta iteração.
- **Preferências de usuário** (opt-in, frequência, filtros de conteúdo) — todo Usuário de toda Empresa elegível recebe o mesmo relatório, sem configuração.
- **Escolha de nicho vertical** — o relatório vai para qualquer Empresa cadastrada, sem foco de segmento definido (ver `[ASSUMPTION]` em §2.2).
- **Geração de dados de teste mais realistas** — item técnico separado (ver addendum), não bloqueia esta iniciativa.
- **Novos tipos de insight** além dos três já reaproveitados (Oportunidade de Economia, Alerta de Aumento de Preço, contexto de Fornecedor principal) — candidato a versão futura, parte da trajetória de longo prazo "descobrir a perda → recomendar a ação" citada em §1. `[NOTE FOR PM: revisar quando houver sinal de que o hábito do e-mail está validado.]`
- **Limiar de concentração de fornecedor configurável/dinâmico** — a versão desta iteração usa texto-modelo fixo, sem lógica de limiar (ver FR-4, Out of Scope).
- **Validação formal da hipótese de valor central** ("vale a pena pagar para descobrir essa perda") — tratada como risco em aberto (§8), não como tarefa desta iteração.

## 6. MVP Scope

### 6.1 In Scope

- Job mensal automático, cobrindo o mês anterior completo (FR-5).
- Cálculo de elegibilidade por Empresa (FR-1).
- Composição do e-mail com Oportunidades de Economia, Alertas de Aumento de Preço, Situação Normal e contexto de Fornecedor principal (FR-2 a FR-4).
- Envio via Brevo (SMTP, remetente individual verificado) a todos os Usuários de cada Empresa elegível (FR-6).
- Tratamento de falha por Empresa: registra e segue, sem retry automático, sem parar o job (FR-6).

### 6.2 Out of Scope for MVP

Mesma lista de §5 Non-Goals — sem duplicar o racional aqui.

## 7. Success Metrics

*Este é um projeto pré-lançamento, sem usuários reais ainda — as métricas abaixo avaliam esta iteração específica (o processo funciona, o conteúdo é compreensível), não o produto como negócio.*

**Primary**
- **SM-1**: O relatório é gerado e enviado automaticamente, uma vez por mês, a toda Empresa elegível, sem intervenção manual. Valida FR-1, FR-5, FR-6.
- **SM-2**: O conteúdo é compreensível por alguém sem contexto técnico — validado mostrando para ao menos uma pessoa fora do projeto e observando a reação (qualitativo, informal, uma amostra). Valida FR-2, FR-3, FR-4.

**Secondary**
- **SM-3**: Falhas de envio por ciclo ficam registradas e auditáveis em log. Não é meta de redução — é garantia de visibilidade. Valida FR-6.

**Counter-metrics (não otimizar)**
- **SM-C1**: Não otimizar para "quantidade de Oportunidades de Economia / Alertas de Aumento de Preço gerados por ciclo" às custas de precisão. Um relatório com falsos positivos (economia ou aumento que não existiu de fato) destrói a confiança mais rápido do que simplesmente não ter alerta naquele mês. Contrabalança SM-1/SM-2.
- **SM-C2**: A hipótese central de valor ("vale a pena pagar para descobrir essa perda") permanece um risco em aberto, não uma métrica de sucesso desta iteração — não há usuário real ainda para medi-la.

## 8. Open Questions

1. Nicho vertical não definido — aposta deliberada, risco em aberto (herdado do brief).
2. Diferenciação competitiva não comprovada — pesquisa de mercado encontrou "lacuna parcial, não total" (Qive já cobre algo parecido, mas em formato enterprise/consultivo). Isso ainda não é um fosso defensável — é uma leitura de mercado com evidência fraca-a-moderada, não um diferencial comprovado. Ver addendum.
3. Hipótese central de valor não validada com nenhum dono de negócio real; sem plano formal de validação (ver addendum — tratada como "radar" informal).
4. Dia/horário exato do disparo mensal — assumido dia 1, de madrugada (§4 FR-5), sem confirmação final nem checagem contra o volume real de Empresas × limite do Brevo.
5. Quando revisitar a expansão para mais tipos de insight (§5) — sem critério ou data definida.
6. Quando revisitar um limiar de concentração de fornecedor configurável (§4 FR-4 Out of Scope) — sem critério definido.
7. Critério de "e-mail validado o suficiente" para justificar o próximo passo (WhatsApp, §5) — não definido.
8. Falha de envio repetida pra mesma Empresa (§4 FR-6) — aceito como trade-off do v1, mas sem critério de quando isso deixa de ser aceitável e passa a exigir monitoramento ativo.

## 9. Assumptions Index

- §1 Vision / §2.1 JTBD — A dor central do produto (donos de pequeno negócio não têm visibilidade sistemática sobre preço) é uma hipótese fundamentada em raciocínio e pesquisa de mercado informal, não validada com nenhum dono de negócio real.
- §2.2 Non-Users — Nenhum nicho vertical definido; o relatório vai para qualquer Empresa cadastrada, independente do ramo.
- §4 FR-1 — Threshold de elegibilidade ("1 Produto em 2+ notas fiscais distintas") definido por raciocínio técnico, sem dado de campo para calibrar.
- §4 FR-5 — Agendamento assumido como dia 1 de cada mês, de madrugada, cobrindo o mês anterior completo.
- §4 FR-6 — Falha de envio silenciosa e recorrente pra mesma Empresa é aceita conscientemente como trade-off do v1 (simplicidade sobre resiliência), sem monitoramento proativo.

