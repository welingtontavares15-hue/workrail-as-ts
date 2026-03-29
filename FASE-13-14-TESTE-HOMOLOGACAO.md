# FASE 13-14 — TESTES OBRIGATÓRIOS E CHECKLIST DE HOMOLOGAÇÃO

**Data:** 29/03/2026
**Versão:** 1.0
**Objetivo:** Validar sistema antes de colocar em produção

---

## FASE 13 — TESTES FUNCIONAIS OBRIGATÓRIOS

### TESTE 1: Fluxo Completo (Happy Path)

**Pré-requisito:** Usuários criados em cada perfil

**Passo 1: Vendas cria solicitação com contrato**
- [ ] Login como vendas
- [ ] Acessar tela "Nova Solicitação"
- [ ] Preencher dados do cliente
- [ ] Preencher dados da máquina
- [ ] Anexar contrato (PDF/Word)
- [ ] Clicar "Enviar Solicitação"
- **Validações:**
  - [ ] Solicitação criada no Firestore
  - [ ] Contrato salvo no Storage
  - [ ] Status = AGUARDANDO_SUPERVISOR
  - [ ] Histórico registra SOLICITACAO_CRIADA
  - [ ] Power Automate recebe evento
  - [ ] Email notifica supervisor

**Passo 2: Supervisor aprova e define fornecedor**
- [ ] Login como supervisor_asts
- [ ] Acessar solicitação pendente
- [ ] Visualizar dados do cliente e máquina
- [ ] Preencher especificação da máquina
- [ ] Selecionar fornecedor (EBST ou Hobart)
- [ ] Clicar "Aprovar"
- **Validações:**
  - [ ] Status = AGUARDANDO_ADM
  - [ ] etapaAtual = adm_vendas
  - [ ] dadosAdm.fornecedor preenchido
  - [ ] Histórico registra SUPERVISOR_APROVOU
  - [ ] Power Automate recebe evento
  - [ ] Email notifica ADM

**Passo 3: ADM aprova e encaminha ao fornecedor**
- [ ] Login como adm_vendas
- [ ] Acessar solicitação pendente
- [ ] Revisar dados (não editar)
- [ ] Clicar "Aprovar e Encaminhar"
- **Validações:**
  - [ ] Status = EM_PREPARACAO_FORNECEDOR
  - [ ] etapaAtual = fornecedor
  - [ ] Histórico registra ADM_ENCAMINHOU_FORNECEDOR
  - [ ] Power Automate recebe evento
  - [ ] Email notifica fornecedor

**Passo 4: Fornecedor anexa NF**
- [ ] Login como fornecedor correspondente
- [ ] Acessar solicitação
- [ ] Anexar NF
- [ ] Preencher data de liberação
- [ ] Clicar "Confirmar"
- **Validações:**
  - [ ] Status = NF_ANEXADA_AGUARDANDO_LOGISTICA
  - [ ] etapaAtual = logistica
  - [ ] NF salva no Storage
  - [ ] Histórico registra FORNECEDOR_ANEXOU_NF
  - [ ] Power Automate recebe evento
  - [ ] Email notifica ADM

**Passo 5: ADM aciona logística**
- [ ] Login como adm_vendas
- [ ] Acessar solicitação
- [ ] Preencher data de coleta e entrega
- [ ] Clicar "Acionar Logística"
- **Validações:**
  - [ ] Status = AGUARDANDO_DATA_INSTALACAO
  - [ ] etapaAtual = data_instalacao
  - [ ] Histórico registra ADM_ACIONOU_LOGISTICA
  - [ ] Power Automate recebe evento
  - [ ] Email notifica supervisor

**Passo 6: Supervisor informa data de instalação**
- [ ] Login como supervisor_asts
- [ ] Acessar solicitação
- [ ] Preencher data de instalação
- [ ] Clicar "Confirmar"
- **Validações:**
  - [ ] Status = AGUARDANDO_RELATORIO_FINAL
  - [ ] etapaAtual = relatorio_final
  - [ ] Histórico registra SUPERVISOR_INFORMOU_DATA_INSTALACAO
  - [ ] Power Automate recebe evento

