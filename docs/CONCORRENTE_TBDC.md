# Análise de concorrente — TBDC (tbdc.com.br)

> Levantamento feito em 2026-10-20 apenas com informação **pública** (site, páginas de captação, termos de uso, lojas de app, imprensa). Nada atrás de login foi acessado. Itens marcados com ⚠️ são inferência ou divergem entre fontes.

---

## 1. Resumo executivo

- **TBDC não é concorrente do Stylogestor.** É um software de **agronegócio** (campo, lavoura, consultoria agronômica, CRM para insumos), sediado em Nova Mutum/MT. O Stylogestor é SaaS de **barbearia/salão**. Os mercados não se cruzam.
- A TBDC foi fundada em 2018, cresceu rápido (R$ 15 mi em 2023 → R$ 24,5 mi em 2024) e foi **comprada pela TOTVS por ~R$ 80 mi** (fim de 2025, valor segundo imprensa; não confirmado pela TOTVS). O site hoje se chama "TBDC by TOTVS".
- O site público é um **one-page de captação de leads** (Framer). Todo o produto está atrás de `login.tbdc.com.br`. Não há preços públicos: venda 100% consultiva.
- O que vale copiar não é o produto agro, e sim o **modelo**: 3 produtos por persona, offline-first, relatório como página compartilhável, WhatsApp como canal de ordem/ação, programa de indicação com pontos, IA para interpretar dados.

---

## 2. Empresa

| Item | Dado | Fonte |
|---|---|---|
| Razão social | TBDC Desenvolvimento de Software Ltda | CNPJ 28.845.223/0001-79 |
| Fundação | 2018, Nova Mutum/MT | Exame |
| Fundador | Paulo Castro (ex-gerente de TI de fazenda) | Exame |
| Origem do nome | "Tire a Bunda Da Cadeira" (cultura de ação) | Exame |
| Receita | R$ 15 mi (2023, +117%), R$ 24,5 mi (2024) | Exame |
| Clientes | 450–500+ empresas (Bayer, Corteva, FMC, Sicredi, UPL, Sakata, SLC) | Exame / AgFeed |
| Usuários | ~12 mil diários, ~15 mil produtores | Exame |
| Países | ⚠️ 6, 7 ou 10 conforme a fonte (BR, MX, CL, UY, PY, BO, AR, África) | divergem |
| Idiomas | PT, EN, ES | AgFeed |
| Aquisição | TOTVS, ~R$ 80 mi, fim de 2025 | AgFeed / CB Insights |
| Plano pós-compra | Agentes de IA (auditor de campo, fechamento de custos) em 2027; venda cruzada via franquias TOTVS | AgFeed |
| Contato | WhatsApp comercial 65 99623-2985; suporte 65 99990-0123 (⚠️ outra página mostra outro número) | site |

---

## 3. Portfólio de produtos

### 3.1 TBDC Consultoria — para consultorias agronômicas
Posicionamento: "Economize seu principal insumo: o tempo".

1. **Relatórios digitais**: relatório vira página interativa para o cliente (satélite, mapas, vídeo, áudio, previsão do tempo).
2. **Dados agronômicos**: mapeamento de talhões, ciclo de manejo, variedades, plantio/emergência/colheita prevista, stand, germinação, produtividade.
3. **Recomendações**: montagem profissional, instruções de calda por tanque, **envio da ordem de aplicação por WhatsApp**.
4. **Imagens espacializadas**: satélite automático por talhão, NDVI e NDMI.
5. **Histórico**: feed estilo rede social das áreas; acompanhamento de cada profissional da equipe.
6. Georreferenciamento, registro de visitas, relatório de quais clientes/áreas foram atendidos (AgFeed).

### 3.2 TBDC Agro CRM — para distribuidores, fabricantes, sementeiras, cooperativas (produto principal)
1. **Visita técnica**: registro no celular e relatório em tempo real.
2. **Segmentação**: priorização da carteira.
3. **Vendas**: metas, pedido no app, estoque, rastreio de entrega.
4. **Comunicação**: envio de relatórios e avisos ao produtor.
5. **Geração de demanda**: demonstrações, eventos, ensaios lado a lado (local, protocolo, resultado, ROI), ligação com histórico de compra.
6. **Inteligência (BI)**: quem compra o quê, quando e por quê.
7. **Força de Vendas** (módulo novo): offline, catálogo, estoque, preço, forma de pagamento, entrega.

