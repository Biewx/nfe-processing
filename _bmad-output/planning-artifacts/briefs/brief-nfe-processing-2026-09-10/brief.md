---
title: Inteligência de Compras para Pequenos Negócios (nfe-processing)
status: draft
created: 2026-09-10
updated: 2026-09-10
---

# Product Brief: nfe-processing — Inteligência de Compras

## Resumo Executivo

Este brief propõe que o próximo passo do nfe-processing seja dar ao produto sua primeira "cara" real: um **relatório mensal por e-mail**, automático, que entrega a quem compraria por causa dela a inteligência que o sistema já produz — sem exigir dashboard, login ou qualquer mudança de hábito do usuário.

O nfe-processing nasceu como projeto de estudo de Gabriel para praticar NestJS e desenvolvimento de software a sério, e evoluiu para algo maior: um sistema que lê automaticamente Notas Fiscais Eletrônicas (NFe) brasileiras e transforma esses dados em inteligência de compras — sem exigir que ninguém digite nada na mão. Hoje o motor analítico já existe e funciona: comparação de preço entre fornecedores, detecção de aumento de preço, tendência de gastos e recomendação de melhor fornecedor, tudo multi-tenant e por trás de autenticação. O que falta não é mais análise — é **alcance**: nenhuma dessas informações chega hoje a alguém além do próprio Gabriel via chamada de API.

## O Problema

Pequenos negócios que compram de fornecedores recorrentes (mercearias, lojas de material de construção, e afins) não têm visibilidade sistemática sobre se estão pagando o preço certo. Hoje, isso é resolvido de cabeça ou simplesmente não é resolvido — falta hábito e ferramenta acessível para comparar preço entre fornecedores do mesmo produto ao longo do tempo.

**Importante: esta dor ainda não foi validada com nenhum dono de negócio real.** É uma hipótese fundamentada em raciocínio e em pesquisa de mercado (ver Addendum), não em evidência de campo. Tratar como validada seria enganoso.

## A Solução

Um relatório mensal, enviado automaticamente por e-mail a cada usuário de cada empresa cadastrada, resumindo em linguagem simples:
- Oportunidades de economia perdidas no mês (produto, fornecedor usado vs. fornecedor mais barato, valor estimado perdido).
- Alertas de aumento de preço (quando um fornecedor subiu o preço de um produto acima do limiar já definido no sistema).

Tecnicamente, isso reaproveita os endpoints de `insights` já implementados (`savings_opportunities`, `product_history`) — o trabalho novo é formatar isso de forma legível para quem não é técnico, agendar o envio e mandar por e-mail via Brevo (free tier, sem custo, ver Addendum).

## O Que Torna Isso Diferente

- **Dado de entrada automático**: o produto lê a NFe que a empresa já recebe por obrigação fiscal — não exige nenhuma digitação manual de preço ou catálogo, diferente de plataformas de cotação (que dependem de pedir orçamento ativamente a fornecedores cadastrados).
- **Leve e self-service**: a pesquisa de mercado (Addendum) encontrou que a combinação "comparação de preço entre fornecedores a partir de NFe" já existe — mas embutida em produto enterprise de contas a pagar, vendido de forma consultiva, sem preço público. `[ASSUMPTION]` Não encontramos um concorrente confirmado que entregue isso de forma leve, barata e self-service para o pequeno negócio não-industrializado — esse é o espaço que o nfe-processing tentaria ocupar.
- Isso ainda não é um "fosso" defensável — é uma leitura de mercado, não um diferencial comprovado.

## A Quem Isso Serve

Donos de pequenos negócios com fornecedores recorrentes — hoje sem nicho vertical definido (ex.: mercearia, loja de material de construção). `[ASSUMPTION]` Essa amplitude é uma aposta deliberada, mas também reflete incerteza real sobre qual nicho escolher; é um risco em aberto, não uma decisão fechada com convicção.

## Critérios de Sucesso

Como este é um projeto pré-lançamento, sem usuários reais ainda, os critérios abaixo são para *esta iteração específica*, não para o produto como negócio:

- O relatório é gerado e enviado automaticamente, uma vez por mês, para todo usuário de toda empresa com dados suficientes.
- O conteúdo é compreensível por alguém sem contexto técnico (validação qualitativa: mostrar para pelo menos uma pessoa fora do projeto e observar a reação).
- A hipótese de valor central ("vale a pena pagar para descobrir essa perda") permanece como risco documentado até haver qualquer sinal de campo — mesmo que informal.

## Escopo

**Dentro desta iteração:**
- Job agendado mensal.
- E-mail via Brevo (SMTP, remetente individual verificado, sem domínio próprio).
- Conteúdo: savings opportunities + alertas de aumento de preço.
- Envio para todos os usuários de cada empresa (sem distinção de papel/dono).

**Fora desta iteração** (não é "nunca", é "não agora"):
- Canal WhatsApp — cotovelo natural se o e-mail validar a tese.
- Dashboard ou qualquer interface web.
- Preferências de usuário / opt-in / configuração de frequência.
- Escolha definitiva de nicho vertical.
- Geração de dados de teste mais realistas — fica como item técnico separado, não bloqueia esta iteração.

## Visão

Se a hipótese central se sustentar, o nfe-processing tem caminho para se tornar uma ferramenta leve de inteligência de compras que qualquer pequeno negócio brasileiro poderia adotar sem precisar de um ERP completo — crescendo do e-mail mensal para alertas em tempo quase real via WhatsApp, e de "descobrir a perda" para "recomendar a ação" (trocar de fornecedor, renegociar). Mas o valor imediato deste projeto, independente do produto decolar ou não, é o que ele já está ensinando a Gabriel sobre transformar uma visão vaga em decisão de produto defensável.
