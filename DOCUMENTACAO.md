# STYLOGESTOR — Documentação de Rotinas

> Guia completo para **clientes das barbearias** e **gestores** que utilizam o STYLOGESTOR.

---

## Sumário

1. [Para o Cliente da Barbearia](#1-para-o-cliente-da-barbearia)
2. [Para o Gestor da Barbearia](#2-para-o-gestor-da-barbearia)
   - [Acesso e Primeiro Login](#21-acesso-e-primeiro-login)
   - [Dashboard](#22-dashboard)
   - [Agenda](#23-agenda)
   - [Clientes](#24-clientes)
   - [Financeiro](#25-financeiro)
   - [Profissionais](#26-profissionais)
   - [Serviços](#27-serviços)
   - [Estoque](#28-estoque)
   - [Fidelidade](#29-fidelidade)
   - [Suporte](#210-suporte)
   - [Configurações e Planos](#211-configurações-e-planos)

---

## 1. Para o Cliente da Barbearia

O cliente **não precisa criar conta** no STYLOGESTOR. O agendamento é feito de forma rápida e direta pelo link da barbearia.

### Como agendar pelo link público

Acesse o link da sua barbearia (ex: `demo.stylogestor.com.br`) no celular ou computador.

---

#### Passo 1 — Escolha os serviços

- Você verá a lista de serviços disponíveis com **nome**, **duração** e **preço**.
- Selecione um ou mais serviços (ex: Corte + Barba).
- O resumo com **total e duração** aparece automaticamente na parte inferior.
- Clique em **Próximo →** para continuar.

```
Exemplo:
  ✓ Corte masculino   30 min   R$ 40
  ✓ Barba             30 min   R$ 30
  ─────────────────────────────────────
  Total: R$ 70 · 60 minutos
```

---

#### Passo 2 — Escolha o profissional

- Selecione o profissional de sua preferência.
- Se não tiver preferência, escolha **"Sem preferência"** para que o sistema atribua automaticamente.
- Clique em **Próximo →**.

---

#### Passo 3 — Escolha a data e o horário

- Os **dias disponíveis** aparecem em sequência (os próximos 7 dias).
- Selecione o dia desejado.
- Os **horários livres** aparecem abaixo — escolha o que melhor se encaixa na sua rotina.
- Clique em **Próximo →**.

---

#### Passo 4 — Seus dados

- Informe seu **nome completo** e **número de WhatsApp**.
- Marque a opção de receber **lembretes pelo WhatsApp** (recomendado).
- Clique em **Revisar →**.

---

#### Passo 5 — Confirmação

- Revise todas as informações do agendamento:
  - Nome, WhatsApp, serviços escolhidos, profissional, data, horário, duração e valor total.
- Se tudo estiver correto, clique em **✓ Confirmar agendamento**.

---

#### Passo 6 — Agendamento confirmado!

- Você verá a tela de **sucesso** com o resumo do agendamento.
- Uma **confirmação será enviada pelo WhatsApp**.
- Caso precise cancelar, entre em contato com a barbearia pelo WhatsApp.

---

### Dúvidas frequentes do cliente

| Dúvida | Resposta |
|---|---|
| Preciso criar uma conta? | Não. Apenas nome e WhatsApp. |
| Posso agendar pelo celular? | Sim, o site é 100% responsivo. |
| Como cancelo? | Entre em contato com a barbearia pelo WhatsApp. |
| Recebo lembrete? | Sim, pelo WhatsApp se marcar a opção. |
| Posso escolher mais de um serviço? | Sim, na etapa 1. |

---

---

## 2. Para o Gestor da Barbearia

O gestor acessa o painel completo em **`app.stylogestor.com.br`** com login e senha.

---

### 2.1 Acesso e Primeiro Login

1. Acesse **`app.stylogestor.com.br`**
2. Clique em **Entrar** e use seu e-mail e senha cadastrados.
3. No primeiro acesso, você será direcionado ao **onboarding** para configurar:
   - Nome da barbearia
   - Endereço
   - Horário de funcionamento
   - Profissionais iniciais
4. Após o onboarding, o painel estará pronto para uso.

---

### 2.2 Dashboard

**Acesso:** Menu lateral → 📊 Dashboard

O Dashboard é a **visão geral do dia**, atualizado em tempo real.

#### O que você vê no Dashboard:

| Card | O que mostra |
|---|---|
| Agendamentos hoje | Total de agendamentos do dia |
| Faturamento do dia | Soma dos atendimentos concluídos |
| Novos clientes | Clientes novos no mês atual |
| Ticket médio | Valor médio por atendimento |

#### Agendamentos de hoje
- Lista dos próximos atendimentos com **cliente, serviço, horário e profissional**.
- Você pode clicar em qualquer agendamento para ver detalhes ou alterar o status.

#### Fluxo de caixa
- Gráfico mostrando **entradas e saídas** dos últimos 7 dias.

---

### 2.3 Agenda

**Acesso:** Menu lateral → 📅 Agenda

A Agenda é o **coração da operação diária**. Aqui você gerencia todos os atendimentos.

#### Visualizações disponíveis

| Modo | Descrição |
|---|---|
| Por Profissional | Colunas por barbeiro/profissional (recomendado) |
| Dia | Linha do tempo do dia atual |
| Semana | Visão semanal compacta |

#### Criar um agendamento manualmente

1. Clique no botão **+ Novo agendamento** (canto superior direito) ou clique direto em um horário vazio na grade.
2. Preencha:
   - **Cliente** (nome e telefone)
   - **Serviço** (ex: Corte, Barba, Corte + Barba)
   - **Profissional**
   - **Data e hora**
   - **Observações** (opcional)
3. Clique em **Salvar agendamento**.

#### Status dos agendamentos

| Status | Cor | Significado |
|---|---|---|
| Agendado | Amarelo | Marcado, aguardando atendimento |
| Confirmado | Azul | Cliente confirmou presença |
| Em atendimento | Laranja | Atendimento em andamento |
| Concluído | Verde | Finalizado e pago |
| Cancelado | Cinza | Cancelado pelo cliente ou gestor |
| Faltou | Vermelho claro | Cliente não compareceu |

#### Detalhes e ações sobre um agendamento

Clique em qualquer agendamento para abrir o painel de detalhes:
- Ver informações completas
- Alterar status (ex: marcar como **Concluído**)
- Registrar forma de pagamento (PIX, Dinheiro, Cartão)
- Aplicar desconto
- Adicionar observação

#### Fechamento do dia

No final do dia, clique em **Fechar dia** para:
- Ver o resumo financeiro do dia (total bruto, descontos, total líquido)
- Confirmar todos os atendimentos pendentes
- Registrar o fechamento no histórico financeiro

---

### 2.4 Clientes

**Acesso:** Menu lateral → 👥 Clientes

Gerencie o relacionamento com seus clientes (CRM).

#### Lista de clientes

- Busque por **nome ou telefone** no campo de busca.
- A tabela mostra: nome, número de visitas, gasto total e última visita.
- Clientes **VIP** e **mensalistas** têm etiquetas coloridas.

#### Cadastrar novo cliente

1. Clique em **+ Novo cliente**.
2. Preencha:
   - Nome completo (obrigatório)
   - WhatsApp (obrigatório)
   - E-mail (opcional)
   - Observações: preferências, alergias, etc. (opcional)
3. Clique em **✓ Cadastrar cliente**.

#### Detalhes do cliente

Clique em qualquer cliente na lista para ver:
- Total de visitas e gasto histórico
- Última visita
- Tags (VIP, mensal)
- Botão de **agendar** diretamente para o cliente
- Botão de **editar** informações

---

### 2.5 Financeiro

**Acesso:** Menu lateral → 💰 Financeiro

Controle completo das entradas e saídas da barbearia.

#### O que você encontra:

- **Resumo do mês**: Receita total, despesas e lucro líquido
- **Histórico de transações**: Lista de todos os lançamentos com data, descrição, tipo e valor
- **Filtros**: Por período, tipo (entrada/saída) e categoria

#### Categorias de entrada

- Atendimentos (corte, barba, etc.)
- Produtos vendidos
- Mensalidades de clientes

#### Categorias de saída

- Produtos e insumos
- Salários e comissões
- Aluguel e contas fixas
- Outros

#### Lançar uma transação manualmente

1. Clique em **+ Nova transação**
2. Selecione o tipo: **Entrada** ou **Saída**
3. Informe categoria, descrição, valor e data
4. Clique em **Salvar**

> **Dica:** Os atendimentos marcados como "Concluído" na Agenda são lançados automaticamente como entradas no financeiro.

---

### 2.6 Profissionais

**Acesso:** Menu lateral → ✂️ Profissionais

Gerencie sua equipe.

#### O que você pode fazer:

- **Cadastrar** novos barbeiros e profissionais
- Definir **serviços** que cada um realiza
- Ver **estatísticas** por profissional (atendimentos, faturamento)
- Definir **comissão** por serviço ou percentual fixo
- Ativar/desativar profissional (ex: em férias)

---

### 2.7 Serviços

**Acesso:** Menu lateral → 📋 Serviços

Gerencie o cardápio de serviços da barbearia.

#### Para cada serviço, você define:

| Campo | Exemplo |
|---|---|
| Nome | Corte masculino |
| Duração | 30 minutos |
| Preço | R$ 40,00 |
| Comissão | 40% ou R$ 15 fixo |
| Visível no agendamento online | Sim / Não |

> **Dica:** Desative serviços temporários ou sazonais sem precisar excluir.

---

### 2.8 Estoque

**Acesso:** Menu lateral → 📦 Estoque

Controle os produtos usados e vendidos na barbearia.

#### Funcionalidades:

- Cadastrar produtos com quantidade atual e mínima
- Receber **alertas** quando o estoque estiver baixo
- Registrar entrada de produtos (compras do fornecedor)
- Registrar saída de produtos (uso interno ou venda)
- Ver histórico de movimentações

---

### 2.9 Fidelidade

**Acesso:** Menu lateral → ⭐ Fidelidade

Programa de pontos para fidelizar seus clientes.

#### Como funciona:

- Cada R$ 1,00 em atendimentos equivale a **X pontos** (configurável)
- O cliente acumula pontos a cada visita
- Com pontos suficientes, pode resgatar **descontos ou brindes**

#### Para o gestor:

- Veja o **ranking de clientes** por pontos acumulados
- Consulte o histórico de pontos de cada cliente
- Configure as recompensas (ex: 100 pontos = R$ 10 de desconto)
- Adicione pontos manualmente se necessário

---

### 2.10 Suporte

**Acesso:** Menu lateral → 🎧 Suporte

Canal direto de comunicação com a equipe STYLOGESTOR.

#### Abrir um chamado

1. Clique na aba **+ Abrir chamado**
2. Escolha o tipo:
   - 🎧 **Suporte técnico** — Algo não está funcionando
   - ⭐ **Elogio** — Compartilhe uma experiência positiva
   - ⚠️ **Reclamação** — Algo não atendeu sua expectativa
   - 💡 **Sugestão** — Ideia para melhorar o sistema
3. Defina a **prioridade** (Baixa, Média, Alta)
4. Preencha o **assunto** e a **descrição detalhada**
5. Clique em **📤 Enviar chamado**

#### Acompanhar chamados

Na aba **📋 Meus chamados** você vê:
- Todos os chamados abertos e resolvidos
- Status de cada chamado (Aguardando, Em andamento, Resolvido)
- Resposta da equipe STYLOGESTOR

| Status | Significado |
|---|---|
| Aguardando | Chamado recebido, será analisado |
| Em andamento | Nossa equipe está trabalhando |
| Resolvido | Problema solucionado |

#### Outros canais de atendimento

- 💬 **WhatsApp:** (65) 99696-52828
- 📧 **E-mail:** suporte@stylogestor.com.br
- **Horário:** Seg–Sex 08h–18h · Sab 08h–12h

---

### 2.11 Configurações e Planos

#### Configurações

**Acesso:** Menu lateral → ⚙️ Configurações

Personalize sua barbearia:

| Configuração | O que faz |
|---|---|
| Nome e logo | Nome exibido no link de agendamento |
| Endereço | Endereço exibido para o cliente |
| Horário de funcionamento | Dias e horários disponíveis para agendamento |
| Link de agendamento | Seu subdomínio personalizado (ex: `joao.stylogestor.com.br`) |
| WhatsApp de notificações | Número que recebe alertas de novos agendamentos |
| Lembretes automáticos | Ativar/desativar mensagens automáticas de confirmação |

#### Planos

**Acesso:** Menu lateral → 💳 Planos

Gerencie sua assinatura STYLOGESTOR:

| Plano | Recursos |
|---|---|
| Starter | 1 profissional, agendamento online, agenda, financeiro básico |
| Pro | Até 5 profissionais, todos os módulos, relatórios avançados |
| Business | Profissionais ilimitados, multi-unidade, API, suporte prioritário |

- Clique em **Mudar** (rodapé da sidebar) para ver ou trocar de plano
- O plano atual e a data de renovação aparecem no painel lateral

---

## Resumo Visual das Rotinas

### Rotina diária do gestor

```
Manhã:
  1. Acessar Dashboard → conferir agendamentos do dia
  2. Conferir Agenda → visualizar grade por profissional
  3. Confirmar agendamentos online recebidos

Durante o dia:
  4. Criar agendamentos manuais conforme demanda
  5. Marcar atendimentos como "Em atendimento" e depois "Concluído"
  6. Registrar forma de pagamento ao finalizar cada atendimento

Final do dia:
  7. Clicar em "Fechar dia" na Agenda
  8. Conferir resumo financeiro do dia
  9. Verificar estoque se necessário
```

### Rotina semanal do gestor

```
  - Conferir relatório financeiro da semana no Financeiro
  - Verificar alertas de estoque baixo
  - Analisar clientes que não voltam há mais de 30 dias (CRM)
  - Verificar chamados de suporte abertos
```

### Rotina do cliente

```
  1. Acessar o link da barbearia (ex: demo.stylogestor.com.br)
  2. Selecionar serviço(s)
  3. Escolher profissional
  4. Escolher data e horário
  5. Informar nome e WhatsApp
  6. Confirmar agendamento
  7. Receber confirmação pelo WhatsApp
```

---

*Documentação STYLOGESTOR — versão 1.0 · Maio 2026*
