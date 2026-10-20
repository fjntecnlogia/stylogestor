# Rellav Agro — plano para superar a TBDC

> Base: análise pública da TBDC (`docs/CONCORRENTE_TBDC.md`) + leitura do repositório `rellav-platform` (README, `schema.prisma`, módulos da API, rotas web/mobile, docs de produto).
> **Limite da leitura:** olhei estrutura, schema e documentação. **Não rodei o app nem auditei o código**; "existe" abaixo significa "há módulo/modelo no repositório", não "está pronto para produção". Itens com ⚠️ precisam de confirmação.

---

## 1. Tese

A TBDC, agora da TOTVS, investe pesado no **Agro CRM** (produto principal) e é fraca em: preço público, trial, SEO, exportação de dados, SLA e suporte.

O **Rellav já é 70% do esqueleto de um Agro CRM**: força de vendas B2B, offline-first, check-in geolocalizado, metas, comissão, políticas comerciais, carteira de clientes, lotes, IA e integração nativa com Sankhya. Falta a **camada de domínio agro** (propriedade, talhão, safra, ensaio, recomendação agronômica, satélite, clima).

> Estratégia: **Rellav Agro = Rellav + módulos agro**, não um produto novo do zero. Vende para o mesmo público do Agro CRM da TBDC (revendas, distribuidoras, fabricantes, sementeiras, cooperativas), onde a TOTVS quer crescer.

---

## 2. Cobertura: TBDC Agro CRM × Rellav hoje

| Módulo TBDC Agro CRM | Rellav hoje (no repositório) | Situação |
|---|---|---|
| Visita técnica (registro no celular, relatório) | `Visit` com check-in/out e lat/lng, `Task`, agenda, mapa ao vivo (`SellerLocation`, `SellerLocationPing`) | 🟡 base pronta; falta formulário técnico e relatório |
| Segmentação da carteira | `Customer`, módulo `carteira`, `user-groups`, `recommendations`, `predictions` | 🟡 base pronta; falta segmentar por cultura/área |
| Vendas: meta, pedido no app, estoque, entrega | `orders`, `goals`, `commissions`, `policies`, `pricing`, `cargas`, `carriers`, `tracking`, offline `sync` | ✅ forte; é o núcleo do Rellav |
| Pedido offline (Força de Vendas TBDC) | App mobile offline-first + fila `SyncQueue` + Outbox | ✅ |
| ERP | Sankhya nativo (`erp-sync`, `@rellav/erp-sdk`) | ✅ diferencial |
| Comunicação com o produtor | `notifications`, `push`, orçamento por WhatsApp (planejado) | 🟡 falta relatório compartilhável |
| Geração de demanda (demonstrações, eventos, ensaios) | — | ❌ não existe |
| Inteligência / BI | `analytics`, `indicadores`, `relatorios`, `ai-gateway`, `predictions` (recompra, churn) | 🟡 ⚠️ confirmar quanto da IA está implementado vs só modelado |
| Portal/loja do cliente | `apps/storefront` | 🟡 |
| Licenciamento, billing, admin SaaS | `licenses`, `billing`, `apps/admin` | ✅ |

Grep por `talhão`, `safra`, `hectare`, `agronômico`, `lavoura` no repositório inteiro: **zero resultados**. Hoje o Rellav não tem nenhum conceito agro.

---

## 3. O que falta construir (módulos agro)

Ordem sugerida por valor × esforço.

### Fase 1 — Fundação agro + visita técnica (MVP)
1. **Propriedade → Talhão → Safra/Cultura**: novo modelo ligado a `Customer` (produtor). Campos: nome da fazenda, geometria (polígono/KML), área (ha), cultura, variedade, data de plantio. Ver ⚠️ importar KML/Shapefile.
2. **Visita técnica agronômica**: estende `Visit` com formulário configurável (estádio da cultura, pragas, stand, observações), **fotos/áudio offline**, talhão visitado. Reaproveita check-in geolocalizado.
3. **Relatório digital compartilhável**: página pública (link) com fotos, mapa, recomendações e previsão do tempo, enviada por WhatsApp. É o recurso mais "vendável" da TBDC Consultoria e é barato de fazer.
4. **Segmentação por cultura/área/safra** na carteira (filtros e listas).

### Fase 2 — Recomendação + geração de demanda
5. **Recomendação agronômica**: produtos, dose, calda por tanque, e **ordem de aplicação enviada por WhatsApp** que já vira **pedido** (aqui o Rellav ganha: fecha o ciclo recomendação → venda → ERP, a TBDC separa as pontas).
6. **Ensaios e demonstrações** (lado a lado): local, protocolo, tratamentos, resultado, ROI; ligar a histórico de compra.
7. **Eventos e dias de campo**: lista de convidados, presença, conversão em venda.
8. **Lotes de sementes**: `ProductLot` já existe; ligar lote → talhão → rastreabilidade.

### Fase 3 — Dados externos + IA
9. **Imagens de satélite por talhão** (NDVI/NDMI): integrar provedor (ex.: Sentinel-2 aberto ou serviço comercial; ⚠️ escolher e orçar).
10. **Clima**: previsão e histórico de chuva por coordenada (⚠️ escolher provedor).
11. **Pragas e armadilhas** georreferenciadas (MIP).
12. **IA agro**: "quais produtores estão prontos para comprar fungicida?", "quem vai perder a janela de plantio?", auditor de visitas (detectar visita fake pelo GPS), resumo automático de visita por áudio. Reaproveita `ai-gateway`, `predictions`, `recommendations`.