**Passo 7: Supervisor anexa relatório e finaliza**
- [ ] Login como supervisor_asts
- [ ] Acessar solicitação
- [ ] Anexar relatório de instalação
- [ ] Preencher observações finais
- [ ] Clicar "Concluir"
- **Validações:**
  - [ ] Status = CONCLUIDA
  - [ ] etapaAtual = concluido
  - [ ] Relatório salvo no Storage
  - [ ] Histórico registra SUPERVISOR_ANEXOU_RELATORIO
  - [ ] Histórico registra PROCESSO_FINALIZADO
  - [ ] Power Automate recebe evento final
  - [ ] Processo encerrado

---

### TESTE 2: Rejeição pelo Supervisor

**Pré-requisito:** Solicitação em estado AGUARDANDO_SUPERVISOR

- [ ] Login como supervisor_asts
- [ ] Acessar solicitação
- [ ] Clicar "Rejeitar"
- [ ] Fornecer motivo (opcional)
- **Validações:**
  - [ ] Status = REJEITADA_SUPERVISOR
  - [ ] Histórico registra SUPERVISOR_REJEITOU
  - [ ] Power Automate recebe evento
  - [ ] Vendas é notificado

---

### TESTE 3: Controle de Acesso por Perfil

**3.1: Vendas não consegue ver solicitação de outro vendedor**
- [ ] Login como Vendas A
- [ ] Criar solicitação X
- [ ] Logout
- [ ] Login como Vendas B
- **Validações:**
  - [ ] Vendas B não vê solicitação X na lista
  - [ ] Acessar URL direta bloqueia
  - [ ] Firestore rules retorna erro

**3.2: Fornecedor EBST não consegue ver Hobart**
- [ ] Login como fornecedor_ebst
- [ ] Criar solicitação encaminhada para Hobart
- [ ] Logout
- [ ] Login como fornecedor_ebst
- **Validações:**
  - [ ] Fornecedor EBST não vê solicitação Hobart
  - [ ] Apenas vê suas solicitações EBST

**3.3: Supervisor vê todas as solicitações**
- [ ] Login como supervisor_asts
- [ ] Verificar lista de solicitações
- **Validações:**
  - [ ] Vê todas as solicitações independente de origem
  - [ ] Vê solicitações de todos os vendedores
  - [ ] Vê solicitações para ambos fornecedores

**3.4: ADM vê todas as solicitações**
- [ ] Login como adm_vendas
- [ ] Verificar lista de solicitações
- **Validações:**
  - [ ] Vê todas as solicitações
  - [ ] Pode editar etapa adm_vendas
  - [ ] Não pode editar outras etapas

---

### TESTE 4: Histórico Completo

**Pré-requisito:** Solicitação completa (fluxo happy path acima)

- [ ] Login como supervisor_asts
- [ ] Acessar solicitação
- [ ] Expandir seção "Histórico"
- **Validações:**
  - [ ] Histórico mostra 10 eventos
  - [ ] SOLICITACAO_CRIADA
  - [ ] SUPERVISOR_APROVOU
  - [ ] ADM_ENCAMINHOU_FORNECEDOR
  - [ ] FORNECEDOR_ANEXOU_NF
  - [ ] ADM_ACIONOU_LOGISTICA
  - [ ] SUPERVISOR_INFORMOU_DATA_INSTALACAO
  - [ ] SUPERVISOR_ANEXOU_RELATORIO
  - [ ] PROCESSO_FINALIZADO
  - [ ] Cada evento mostra: tipo, usuário, data, descrição
  - [ ] Eventos ordenados cronologicamente

---

### TESTE 5: Documentos Armazenados

**5.1: Contrato**
- [ ] Arquivo salvo em `/solicitacoes/{protocolo}/contrato/`
- [ ] Arquivo acessível via downloadURL
- [ ] Metadados salvos no Firestore
- [ ] Apenas vendedor, adm, supervisor, admin conseguem baixar

**5.2: Nota Fiscal**
- [ ] Arquivo salvo em `/solicitacoes/{protocolo}/nf/`
- [ ] Arquivo acessível via downloadURL
- [ ] Apenas fornecedor correto consegue fazer upload
- [ ] ADM e supervisor conseguem baixar

