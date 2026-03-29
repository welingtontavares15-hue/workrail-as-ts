# FASE 11 — GUIA DE MIGRATION E PADRONIZAÇÃO

**Data:** 29/03/2026
**Versão:** 1.0
**Objetivo:** Instruções para converter o código antigo para o novo padrão

---

## 1. RENOMEAÇÕES CRÍTICAS

### 1.1 Perfil "gestor" → "supervisor_asts"

**Onde encontrar:**
```bash
# Buscar todas as ocorrências
grep -n "gestor" /path/to/workrail_fluxo_as_ts_v2.4.html
grep -n "'gestor'" /path/to/workrail_fluxo_as_ts_v2.4.html
```

**Renomeações:**
- Perfil: `gestor` → `supervisor_asts` (no objeto PERFIS)
- Função: `validateStep_Gestor()` → `validateStep_Supervisor()`
- Função: `confirmEnviarGestor()` → `confirmEnviarSupervisor()`
- Status: `AGUARDANDO_GESTOR` → `AGUARDANDO_SUPERVISOR`
- Status: `EM_ANALISE_GESTOR` → (consolidar em `AGUARDANDO_SUPERVISOR`)
- Status: `APROVADO_GESTOR` → (consolidar em `AGUARDANDO_ADM`)
- Tela: `#screen-gestor` → (considerar manter ID por compatibilidade, mas renomear labels)
- Menu: `#sb-gestor` → (renomear para supervisor)

**Exemplo de busca e substituição:**
```javascript
// ANTES
const PERFIS = {
  gestor: { label:'Supervisor AS&TS', ... }
};

// DEPOIS
const PERFIS = {
  supervisor_asts: { label:'Supervisor AS&TS', ... }
};
```

### 1.2 Perfil "adm" → "adm_vendas"

**Onde encontrar:**
```bash
grep -n "'adm'" /path/to/workrail_fluxo_as_ts_v2.4.html
grep -n "match 'adm'" /path/to/workrail_fluxo_as_ts_v2.4.html
```

**Renomeações:**
- Perfil: `adm` → `adm_vendas`
- Função: `validateStep_Adm()` → `validateStep_AdmVendas()`
- Status com "ADM" → verificar contexto

**Exemplo:**
```javascript
// ANTES
if (currentUser?.perfil === 'adm') { ... }

// DEPOIS
if (currentUser?.perfil === 'adm_vendas') { ... }
```

---

## 2. RENOMEAÇÕES DE STEPS/ETAPAS

### Mapeamento

| Antigo | Novo | Impacto |
|---|---|---|
| `solicitacao` | `solicitacao` | ✅ Sem mudança |
| `gestor` | `supervisor` | ❌ Requer update |
| `adm` | `adm_vendas` | ❌ Requer update |
| `fornecedor` | `fornecedor` | ✅ Sem mudança |
| `logistica` | `logistica` | ✅ Sem mudança |
| `instalacao` | `data_instalacao` | ❌ Requer update |
| `relatorio` | `relatorio_final` | ❌ Requer update |

**Onde encontrar:**
```javascript
// Constante FLOW
const FLOW = ['solicitacao','gestor','adm','fornecedor','logistica','instalacao','relatorio'];

// Substituir por:
const FLOW = ['solicitacao','supervisor','adm_vendas','fornecedor','logistica','data_instalacao','relatorio_final'];

// FLOW_LABELS também precisa atualizar
const FLOW_LABELS = ['01·Solicitação','02·Supervisor AS&TS','03·ADM Vendas','04·Fornecedor','05·Logística','06·Instalação','07·Encerramento'];
```

**Função de navegação `go()`:**
```javascript
// ANTES: go('gestor'), go('adm'), go('instalacao'), go('relatorio')
// DEPOIS: go('supervisor'), go('adm_vendas'), go('data_instalacao'), go('relatorio_final')

// Atualizar todas as chamadas ao longo do código
```

---

## 3. PADRONIZAÇÃO DE STATUS

### Conversão de Status

| Status Antigo | Novo Status | Ação |
|---|---|---|
| `RASCUNHO` | (remover) | Deletar referências |
| `AGUARDANDO_GESTOR` | `AGUARDANDO_SUPERVISOR` | Renomear |
| `EM_ANALISE_GESTOR` | `AGUARDANDO_SUPERVISOR` | Consolidar |
| `AGUARDA_AJUSTE` | `AGUARDANDO_SUPERVISOR` | Consolidar |
| `REPROVADO` | `REJEITADA_SUPERVISOR` | Renomear |
| `APROVADO_GESTOR` | `AGUARDANDO_ADM` | Renomear |
| `EM_REVISAO_ADM` | `AGUARDANDO_ADM` | Consolidar |
| `COM_FORNECEDOR` | `EM_PREPARACAO_FORNECEDOR` | Renomear |
| `NF_ANEXADA` | `NF_ANEXADA_AGUARDANDO_LOGISTICA` | Renomear |
| `EM_LOGISTICA` | `AGUARDANDO_DATA_INSTALACAO` | Renomear |
| `AGUARDANDO_INSTALACAO` | `AGUARDANDO_DATA_INSTALACAO` | Consolidar |
| `INSTALACAO_AGENDADA` | `AGUARDANDO_RELATORIO_FINAL` | Renomear |
| `INSTALACAO_CONCLUIDA` | `AGUARDANDO_RELATORIO_FINAL` | Consolidar |
| `ENCERRADO` | `CONCLUIDA` | Renomear |