### Fora do escopo inicial (TBDC tem)
- Caderno de campo completo, custo por hectare, rastreabilidade do algodão, estoque de fazenda: é o **TBDC Produtor** (lado do produtor rural). Só entrar se o foco for vender também para o produtor. Começar pelo lado de quem vende insumo (CRM) dá receita mais rápido.

---

## 4. Onde ser melhor que a TBDC (vira argumento de venda)

| TBDC | Rellav Agro |
|---|---|
| Sem preço público | **Preço público** na página |
| Sem trial real | **Trial 14 dias** sem cartão (já existe trial no licenciamento do Stylogestor; ⚠️ confirmar no Rellav) |
| Multa de 20% + renovação indeterminada | **Sem multa**, cancela quando quiser |
| Exporta só CSV, sem mídia | **Exporta tudo**, inclusive fotos e relatórios |
| SLA 48h úteis, sem uptime, suporte comercial | **SLA publicado**, suporte por WhatsApp |
| Usuário extra cobrado sem aviso | **Aviso antes** de qualquer cobrança extra |
| ERP: foco no ecossistema TOTVS | **Sankhya nativo** e neutro. ⚠️ Hipótese: revendas que usam Sankhya/outros ERPs vão preferir quem não é da TOTVS. Validar em conversa com 5 clientes. |
| IA em piloto só em 2027 | **IA já modelada** no Rellav (copiloto, pedido por foto/áudio, previsão de recompra/churn) |
| Site sem conteúdo | **SEO por cultura, região e recurso** |
| Indicação por brindes | **Indicação com desconto em mensalidade** |

---

## 5. Mercado alvo e posicionamento

- **Primário:** revendas e distribuidoras de insumos (Sankhya) com 5–50 vendedores/técnicos; sementeiras; cooperativas pequenas.
- **Secundário:** consultorias agronômicas (relatório digital + recomendação).
- **Não começar por:** grandes multinacionais (Bayer, Corteva): ciclo longo e a TBDC já está lá.
- **Praça piloto sugerida:** MT (Nova Mutum, Sorriso, Lucas do Rio Verde, Sinop, Primavera do Leste). É onde a TBDC nasceu, então vale ir onde há clientes insatisfeitos com a transição para a TOTVS (a página de FAQ de transição deles sugere dúvidas de contrato e faturamento).

---

## 6. Texto pronto (copiar e colar)

**Título da landing**
> O CRM do agro que vende, visita e fecha pedido, até sem internet.

**Subtítulo**
> Seus técnicos registram a visita no campo, mandam a recomendação pelo WhatsApp e o pedido já cai no seu Sankhya. Preço na tela, teste grátis por 14 dias, sem multa para cancelar.

**Bullets**
- Visita técnica com fotos, GPS e relatório pronto para o produtor.
- Recomendação agronômica que vira pedido em um toque.
- Ensaios e demonstrações com resultado e ROI por produtor.
- Funciona offline, sincroniza com o Sankhya quando volta o sinal.
- Sua equipe no mapa, metas e comissão por margem.
- Seus dados são seus: exporte tudo, quando quiser.

**CTA**
> Testar grátis por 14 dias · Falar no WhatsApp

**Título SEO (≤ 60 caracteres)**
> CRM para Revenda de Insumos Agrícolas | Rellav Agro

**Meta description (≤ 155 caracteres)**
> CRM e força de vendas para o agro: visita técnica, recomendação por WhatsApp, pedido offline e integração com Sankhya. Teste grátis por 14 dias.

**Ideias de páginas SEO** (uma por cidade/cultura): "CRM para revenda de insumos em Sorriso", "software para consultoria agronômica", "app de visita técnica agronômica", "força de vendas offline para distribuidora agrícola", "alternativa à TBDC".

---

## 7. Riscos e pontos de atenção

- **Conhecimento de domínio:** receituário agronômico, ART e regras de cada cultura exigem um agrônomo na equipe (ou parceiro). Sem isso, a Fase 2 vira chute.
- **Dados de satélite e clima** têm custo recorrente por hectare; precificar antes de prometer.
- **Mapas e polígonos** em app offline são caros em armazenamento e bateria; planejar tiles em cache por região.
- **Concorrência não é só TBDC**: ⚠️ antes de fechar o escopo, mapear Agrosmart, Aegro, Solinftec, Climate FieldView e CRMs genéricos (Mercos, Salesforce). Posso fazer esse levantamento.
- **LGPD e localização**: o Rellav já apaga rastro de GPS após 30 dias; manter isso e deixar visível para o técnico.

---

## 8. Perguntas em aberto para o Fundador

1. O **"força de venda"** que você citou é o próprio Rellav ou é outro projeto? (No GitHub da FJN há também `agrimat-web/api`, `kargil_agro`, `hectareIA`, `bolsamt`; não abri nenhum.)
2. O foco é **quem vende insumo** (CRM/revenda) ou também o **produtor rural**?
3. Existe **cliente-piloto agro** (revenda ou consultoria) e qual ERP ele usa?
4. Há **agrônomo** na equipe ou parceiro para validar recomendação e receituário?
5. O nome do produto será **Rellav Agro** ou marca nova?
