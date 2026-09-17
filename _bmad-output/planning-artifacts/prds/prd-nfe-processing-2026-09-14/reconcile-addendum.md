# Reconciliation: brief's addendum.md vs prd.md + prd's addendum.md

Comparação linha a linha entre `_bmad-output/planning-artifacts/briefs/brief-nfe-processing-2026-09-10/addendum.md` (fonte original) e os dois documentos derivados: `prd.md` e o `addendum.md` da própria PRD, ambos em `_bmad-output/planning-artifacts/prds/prd-nfe-processing-2026-09-14/`.

## Gaps found

### 1. A pergunta-modelo do "radar" informal ("você já descobriu que estava pagando mais caro do que podia?")

O addendum original não só decide tratar a validação da hipótese de valor como "radar ligado" — ele já deixa pronta a frase concreta a usar na próxima oportunidade social: *"você já descobriu que estava pagando mais caro do que podia?"*. Essa frase não aparece em nenhum lugar do PRD nem do addendum da PRD; ambos mencionam apenas o conceito ("tratado como radar informal, pergunta casual") sem a pergunta em si.

Por que importa: é conteúdo acionável de verdade (o roteiro exato pra próxima conversa informal), não só rationale — perder isso significa que, quando a oportunidade social surgir, será preciso reconstruir a frase do zero em vez de já ter uma pronta.

### 2. O caminho concreto para obter dado real de validação (pedir XMLs antigos ao contador)

O addendum original é específico sobre como obter dado real, se/quando a validação informal acontecer: *"pedir XMLs antigos de NFe a alguém que já os tem guardado (obrigação legal de 5 anos, muitas vezes com o contador) — pedido concreto e mais leve que 'testar o sistema'"*. O addendum da PRD reduz a menção de dado real a "só necessário se a conversa informal de validação... de fato acontecer", sem dizer *como* obtê-lo. O caminho específico (contador, obrigação legal de 5 anos, framing de "pedido leve") desaparece por completo — não está nem no PRD nem no addendum da PRD.

Por que importa: é a parte mais praticamente útil dessa seção do addendum original — não é só "isso não bloqueia", é "e quando bloquear, aqui está o próximo passo mais barato". Sem isso, o encaminhamento fica incompleto.

### 3. O ponto de preço "R$100" do gancho de valor original

A frase-gancho completa no addendum original é *"quem não pagaria R$100 para descobrir que está perdendo R$10 mil"* — duas âncoras numéricas: o preço hipotético (R$100) e a perda hipotética (R$10 mil). O addendum da PRD preserva as três suposições sobre o R$10 mil, mas nunca menciona o R$100. Busquei "R$100" em todo o PRD e no addendum da PRD — não aparece em nenhum dos dois.

Por que importa: é um dado específico que provavelmente será relevante de novo quando a discussão de precificação chegar (nem que seja pra descartá-lo formalmente) — hoje ele só sobrevive no brief original, fora do caminho de leitura normal de quem for trabalhar a partir do PRD.

### 4. A fonte reclameaqui.com.br (queixas de complexidade do Bling) como evidência brasileira fraca da tese "ERP grande é pesado demais"

O addendum original lista `reclameaqui.com.br/bling (queixas genéricas de complexidade)` nas fontes, ligada à tese de que ERP grande é pesado demais. O addendum da PRD comprime a lista de fontes para "blog e páginas institucionais da Qive/Arquivei, Bling, Omie, Balize/Construmarket, Spendflo" e resume a tese como apoiada "só" por uma analogia internacional (Procurify/Precoro/Tradogram vs. Coupa/SAP Ariba) — sem qualquer evidência brasileira. Isso é sutilmente menos preciso que o original: o original já reconhecia que a evidência do Reclame Aqui não é "direta e específica", mas ainda a registrava como um dado brasileiro fraco existente. A fonte `infovarejo.com.br/confronto-entre-pedido-de-compra-e-nfe` também some da lista sem deixar rastro em nenhum dos dois documentos.

Por que importa: severidade baixa (o próprio original já descontava essa evidência como fraca), mas afeta a rastreabilidade — se alguém quiser re-checar "de onde veio essa tese" a partir só dos documentos derivados, não vai encontrar essas duas fontes.

## Correctly relocated (sanity check, brief)

- As três suposições não testadas do value-prop (desconfiança prévia, R$10 mil não calibrado, relação com fornecedor pesando mais que preço) estão presentes quase palavra por palavra no addendum da PRD, incluindo a decisão de não validar formalmente agora.
- A conclusão "lacuna parcial, não total" da pesquisa de mercado está preservada e até reforçada no addendum da PRD (acrescenta "evidência fraca-a-moderada... não para reivindicar oceano azul validado"), e referenciada corretamente em `prd.md` §8, item 2.
- O rationale Brevo vs. Resend (limites, sandbox do Resend, verificação de remetente individual do Brevo, decisão motivada pela falta de domínio próprio) está relocado quase integralmente — só perde a explicação lateral "(por design anti-abuso)" do comportamento sandbox do Resend, considerada abaixo do limiar de gap.
- A distinção entre "confiança na lógica" (sintético, engenharia pura) e "dado real para validação social" (só necessário se a validação informal ocorrer) está corretamente relocada como estrutura — só falta o "como" do segundo ponto (ver Gap 2).
