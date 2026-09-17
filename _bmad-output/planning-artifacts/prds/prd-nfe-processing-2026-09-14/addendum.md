# Addendum — Relatório Mensal de Inteligência de Compras

Conteúdo que embasa o PRD mas não pertence ao corpo dele: profundidade da pesquisa de mercado, hipóteses não testadas por trás do value-prop, rationale de uma alternativa rejeitada (provedor de e-mail) e um gap técnico de dado de teste, deferido. Fonte original: `brief.md` e `addendum.md` em `_bmad-output/planning-artifacts/briefs/brief-nfe-processing-2026-09-10/`.

## Pesquisa de mercado (informal, busca única em 2026-09-10)

- **Qive (ex-Arquivei)**: único concorrente confirmado com histórico de preço + comparação entre fornecedores a partir de NFe. Mas é enterprise: contas a pagar, integração SAP/TOTVS/Oracle, venda consultiva, sem preço público. "Não é um produto leve/self-service para pequeno negócio não-industrializado."
- **ERPs de PME** (Bling, Tiny, Omie, ContaAzul, MarketUP, eGestor): importam XML de NFe recebida, mas uso é operacional (baixa de estoque, contas a pagar). Blogs sugerem "cortar custos analisando NFes" — discurso de marketing sobre dado já armazenado, sem funcionalidade de comparação de preço construída.
- **Plataformas de cotação** (Balize, Construcompras): comparam preço entre fornecedores, mas via RFQ ativo (pedir cotação), não análise passiva de NFe já emitida — mecanismo diferente, não concorrente direto.
- **Tese "ERP grande é pesado demais"**: sem evidência brasileira direta; só uma analogia internacional (Procurify/Precoro/Tradogram como alternativas leves a Coupa/SAP Ariba) — dá algum crédito à tese sem confirmá-la.
- **Conclusão explícita da pesquisa**: "lacuna parcial, não total" — o recurso central já existe em pelo menos um lugar (Qive), mas embalado de forma pesada/consultiva. O espaço leve/self-service está "não confirmado como vazio, apenas não encontrado" — evidência fraca-a-moderada, suficiente para prosseguir, não para reivindicar oceano azul validado.
- Fontes: blog e páginas institucionais da Qive/Arquivei, Bling, Omie, Balize/Construmarket, Spendflo (comparativo Procurify vs Coupa) — busca única, sem entrevistas.

## Hipóteses não testadas por trás do value-prop

1. O dono precisa já suspeitar da perda — "ninguém paga para 'talvez descobrir' algo em que não acredita."
2. R$10 mil (usado como gancho ilustrativo) não é calibrado a nenhum porte de negócio real.
3. Mesmo com a informação, o dono pode não agir — relação com fornecedor (prazo, confiança, garantia de entrega) costuma pesar mais que preço unitário.

Decisão explícita: sem validação formal planejada agora (Gabriel não tem relação próxima o suficiente com donos de negócio para perguntar diretamente). Tratado como "radar" informal — pergunta casual num momento social, não bloqueia o roadmap.

## Decisão de provedor de e-mail: Brevo vs Resend

- **Resend**: 3.000 e-mails/mês grátis, limite de 100/dia, sem cartão — mas, sem domínio próprio verificado, o modo sandbox só envia para o e-mail do próprio dono da conta. Desqualificante para este caso.
- **Brevo**: 300 e-mails/dia grátis para sempre, sem cartão. Permite verificar um remetente individual (um único e-mail, via código de confirmação) sem exigir domínio — suficiente para enviar a destinatários reais desde já. SMTP tradicional, compatível com `nodemailer`.
- **Decisão: Brevo**, unicamente porque o projeto ainda não tem domínio próprio e Resend exigiria comprar/configurar um antes de enviar a qualquer pessoa fora da conta do Gabriel. Revisitar se/quando o projeto tiver domínio próprio.

## Gap de dados de teste (não bloqueia esta iniciativa)

Duas necessidades distintas de "dado de teste" que não devem ser confundidas:
- (a) Confiança na lógica de comparação — resolvível sinteticamente, engenharia pura, fora de escopo aqui.
- (b) Dado real para validação social/de valor — só necessário se a conversa informal de validação (seção acima) de fato acontecer.

Nenhuma das duas bloqueia a iteração do relatório mensal. Caminho recomendado (fora de escopo desta iniciativa): melhorar o gerador de dados sintéticos (mais diversidade de fornecedor/unidade/tendência) e/ou expandir a suíte de testes unitários existente em `insights/services/*.spec.ts`.