**Exemplo:**
```javascript
// ANTES
const STATUS = {
  AGUARDANDO_GESTOR: { key:'AGUARDANDO_GESTOR', label:'Ag. Supervisor', chip:'c-pending' },
  APROVADO_GESTOR: { key:'APROVADO_GESTOR', label:'Aprovado', chip:'c-approved' },
  COM_FORNECEDOR: { key:'COM_FORNECEDOR', label:'Com Fornecedor', chip:'c-supplier' },
  INSTALACAO_AGENDADA: { key:'INSTALACAO_AGENDADA', label:'Ag. Instalação', chip:'c-install' }
};

// DEPOIS
const STATUS = {
  AGUARDANDO_SUPERVISOR: { key:'AGUARDANDO_SUPERVISOR', label:'Ag. Supervisor', chip:'c-pending' },
  AGUARDANDO_ADM: { key:'AGUARDANDO_ADM', label:'Ag. ADM', chip:'c-analysis' },
  EM_PREPARACAO_FORNECEDOR: { key:'EM_PREPARACAO_FORNECEDOR', label:'Em Preparação', chip:'c-supplier' },
  AGUARDANDO_RELATORIO_FINAL: { key:'AGUARDANDO_RELATORIO_FINAL', label:'Ag. Relatório', chip:'c-install' }
};
```

---

## 4. ATUALIZAÇÃO DE FUNÇÕES

### Funções de Coleta de Dados (OK - Nomes já padronizados)

```javascript
coletarDadosSolicitacao()     // ✅ OK
coletarDadosSupervisor()      // ✅ OK (era em supervisor, permanece)
coletarDadosAdm()             // ✅ OK (contexto claro)
coletarDadosFornecedor()      // ✅ OK
coletarDadosLogistica()       // ✅ OK
coletarDadosInstalacao()      // ✅ OK
coletarDadosRelatorio()       // ✅ OK
```

### Funções de Validação (Requer Renomeação)

```javascript
// ANTES
validateStep_Solicitacao()
validateStep_Gestor()        // ❌ Renomear
validateStep_Adm()           // ⚠️ Considerar renomear
validateStep_Fornecedor()    // ✅ OK
validateStep_Logistica()     // ✅ OK
validateStep_Instalacao()    // ✅ OK
validateStep_Relatorio()     // ✅ OK

// DEPOIS
validateStep_Solicitacao()
validateStep_Supervisor()    // Novo nome
validateStep_AdmVendas()     // Novo nome (opcional)
validateStep_Fornecedor()
validateStep_Logistica()
validateStep_DataInstalacao() // Considerar renomear
validateStep_RelatorioFinal() // Considerar renomear
```

### Funções de Confirmação/Ação

```javascript
// ANTES
confirmEnviarGestor()        // ❌ Contexto errado (ADM envia)
confirmAprovar()             // ⚠️ Ambíguo
confirmExpedicao()           // ✅ OK (ADM encaminha)
confirmFornecedor()          // ✅ OK
confirmAgendarInstalacao()   // ✅ OK
confirmConcluir()            // ✅ OK

// DEPOIS
confirmEnviarSolicitacao()   // Etapa 1: Vendas envia
confirmAprovarSupervisor()   // Etapa 2: Supervisor aprova
confirmExpedicaoADM()        // Etapa 3: ADM encaminha
confirmAnexarNF()            // Etapa 4: Fornecedor anexa NF
confirmAcionarLogistica()    // Etapa 5: ADM aciona logística
confirmAgendarInstalacao()   // Etapa 6: Supervisor informa data
confirmAnexarRelatorio()     // Etapa 7: Supervisor anexa relatório
```

### Funções Novas (Implementar)

```javascript
// HISTÓRICO
adicionarHistorico(solicitacaoId, tipoEvento, dados, user)

// PERSISTÊNCIA
salvarDocumentoSolicitacao(dados)

// POWER AUTOMATE
enviarEventoPowerAutomate(tipoEvento, solicitacao)
montarPayloadPowerAutomate(tipoEvento, solicitacao)

// CONTROLE DE ACESSO
podeVisualizarSolicitacao(solicitacao, perfil, uid)
podeEditarEtapa(etapa, perfil, solicitacao)

// CARREGAMENTO
carregarModelosMaquinas()
carregarPerfilUsuario(uid)
```