### 3.3 TBDC Produtor — para produtor rural (app `br.com.tbdc.produtor.v2`)
1. **Clima e planejamento**: dados climáticos, mapas de chuva e satélite, planejamento de pulverização/colheita.
2. **Pragas e doenças**: monitoramento, armadilhas georreferenciadas, recomendação (MIP).
3. **Estoque**: entradas/saídas em tempo real, rastreabilidade, offline.
4. **Mapa de fazendas**: propriedades e talhões.
5. **Caderno de campo**: plantio à colheita, áreas, perdas.
6. **Custos de aplicação**: custo por talhão e por hectare automático.
7. **Rastreabilidade do algodão**: talhão → colheita → fardo → transporte → destino.
8. Ordens de serviço.

### 3.4 Outros
- **Seu Irai**: IA para interpretar dados agrícolas.
- **TBDC Academy** e **Força de Vendas**: em desenvolvimento (segundo Exame).

---

## 4. Engenharia reversa do site

### Stack (visível no HTML)
| Camada | Tecnologia |
|---|---|
| Site institucional | **Framer** (React + Motion), hospedado em framerusercontent.com |
| Analytics | **Google Tag Manager** (GTM-THCMKZ88) |
| Indicação/afiliados | **Buzzlead** (`static.buzzlead.com.br/tracker.js`) |
| Chat/suporte | **Movidesk** (widget de chat) |
| Leads | páginas em `materiais.tbdc.com.br` com UTMs (`site / org / captacao_<produto>`); ⚠️ provável plataforma de landing/RD-like |
| App web | `login.tbdc.com.br` (SPA, conteúdo não acessível sem login) |
| Apps móveis | Android: `br.com.tbdc.consultoria`, `br.com.tbdc.produtor.v2` |
| SEO | sitemap com 9 URLs, `robots: Allow /`, title/description genéricos, **sem blog** |

### Mapa de URLs
```
/                         home (hero + 3 produtos + depoimentos + rodapé)
/faq-totvs                FAQ da transição para TOTVS (só perguntas, sem respostas públicas)
/indiqueeganhe            programa de indicação
/indicado                 landing do indicado
/politica-de-privacidade  /politica-de-cookies
/termos-de-uso (pt/en/es)
materiais.tbdc.com.br/{agrocrm,consultoria-agronomica,produtor}   captação
login.tbdc.com.br/login   produto
```

### Funil de aquisição
`Site / Instagram / indicação → landing do produto → formulário → WhatsApp/consultor → demo → contrato + implantação`

Formulário de lead (padrão): nome, telefone, e-mail, empresa, cargo, **segmento** (9 opções), cultura, **hectares**, UF, cidade, anti-spam "1+1", consentimento. Ou seja, qualifica o lead por porte antes do contato.

### Programa de indicação (Buzzlead)
- Indicador ganha **100 pontos** por indicado que contrata; troca por prêmios (ex.: R$ 200 + boné + camiseta; R$ 100 + cooler Stanley).
- Indicado ganha **desconto na implantação**.
- Parte da receita vai para um **Fundo Social**.

---

## 5. Modelo comercial (dos Termos de Uso)

| Tema | Regra |
|---|---|
| Cobrança | Mensalidade **por usuário**, adiantada + **taxa de implantação** |
| Usuário extra | Cobrado na fatura **sem aviso prévio** |
| Reajuste | Anual por IPCA |
| Atraso | Multa 5%, juros 1% a.m., correção INPC |
| Cancelamento | Aviso de 30 dias + **multa de 20%** do restante; renovação por prazo indeterminado |
| SLA | Correção de erro em até 48h úteis; **sem % de uptime** |
| Suporte | Seg–sex, 8–12h e 14–18h |
| Backup | 7 dias; restauração pós-exclusão é cobrada |
| Exportação | Somente **CSV, sem mídias** |
| Dados | Do contratante; ⚠️ consultores com acesso "podem ter propriedade compartilhada" |
| Pós-contrato | 30 dias para pedir backup; TBDC guarda 3 anos |
| Hospedagem | Terceirizada, fornecedor não nomeado |

