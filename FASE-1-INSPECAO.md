# FASE 1 — INSPEÇÃO E PREPARAÇÃO

**Data:** 29/03/2026
**Arquivo Base:** workrail_fluxo_as_ts_v2.4.html
**Status:** ✅ Mapeamento Completo

---

## 1. ESTRUTURA GERAL DO HTML

### Shell Layout
- **Topbar** - Altura 50px, navy (#1a1a2e)
  - Logo + texto branding
  - Breadcrumb navegação
  - Botões de ícone (notificações, user menu)
  - Identificação do usuário logado

- **Sidebar** - Largura 224px, dark (#0d1821)
  - Menu principal (Home, Dashboard, Solicitação, Histórico, etc)
  - Seção de histórico (últimas solicitações)
  - Badge de status/notificações
  - Rodapé com informações do usuário

- **Main Area**
  - Progress Navigation (42px, etapas do fluxo)
  - Conteúdo variável por página

### Identificadores CSS & IDs Principais
```
#sidebar                      Sidebar container
#progressNav                  Progress navigation bar
#screen-home                  Tela inicial
#screen-solicitacao          Tela de criação/edição de solicitação
#screen-gestor               Tela do supervisor AS&TS
#screen-adm                  Tela do ADM de vendas
#screen-fornecedor           Tela do fornecedor
#screen-logistica            Tela de logística
#screen-instalacao           Tela de agendamento de instalação
#screen-relatorio            Tela de relatório final
#screen-dashboard            Dashboard de analytics
#screen-historico            Histórico de solicitações
#screen-admin                Painel administrativo
#screen-notificacoes         Centro de notificações
```

---

## 2. MAPEAMENTO DE FLUXOS E STEPS

### Fluxo Atual (Código)
```javascript
const FLOW        = ['solicitacao', 'gestor', 'adm', 'fornecedor', 'logistica', 'instalacao', 'relatorio'];
const FLOW_LABELS = ['01·Solicitação', '02·Supervisor AS&TS', '03·ADM Vendas', '04·Fornecedor', '05·Logística', '06·Instalação', '07·Encerramento'];
```

### Correspondência Fluxo Antigo → Novo
| Antigo (Código) | Novo (Negócio) | Responsável | Step ID |
|---|---|---|---|
| solicitacao | Criação de Solicitação | Vendas | `solicitacao` |
| gestor | Análise/Validação | Supervisor AS&TS | `supervisor` |
| adm | Aprovação e Encaminhamento | ADM Vendas | `adm_vendas` |
| fornecedor | Preparação de Máquina | Fornecedor (EBST/Hobart) | `fornecedor` |
| logistica | Coleta e Entrega | ADM (via Logística) | `logistica` |
| instalacao | Agendamento de Instalação | Supervisor AS&TS | `data_instalacao` |
| relatorio | Conclusão | Supervisor AS&TS | `relatorio_final` |

---

## 3. MAPEAMENTO DE PERFIS

### Perfis Atuais (Código)
```javascript
const PERFIS = {
  super_admin:       { label:'Administrador',    chip:'c-admin',    cor:'#b71c1c' },
  vendas:            { label:'Vendas',          chip:'c-pending',  cor:'#e65100' },
  gestor:            { label:'Supervisor AS&TS', chip:'c-analysis', cor:'#1565c0' },
  adm:               { label:'ADM Vendas',       chip:'c-approved', cor:'#2e7d32' },
  fornecedor_ebst:   { label:'Fornecedor EBST', chip:'c-supplier', cor:'#4527a0' },
  fornecedor_hobart: { label:'Fornecedor Hobart',chip:'c-supplier',cor:'#4527a0' }
};
```

### Normalização de Perfis Necessária
| Perfil Atual | Perfil Novo | Mantém? | Observação |
|---|---|---|---|
| vendas | vendas | ✅ Sim | Sem alteração |
| gestor | supervisor_asts | ❌ Será Renomeado | Retracing necessário |
| adm | adm_vendas | ⚠️ Parcial | "adm" genérico → "adm_vendas" |
| fornecedor_ebst | fornecedor_ebst | ✅ Sim | Sem alteração |
| fornecedor_hobart | fornecedor_hobart | ✅ Sim | Sem alteração |
| super_admin | super_admin | ✅ Sim | Sem alteração |

**Ação Necessária:** Renomear "gestor" para "supervisor_asts" em TODO o código

---

## 4. MAPEAMENTO DE STATUS

### Status Atuais
```javascript
const STATUS = {
  RASCUNHO:                { label:'Rascunho', chip:'c-pending' },
  AGUARDANDO_GESTOR:       { label:'Ag. Supervisor', chip:'c-pending' },
  EM_ANALISE_GESTOR:       { label:'Em Análise', chip:'c-analysis' },
  AGUARDA_AJUSTE:          { label:'Ag. Ajuste', chip:'c-pending' },
  REPROVADO:               { label:'Reprovado', chip:'c-rejected' },
  APROVADO_GESTOR:         { label:'Aprovado', chip:'c-approved' },
  EM_REVISAO_ADM:          { label:'Revisão ADM', chip:'c-analysis' },
  COM_FORNECEDOR:          { label:'Com Fornecedor', chip:'c-supplier' },
  NF_ANEXADA:              { label:'NF Anexada', chip:'c-transit' },
  EM_LOGISTICA:            { label:'Em Trânsito', chip:'c-transit' },
  AGUARDANDO_INSTALACAO:   { label:'Logística', chip:'c-transit' },
  INSTALACAO_AGENDADA:     { label:'Ag. Instalação', chip:'c-install' },
  INSTALACAO_CONCLUIDA:    { label:'Instalado', chip:'c-install' },
  ENCERRADO:               { label:'Concluído', chip:'c-done' }
};
```

### Mapeamento para Novo Fluxo

| Status Antigo | Novo Status | Etapa | Observação |
|---|---|---|---|
| RASCUNHO | (remover) | - | Não será mais usado |
| AGUARDANDO_GESTOR | AGUARDANDO_SUPERVISOR | supervisor | Renomear campo "gestor" |
| EM_ANALISE_GESTOR | AGUARDANDO_SUPERVISOR | supervisor | Consolidar |
| AGUARDA_AJUSTE | AGUARDANDO_SUPERVISOR | supervisor | Consolidar |
| REPROVADO | REJEITADA_SUPERVISOR | supervisor | Renomear |
| APROVADO_GESTOR | AGUARDANDO_ADM | adm_vendas | Próxima etapa |
| EM_REVISAO_ADM | AGUARDANDO_ADM | adm_vendas | Consolidar |
| COM_FORNECEDOR | EM_PREPARACAO_FORNECEDOR | fornecedor | Renomear |
| NF_ANEXADA | NF_ANEXADA_AGUARDANDO_LOGISTICA | logistica | Novo status |
| EM_LOGISTICA | AGUARDANDO_DATA_INSTALACAO | data_instalacao | Renomear |
| AGUARDANDO_INSTALACAO | AGUARDANDO_DATA_INSTALACAO | data_instalacao | Consolidar |
| INSTALACAO_AGENDADA | AGUARDANDO_RELATORIO_FINAL | relatorio_final | Renomear |
| INSTALACAO_CONCLUIDA | AGUARDANDO_RELATORIO_FINAL | relatorio_final | Consolidar |
| ENCERRADO | CONCLUIDA | concluido | Renomear |

---

## 5. MAPEAMENTO DE FUNÇÕES CRÍTICAS

### Funções de Coleta de Dados (Por Etapa)
```javascript
coletarDadosSolicitacao()      // Etapa 1: Vendas
coletarDadosSupervisor()       // Etapa 2: Supervisor (atualmente coletarDadosSupervisor)
coletarDadosAdm()              // Etapa 3: ADM de Vendas
coletarDadosFornecedor()       // Etapa 4: Fornecedor
coletarDadosLogistica()        // Etapa 5: Logística
coletarDadosInstalacao()       // Etapa 6: Data de Instalação
coletarDadosRelatorio()        // Etapa 7: Relatório Final
```

**Status:** Todas existem, nomes já adequados ✅

### Funções de Validação (Por Etapa)
```javascript
validateStep_Solicitacao()     // ✅ Existe
validateStep_Gestor()          // ❌ Renomear para validateStep_Supervisor
validateStep_Adm()             // ⚠️ Renomear para validateStep_AdmVendas
validateStep_Fornecedor()      // ✅ Existe
validateStep_Logistica()       // ✅ Existe
validateStep_Instalacao()      // ✅ Existe
validateStep_Relatorio()       // ✅ Existe
```

### Funções de Confirmação/Ação
```javascript
confirmEnviarGestor()          // ❌ Renomear para confirmEnviarSupervisor
confirmAprovar()               // ⚠️ Contexto pode ser ambíguo
confirmExpedicao()             // ✅ Usar para ADM encaminhar ao fornecedor
confirmFornecedor()            // ✅ Usar para fornecedor anexar NF
confirmAgendarInstalacao()     // ✅ Usar para supervisor informar data
confirmConcluir()              // ✅ Usar para supervisor anexar relatório
```

### Funções de Histórico e Persistência
```javascript
carregarHistoricoFirebase()    // ✅ Existe - Será expandida
adicionarHistorico()           // ❌ Não existe - Criar
atualizarSolicitacao()         // ✅ Existe
salvarDocumentoSolicitacao()   // ❌ Não existe - Criar como wrapper
```

### Funções de Controle de Acesso
```javascript
aplicarControleMenu()          // ✅ Existe - Será expandida
aplicarPerfilNaInterface()     // ✅ Existe
podeVisualizarSolicitacao()    // ❌ Não existe - Criar
podeEditarEtapa()              // ❌ Não existe - Criar
```

### Funções para Power Automate
```javascript
enviarEventoPowerAutomate()    // ❌ Não existe - Criar
montarPayloadPowerAutomate()   // ❌ Não existe - Criar
```

---

## 6. MAPEAMENTO DE CAMPOS DO FORMULÁRIO

### Dados de Solicitação (Etapa 1 - Vendas)
```
Criação de Solicitação:
  - numeroPedidoSolic (id)
  - dataSolic (id)
  - tipoSolicitacao (id)

Dados do Cliente:
  - nomeCliente (input)
  - enderecoCliente (input)
  - cnpj (input)
  - emailCliente (input)

Detalhes da Máquina:
  - modeloMaquinaSelect (id)
  - refeicoesDia (input)
  - refeicoesHora (input)
  - mesaNecessaria (checkbox - lMesa/tMesa)
  - detergente (input)
  - secante (input)
  - observacoesContratuais (textarea)

Anexo Obrigatório:
  - fContrato (file input)
```

### Dados do Supervisor (Etapa 2 - Supervisor AS&TS)
```
Análise e Decisão:
  - supervisorModeloValidado (input)
  - supervisorVoltagem (input)
  - supervisorCapacidade (input)
  - supervisorFornecedor (select - EBST / Hobart Brasil)
  - Buttons: mAprovar / mRejeitar
```

### Dados do ADM (Etapa 3 - ADM Vendas)
```
Revisão:
  - selectFornecedorAdm (select)
  - Buttons: mExpedir
```

### Dados do Fornecedor (Etapa 4)
```
Preparação:
  - fNF (file input - NF)
  - dataLiberacaoMaquina (input)
  - observacoesFornecedor (textarea)
  - Button: confirmFornecedor
```

### Dados de Logística (Etapa 5)
```
Coleta e Entrega:
  - dataColeta (input - dataColeta id)
  - dataColetaConfirmada (input)
  - dataEntrega (input)
  - responsavelLogistica (input)
  - observacoesLogistica (textarea)
```

### Dados de Instalação (Etapa 6)
```
Agendamento:
  - dataInstalacao (input)
  - observacoesInstalacao (textarea)
  - Button: confirmAgendarInstalacao
```

### Dados de Relatório (Etapa 7)
```
Conclusão:
  - fRel (file input - Relatório)
  - observacoesRelatorio (textarea)
  - Button: confirmConcluir
```

---

## 7. MAPEAMENTO DE EVENTOS E HANDLERS

### Navegação (Função `go()`)
- `go('home')` → #screen-home
- `go('solicitacao')` → #screen-solicitacao
- `go('gestor')` → #screen-gestor (❌ Renomear para supervisor)
- `go('adm')` → #screen-adm (⚠️ Renomear para adm_vendas contexto)
- `go('fornecedor')` → #screen-fornecedor
- `go('logistica')` → #screen-logistica
- `go('instalacao')` → #screen-instalacao
- `go('relatorio')` → #screen-relatorio
- `go('dashboard')` → #screen-dashboard
- `go('historico')` → #screen-historico
- `go('admin')` → #screen-admin

### Botões Principais
| ID | Função Atual | Etapa | Ação |
|---|---|---|---|
| mEnviar | confirmEnviarGestor() | 1 | Enviar solicitação (Vendas) |
| mAprovar | confirmAprovar() | 2 | Aprovar (Supervisor) |
| mRejeitar | confirmRejeitar() | 2 | Rejeitar (Supervisor) |
| mExpedir | confirmExpedicao() | 3 | Encaminhar (ADM) |
| mFornecedor | confirmFornecedor() | 4 | Confirmar NF (Fornecedor) |
| mInstalacao | confirmAgendarInstalacao() | 6 | Agendar instalação (Supervisor) |
| mRelatorio | confirmConcluir() | 7 | Concluir com relatório (Supervisor) |
| mAjuste | confirmSolicitarAjuste() | 2/3 | Solicitar ajuste |

---

## 8. TABELA DE DEPENDÊNCIAS E IMPACTOS

### Renomeações Críticas Necessárias

#### 1. Perfil "gestor" → "supervisor_asts"
**Arquivos afetados:** HTML + JavaScript
**Campos no DB:** perfis campo
**Impacto Alto:** ~50+ ocorrências no código

**Locais de busca:**
- Função `aplicarControleMenu()` - verificação de perfil
- Função `aplicarPerfilNaInterface()` - labels
- Função `validateStep_Gestor()` - renomear para validateStep_Supervisor
- Função `confirmEnviarGestor()` - contexto de ADM
- Screens: `#screen-gestor` → `#screen-supervisor` (considerar manter ID por compatibilidade)
- Sidebar: `#sb-gestor`
- Status: `AGUARDANDO_GESTOR`, `EM_ANALISE_GESTOR`, `APROVADO_GESTOR`
- FLOW, FLOW_LABELS

#### 2. Perfil "adm" → "adm_vendas"
**Arquivos afetados:** HTML + JavaScript
**Impacto Médio:** ~20+ ocorrências

**Locais:**
- PERFIS object
- validateStep_Adm() função
- Screens: `#screen-adm`
- Status com "ADM" no nome
- Sidebar menus

#### 3. Steps do FLOW
**Renomeações:**
- `gestor` → `supervisor`
- `adm` → `adm_vendas`
- `instalacao` → `data_instalacao`
- `relatorio` → `relatorio_final`

---

## 9. ESTRUTURA DE DOCUMENTOS FIREBASE

### Coleção: `solicitacoes`

**Campos Principais:**
- `protocolo` (string, unique)
- `numeroPedido` (string)
- `status` (string - ref. STATUS object)
- `etapaAtual` (string - ref. FLOW array)
- `criadoEm` (timestamp)
- `atualizadoEm` (timestamp)
- `criadoPorUid` (string)
- `criadoPorNome` (string)
- `criadoPorEmail` (string)
- `criadoPorPerfil` (string)

**Subobjetos:**
- `dadosCliente` {shipTo, nomeCliente, cnpj, emailCliente, enderecoInstalacao}
- `dadosSolicitacao` {tipoSolicitacao, modeloMaquina, fabricante, refeicoesDia, refeicoesHora, mesaNecessaria, detergente, secante, observacoesContratuais}
- `parecerSupervisor` {decisao, especificacaoMaquina, fornecedorDefinido, observacoes, aprovadoEm, aprovadoPorUid, aprovadoPorNome}
- `dadosAdm` {aprovado, encaminhadoFornecedor, aprovadoEm, aprovadoPorUid, aprovadoPorNome, observacoes}
- `dadosFornecedor` {fornecedor, numeroNF, dataLiberacaoMaquina, observacoes, anexadoEm}
- `dadosLogistica` {coletaSolicitada, dataColeta, dataEntrega, responsavelLogistica, observacoes, acionadoEm}
- `dadosInstalacao` {dataInstalacao, informadoPorUid, informadoPorNome, informadoEm, observacoes}
- `dadosRelatorio` {observacoesFinais, finalizadoPorUid, finalizadoPorNome, finalizadoEm}

**Documentos (refs no Storage):**
- `contrato` {nomeArquivo, storagePath, downloadURL, uploadEm, uploadPorUid, uploadPorNome}
- `notaFiscal` {id., storagePath, downloadURL, uploadEm, uploadPorUid, uploadPorNome}
- `relatorioInstalacao` {nomeArquivo, storagePath, downloadURL, uploadEm, uploadPorUid, uploadPorNome}

**Subcoleção: `historico`**
- `tipoEvento` (string)
- `descricao` (string)
- `etapaOrigem` (string)
- `etapaDestino` (string)
- `statusResultante` (string)
- `executadoPorUid` (string)
- `executadoPorNome` (string)
- `executadoPorPerfil` (string)
- `dataEvento` (timestamp)
- `payloadResumo` (object)

---

## 10. CHECKLIST DE VALIDAÇÃO — FASE 1

- ✅ HTML estrutura mapeada
- ✅ IDs das telas identificados
- ✅ Funções críticas listadas
- ✅ Perfis e status mapeados
- ✅ Fluxo antigo → novo documentado
- ✅ Dependências identificadas
- ✅ Campos de formulário mapeados
- ✅ Renomeações necessárias listadas

**Próximos Passos:**
1. ✏️ FASE 2: Padronização de Perfis
2. ✏️ FASE 3: Padronização do Fluxo
3. ✏️ FASE 4-7: Estrutura Firebase
4. ✏️ FASE 8-9: Regras de Negócio e Acesso
5. ✏️ FASE 10-11: Power Automate e JS
6. ✏️ FASE 12-14: Testes e Homologação

---

**Preparado por:** Agent IA WORKRAIL
**Data:** 29/03/2026
**Versão:** 1.0