**5.3: Relatório**
- [ ] Arquivo salvo em `/solicitacoes/{protocolo}/relatorio/`
- [ ] Arquivo acessível via downloadURL
- [ ] Apenas supervisor consegue fazer upload
- [ ] Admin consegue deletar

---

### TESTE 6: Power Automate Integration

**Pré-requisito:** Webhook Power Automate configurado

**6.1: Evento SOLICITACAO_CRIADA**
- [ ] Criar solicitação como Vendas
- [ ] Verificar logs (console ou Power Automate)
- **Validações:**
  - [ ] Evento recebido em < 5 segundos
  - [ ] Payload contém protocolo, cliente, máquina
  - [ ] Timestamp correto
  - [ ] Executado por: nome vendedor

**6.2: Evento SUPERVISOR_APROVOU**
- [ ] Aprovar como Supervisor
- **Validações:**
  - [ ] Evento recebido
  - [ ] Payload inclui fornecedor definido
  - [ ] Payload inclui especificação máquina

**6.3: Evento FORNECEDOR_ANEXOU_NF**
- [ ] Anexar NF como Fornecedor
- **Validações:**
  - [ ] Evento recebido
  - [ ] Payload inclui número NF
  - [ ] documentos.nfUrl preenchida

**6.4: Payload Padrão Mantido**
- [ ] Todos os eventos mantêm mesma estrutura
- [ ] Campos opcionais vazios quando não aplicável
- [ ] Nunca mudam de nome entre eventos

---

### TESTE 7: Dashboard e Relatórios

**7.1: Dashboard carrega corretamente**
- [ ] Login como supervisor_asts
- [ ] Acessar Dashboard
- **Validações:**
  - [ ] KPIs carregam: Ativas, Vencimento 30/90 dias, Vencidas
  - [ ] Gráficos renderizam
  - [ ] Filtros funcionam

**7.2: Relatórios podem ser exportados**
- [ ] Login como adm_vendas
- [ ] Acessar Relatórios
- [ ] Exportar como CSV/PDF
- **Validações:**
  - [ ] Arquivo gerado corretamente
  - [ ] Dados corretos

---

### TESTE 8: Notificações

**Pré-requisito:** Email system configurado

- [ ] Criação de solicitação envia email ao supervisor
- [ ] Aprovação supervisor envia email ao ADM
- [ ] Encaminhamento ADM envia email ao fornecedor
- [ ] NF anexada envia email ao ADM
- [ ] Logística acionada envia email ao supervisor
- [ ] Data de instalação notifica
- [ ] Relatório anexado finaliza

---

### TESTE 9: Validações de Entrada

**9.1: Campos obrigatórios**
- [ ] Não enviar solicitação sem cliente
- [ ] Não enviar solicitação sem máquina
- [ ] Não enviar solicitação sem contrato
- [ ] Não enviar sem supervisor definir fornecedor
- **Validações:**
  - [ ] Sistema retorna erro claro
  - [ ] Campo destaca em vermelho

**9.2: Formatos de dados**
- [ ] CNPJ inválido não aceita
- [ ] Data de instalação não pode ser no passado
- [ ] Email inválido não aceita
- [ ] Arquivo grande (>10MB) rejeita

---

### TESTE 10: Performance

**10.1: Carregamento de solicitação**
- [ ] Tempo de carga < 2 segundos
- [ ] Histórico carrega em < 1 segundo
- [ ] Dashboard carrega em < 3 segundos

**10.2: Operações grandes**
- [ ] Listar 100 solicitações: < 5 segundos
- [ ] Filtrar por status: < 2 segundos
- [ ] Exportar 50 solicitações: < 10 segundos

---

## FASE 14 — CHECKLIST DE ACEITE

### A. Preservação de Layout

- [ ] Topbar intacto (logo, breadcrumb, user menu)
- [ ] Sidebar mantém navegação original
- [ ] Progress navigation mostra etapas
- [ ] Cards mantêm espaçamento e cores
- [ ] Formulários mantêm campos originais
- [ ] Botões mantêm estilo
- [ ] Sem redesign de interface

### B. Fluxo Novo Refletido 100%