---

## 6. Pontos fortes e fracos (leitura crítica)

**Fortes**
- Foco vertical profundo (soja, algodão) e 3 personas bem separadas.
- Offline-first para zona rural sem sinal.
- Relatório como página compartilhável aumenta percepção de valor do cliente do cliente.
- Marcas grandes como prova social; agora distribuição TOTVS.
- Indicação gamificada.

**Fracos / brechas**
- **Sem preço público** e sem trial real, apesar de falar em "Experimente".
- Site com **zero conteúdo SEO** (sem blog, sem páginas por cultura/região/recurso).
- Termos pesados: multa de 20%, exportação só CSV sem mídia, SLA sem uptime, usuário extra cobrado sem aviso.
- Suporte só em horário comercial.
- Dados de contato inconsistentes entre páginas.
- FAQ da transição TOTVS sem respostas visíveis (incerteza para o cliente).
- IA ainda em piloto (2027).

---

## 7. O que levar para o Stylogestor (aplicável a barbearia/salão)

| Ideia da TBDC | Versão Stylogestor | Esforço |
|---|---|---|
| Relatório como página compartilhável | Link público do "extrato do cliente" / resumo do mês do barbeiro para WhatsApp | baixo |
| Ordem de serviço por WhatsApp | Confirmação, lembrete e remarcação de agendamento por WhatsApp | médio |
| Offline-first | App do gestor/profissional funcionando sem internet e sincronizando | alto |
| Segmentação de carteira (CRM) | Clientes inativos, aniversariantes, VIPs, risco de churn com campanha 1-clique | médio |
| BI "quem compra o quê, quando, por quê" | Dashboard: ticket médio, retorno, serviço mais rentável, horário ocioso | médio |
| Programa de indicação com pontos | "Indique uma barbearia e ganhe 1 mês" (indicação B2B) + indicação de cliente final (já há fidelidade) | baixo |
| Lead qualificado por porte | Formulário no site com nº de profissionais e faturamento | baixo |
| IA que interpreta dados (Seu Irai) | Assistente: "por que meu faturamento caiu?", sugestão de preço/horário | médio |
| Auditor de campo (IA) | Detector de anomalias: comissão errada, caixa que não fecha | médio |

**Onde dá para ganhar da TBDC (valem para qualquer SaaS vertical):** preço público, trial de 7–14 dias sem cartão, exportação completa (inclui mídia), SLA com uptime publicado, suporte em horário estendido/WhatsApp, cancelamento sem multa, conteúdo SEO por cidade e por recurso.

---

## 8. Decisão pendente

O pedido foi "montar um sistema melhor que os deles". Há dois caminhos muito diferentes:

- **A) Levar as boas ideias para o Stylogestor** (barbearia/salão): rápido, aproveita o código existente (`apps/web`, `apps/mobile-gestor`, `packages/api`), foco em atrair clientes para a FJN.
- **B) Construir um produto de agro concorrente da TBDC**: mercado novo, exige conhecimento agronômico, parceiros de campo, dados de satélite/clima; é meses de trabalho e concorre com a TOTVS.

Recomendação: **A** primeiro. Se houver interesse em agro, fazer **B** como projeto de software sob encomenda da FJN (cliente final do agro), não como produto próprio.

---

## Fontes
- https://www.tbdc.com.br/ , /faq-totvs , /indiqueeganhe , /termos-de-uso , /sitemap.xml
- https://materiais.tbdc.com.br/produtor , /agrocrm , /consultoria-agronomica
- https://temp-root.tbdc.com.br/
- https://agfeed.com.br/agtech/apos-comprar-tbdc-totvs-prepara-safra-de-agentes-de-ia-para-ampliar-presenca-no-agro/
- https://exame.com/negocios/demitido-ele-criou-sozinho-um-negocio-de-r-15-milhoes-no-agro/
- https://www.cbinsights.com/company/tbdc-agro-softwares
- Google Play: `br.com.tbdc.consultoria`, `br.com.tbdc.produtor.v2` (páginas não carregaram na íntegra)
