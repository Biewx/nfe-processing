---
title: Addendum — Inteligência de Compras (nfe-processing)
created: 2026-09-10
updated: 2026-09-10
---

# Addendum

Conteúdo de apoio que não cabe no brief enxuto, mas que a PRD e a arquitetura vão precisar depois.

## Pesquisa de mercado (comparáveis)

Pesquisa feita em 2026-09-10 (busca web) para checar se a proposta de valor já é atendida por algum concorrente.

**ERPs de PME que importam NFe (Bling, Tiny, Omie, ContaAzul, MarketUP, eGestor):** importam XML de nota de entrada, mas uso é operacional (baixa de estoque, contas a pagar). Blogs (ex.: Bling, Omie) sugerem que dá para "cortar custos analisando suas NFes" — discurso de marketing sobre dado já armazenado, sem funcionalidade de comparação de preço entre fornecedores construída.

**Qive (ex-Arquivei):** único player confirmado com "análise de produtos e fornecedores com histórico de preço e comparação entre fornecedores" a partir de NFe — fonte: blog institucional. Porém, posicionamento atual é enterprise: contas a pagar, integração SAP/TOTVS/Oracle, venda consultiva, sem preço público. Não é um produto leve/self-service para pequeno negócio não-industrializado.

**Plataformas de cotação (construção civil — Balize, Construcompras):** comparam preço entre fornecedores, mas via RFQ ativo (pedir orçamento), não análise passiva de NFe já emitida. Mecanismo diferente, não concorrente direto.

**Tese "ERP grande é pesado demais para isso":** sem evidência brasileira direta e específica para este recorte. Existe analogia internacional válida — Procurify/Precoro/Tradogram se posicionam como alternativa leve a Coupa/SAP Ariba no mercado de procurement — o que dá algum crédito à tese sem confirmá-la aqui.

**Conclusão da pesquisa:** lacuna parcial, não total. A funcionalidade central já existe em pelo menos um lugar, mas embutida em produto pesado/consultivo. O espaço em aberto (não confirmado como vazio, apenas não encontrado) é entregar isso de forma leve e barata para o pequeno negócio.

Fontes:
- arquivei.com.br/blog/nota-fiscal-gastos-compras
- qive.com.br/blog/gestao-de-fornecedores-notas-fiscais-arquivei
- qive.com.br/pequenas-empresas e qive.com.br/enterprise
- blog.bling.com.br/corte-custos-analisando-nfes
- ajuda.bling.com.br (import XML)
- ajuda.omie.com.br (recebimento NF-e fornecedor)
- infovarejo.com.br/confronto-entre-pedido-de-compra-e-nfe
- balize.com.br e construcompras.construmarket.com.br
- reclameaqui.com.br/bling (queixas genéricas de complexidade)
- spendflo.com/blog/procurify-vs-coupa-comparison

## Suposições não verificadas por trás da tese de valor

A frase-gancho "quem não pagaria R$100 para descobrir que está perdendo R$10 mil" empacota três suposições que não foram testadas:

1. O comprador já precisa desconfiar que a perda existe — ninguém paga para "talvez descobrir" algo em que não acredita.
2. R$10 mil é um número de exemplo, não calibrado a nenhum porte de negócio real.
3. Mesmo com a informação em mãos, o dono pode não agir — relação com fornecedor (prazo de pagamento, confiança, garantia de entrega) frequentemente pesa mais que preço unitário.

Encaminhamento combinado: sem teste formal por enquanto (Gabriel não tem intimidade suficiente com os donos de negócio que conhece para pedir isso diretamente). Fica como "radar ligado" — perguntar de forma leve e casual ("você já descobriu que estava pagando mais caro do que podia?") na próxima oportunidade social natural, sem virar tarefa formal nem bloquear o desenvolvimento.

## Decisão técnica: provedor de e-mail

Comparado Resend vs. Brevo para envio de e-mail de baixo volume, sem custo:

- **Resend**: 3.000 e-mails/mês grátis, limite de 100/dia, sem cartão — mas **não permite enviar para terceiros sem domínio próprio verificado** (modo sandbox só manda para o e-mail do próprio dono da conta, por design anti-abuso).
- **Brevo**: 300 e-mails/dia grátis para sempre, sem cartão. Permite **verificar um remetente individual** (e-mail avulso, via código de confirmação) sem exigir domínio — suficiente para enviar a destinatários reais desde já. Fala SMTP tradicional, compatível com `nodemailer`.

**Decisão: Brevo**, porque o projeto ainda não tem domínio próprio e a Resend exigiria comprar/configurar um antes de mandar a qualquer pessoa fora da conta do Gabriel. Reavaliar se/quando houver domínio próprio do projeto.

## Gap conhecido: dados de teste

O parser de XML de NFe funciona; existe um script de seed com dados fictícios que já funcionou, mas com volume/diversidade limitados para validar a lógica de comparação em cenários variados (múltiplos fornecedores por produto, unidades comerciais divergentes, tendências de preço).

Duas necessidades distintas, encaminhamentos diferentes:
- **Confiança na lógica**: não depende de dado real — depende de melhorar o gerador sintético (mais diversidade de fornecedor/unidade/tendência) e/ou expandir os testes unitários já existentes em `insights/services/*.spec.ts`. Tratar como tarefa de engenharia separada, fora do escopo desta iniciativa.
- **Dado real para validação social**: só é necessário no momento em que a validação informal (acima) de fato acontecer. Caminho mais realista: pedir XMLs antigos de NFe a alguém que já os tem guardado (obrigação legal de 5 anos, muitas vezes com o contador) — pedido concreto e mais leve que "testar o sistema".

Nenhum dos dois bloqueia a iteração do relatório mensal por e-mail.