---

## 5. CHECKLIST DE MIGRATION

### Fase 1: Busca e Substitui\u00e7\u00e3o (Automática)
- [ ] Renomear perfil `gestor` → `supervisor_asts` (50+ ocorrências)
- [ ] Renomear perfil `adm` → `adm_vendas` (20+ ocorrências)
- [ ] Atualizar constante FLOW
- [ ] Atualizar constante FLOW_LABELS
- [ ] Atualizar STATUS object
- [ ] Renomear funções validateStep_*
- [ ] Renomear funções confirm*

### Fase 2: Integração de Módulos (Manual)
- [ ] Importar/incluir `power-automate-integration.js`
- [ ] Importar/incluir `access-control.js`
- [ ] Importar/incluir `historico-auditoria.js`
- [ ] Integrar chamadas `adicionarHistorico()` em cada confirm*
- [ ] Integrar chamadas `enviarEventoPowerAutomate()` em cada confirm*
- [ ] Integrar `podeVisualizarSolicitacao()` na carga de solicitações
- [ ] Integrar `podeEditarEtapa()` na validação de telas

### Fase 3: Configuração Firebase (Manual)
- [ ] Copiar regras Firestore do arquivo `firestore-security-rules.txt`
- [ ] Copiar regras Storage do arquivo `firebase-storage-rules.txt`
- [ ] Atualizar URL do webhook Power Automate
- [ ] Testar autenticação Firebase
- [ ] Testar conexão com Firestore
- [ ] Testar upload de arquivos

### Fase 4: Validação (Manual)
- [ ] Testar login com diferentes perfis
- [ ] Testar criação de solicitação (Vendas)
- [ ] Testar aprovação (Supervisor)
- [ ] Testar encaminhamento (ADM)
- [ ] Testar anexação de NF (Fornecedor)
- [ ] Testar histórico é registrado
- [ ] Testar Power Automate recebe eventos
- [ ] Testar visibilidade por perfil

---

## 6. EXEMPLO DE SUBSTITUIÇÃO AUTOMÁTICA

Se usar VS Code ou similar:

### Renomear "gestor" para "supervisor_asts"
```
Find: \bgestor\b
Replace: supervisor_asts
Regex: ✓
Whole Word: ✓
```

### Renomear "adm" para "adm_vendas"
```
Find: \badm\b
Replace: adm_vendas
Regex: ✓
Whole Word: ✓
```

⚠️ **CUIDADO:** Pode substituir em muitos lugares. Revisar cada ocorrência!

---

## 7. PADRÃO DE INTEGRAÇÃO DE EVENTOS

### Template para cada `confirm*` função

```javascript
async function confirmAprovarSupervisor() {
  // 1. Validar dados
  if (!validateStep_Supervisor()) {
    showToast('erro', 'Dados inválidos');
    return;
  }

  // 2. Coletar dados da tela
  const dados = coletarDadosSupervisor();

  // 3. Atualizar Firestore
  const novoStatus = 'AGUARDANDO_ADM';
  const novaEtapa = 'adm_vendas';

  try {
    await atualizarSolicitacao(currentSolicitacaoId, {
      status: novoStatus,
      etapaAtual: novaEtapa,
      parecerSupervisor: {
        decisao: 'aprovado',
        ...dados,
        aprovadoEm: new Date(),
        aprovadoPorUid: currentUser.uid,
        aprovadoPorNome: currentUser.nome
      }
    });

    // 4. Adicionar ao histórico
    await adicionarHistorico(currentSolicitacaoId, 'SUPERVISOR_APROVOU', dados, currentUser);

    // 5. Enviar ao Power Automate
    const solicitacao = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
    await enviarEventoPowerAutomate('SUPERVISOR_APROVOU', solicitacao.data());

    // 6. Feedback ao usuário
    showSuccess('Solicitação aprovada com sucesso');
    go('home');

  } catch (error) {
    console.error('Erro ao aprovar:', error);
    showToast('erro', 'Falha ao aprovar: ' + error.message);
  }
}
```

---

## 8. CHECKLIST ANTES DE FAZER DEPLOY

- [ ] Todos os perfis renomeados
- [ ] Todos os steps/etapas renomeados
- [ ] Todos os status atualizados
- [ ] Todas as funções confirm* integradas com histórico
- [ ] Todas as funções confirm* enviam eventos Power Automate
- [ ] Controle de acesso funcionando (perfis veem/editam correto)
- [ ] Histórico é registrado para cada ação
- [ ] Documentos (contrato, NF, relatório) são salvos no Storage
- [ ] Firestore regras estão aplicadas
- [ ] Storage regras estão aplicadas
- [ ] Testes de ponta a ponta passando
- [ ] Sem console errors
- [ ] Sem dependências de dados fake

---

**Próximos Passos:** FASE 12 (Modelagem de Modelos) → FASE 13 (Testes) → FASE 14 (Aceite)