- [ ] Vendas cria e envia
- [ ] Supervisor valida e define fornecedor
- [ ] ADM aprova e encaminha
- [ ] Fornecedor prepara e anexa NF
- [ ] ADM aciona logística
- [ ] Supervisor informa data de instalação
- [ ] Supervisor anexa relatório e encerra
- [ ] Cada etapa tem botões apropriados
- [ ] Progress nav atualiza conforme fluxo

### C. Perfis Respeitados

- [ ] Vendas vê apenas seus pedidos
- [ ] Supervisor vê todos
- [ ] ADM vê todos
- [ ] Fornecedor EBST vê apenas EBST
- [ ] Fornecedor Hobart vê apenas Hobart
- [ ] Admin acessa tudo
- [ ] Menus adequados por perfil
- [ ] Botões corretos por perfil

### D. Persistência de Dados

- [ ] Contrato armazenado no Storage
- [ ] Nota Fiscal armazenada no Storage
- [ ] Relatório armazenado no Storage
- [ ] Metadados salvos no Firestore
- [ ] Caminhos Storage: `solicitacoes/{protocolo}/{tipo}/`
- [ ] URLs de download funcionam
- [ ] Firestore tem todas as coleções

### E. Histórico Completo

- [ ] Cada evento cria registro
- [ ] Campo executadoPor* rastreia quem fez
- [ ] Histórico nunca pode ser editado
- [ ] Histórico nunca pode ser deletado
- [ ] Histórico mostra na tela cronologicamente
- [ ] Histórico pode ser exportado

### F. Power Automate

- [ ] Payload único e estável
- [ ] Enviado em todos os 9 eventos
- [ ] Nunca varia estrutura por etapa
- [ ] Timestamp correto
- [ ] Responsáveis identificados
- [ ] URLs dos documentos inclusos
- [ ] Datas no formato ISO 8601

### G. Sem Dependência de Dados Fake

- [ ] Sem dados hardcoded
- [ ] Sem IDs fake no código
- [ ] Sem emails de teste
- [ ] Modelos de máquina vêm do Firestore ou fallback correto
- [ ] Fornecedores vêm do Firestore ou listagem fixa

### H. Código Comentado Adequadamente

- [ ] Funções principais tem JSDoc
- [ ] Seções críticas tem comentário
- [ ] Sem comments óbvios
- [ ] Sem código comentado deixado
- [ ] Sem console.log() em produção

### I. Sem Quebras

- [ ] Dashboard carrega
- [ ] Histórico carrega
- [ ] Login funciona
- [ ] Filtros funcionam
- [ ] Exportação funciona
- [ ] Upload de arquivo funciona
- [ ] Sem erros de JavaScript

### J. Firestore Rules Aplicadas

- [ ] Vendedor não consegue ver outro vendedor
- [ ] Fornecedor não consegue editar etapa errada
- [ ] Super_admin consegue tudo
- [ ] Histórico é imutável (append-only)
- [ ] Testes de segurança passam

### K. Storage Rules Aplicadas

- [ ] Contrato: vendedor pode criar, supervisos/adm podem ler
- [ ] NF: fornecedor correto pode criar
- [ ] Relatório: supervisor pode criar
- [ ] Sem permissão de editar (update)
- [ ] Testes de segurança passam

---

## PLANILHA DE EVIDÊNCIA

Usar para documentar testes:

```
| Teste | Pré-requisito | Resultado | Data | Evidência | Assinado |
|-------|---------------|-----------|------|-----------|----------|
| Fluxo Completo | Usuários criados | ✅ PASSOU | 29/03 | Screenshot | João |
| Visibilidade Vendas | Vendas A/B | ✅ PASSOU | 29/03 | Screenshot | João |
| ...| ... | ... | ... | ... | ... |
```

---

## CRITÉRIOS FINAIS DE ACEITE

O sistema está pronto para PRODUÇÃO quando:

- ✅ Todos os testes FASE 13 passam
- ✅ Todos os itens FASE 14 são validados
- ✅ Nenhuma violação de segurança
- ✅ Performance aceitável (<5s por operação)
- ✅ Usuários conseguem usar sem treinamento adicional
- ✅ Histórico e auditoria completa
- ✅ Power Automate recebendo eventos
- ✅ Backup diário do Firestore

---

**Responsável de QA:** _________________
**Data de Conclusão:** _________________
**Observações:** _________________

