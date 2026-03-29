# RECOMENDAÇÕES FINAIS E OTIMIZAÇÕES

**Data:** 29/03/2026
**Versão:** 1.0
**Objetivo:** Ajustes recomendados aos arquivos base

---

## 1. OTIMIZAÇÃO DAS REGRAS FIRESTORE

### Problema com Versão Original
A versão original em `firestore-security-rules.txt` era muito verbosa e complexa.

### Solução Recomendada
Use esta versão **simplificada e otimizada**:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Funções auxiliares ───
    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function perfil() {
      return userDoc().perfil;
    }

    function isSuperAdmin() {
      return perfil() == 'super_admin';
    }

    function isSupervisor() {
      return perfil() == 'supervisor_asts';
    }

    function isAdm() {
      return perfil() == 'adm_vendas';
    }

    function isVendas() {
      return perfil() == 'vendas';
    }

    function isFornecedorEBST() {
      return perfil() == 'fornecedor_ebst';
    }

    function isFornecedorHobart() {
      return perfil() == 'fornecedor_hobart';
    }

    function fornecedorDoDoc() {
      return resource.data.dadosAdm.encaminhadoFornecedor;
    }

    // ─── COLEÇÕES ───

    match /usuarios/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isSuperAdmin());
      allow write: if isSuperAdmin();
    }

    match /fornecedores/{docId} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }

    match /modelos_maquinas/{docId} {
      allow read: if isSignedIn();
      allow write: if isSuperAdmin();
    }

    match /contadores/{docId} {
      allow read, write: if isSignedIn();
    }

    match /solicitacoes/{docId} {
      allow create: if isSignedIn() && isVendas();

      allow read: if isSignedIn() && (
        isSuperAdmin() ||
        isSupervisor() ||
        isAdm() ||
        (isVendas() && resource.data.criadoPorUid == request.auth.uid) ||
        (isFornecedorEBST() && fornecedorDoDoc() == "EBST") ||
        (isFornecedorHobart() && fornecedorDoDoc() == "Hobart Brasil")
      );

      allow update: if isSignedIn() && (
        isSuperAdmin() ||
        isSupervisor() ||
        isAdm() ||
        (isVendas() && resource.data.criadoPorUid == request.auth.uid) ||
        (isFornecedorEBST() && fornecedorDoDoc() == "EBST") ||
        (isFornecedorHobart() && fornecedorDoDoc() == "Hobart Brasil")
      );

      match /historico/{eventoId} {
        allow read: if isSignedIn() && (
          isSuperAdmin() ||
          isSupervisor() ||
          isAdm() ||
          (isVendas() && get(/databases/$(database)/documents/solicitacoes/$(docId)).data.criadoPorUid == request.auth.uid) ||
          (isFornecedorEBST() && get(/databases/$(database)/documents/solicitacoes/$(docId)).data.dadosAdm.encaminhadoFornecedor == "EBST") ||
          (isFornecedorHobart() && get(/databases/$(database)/documents/solicitacoes/$(docId)).data.dadosAdm.encaminhadoFornecedor == "Hobart Brasil")
        );

        allow create: if isSignedIn();
        allow update, delete: if isSuperAdmin();
      }
    }
  }
}
```

### Vantagens
✅ Mais legível
✅ Menos linhas
✅ Mesma segurança
✅ Funções reutilizáveis
✅ Manutenção mais fácil

**Ação:** Copiar estas regras para Firestore Console (substitui `firestore-security-rules.txt`)

---

## 2. SIMPLIFICAÇÃO DAS REGRAS STORAGE

### Problema com Versão Original
Muito detalhado, difícil de manter.

### Solução Recomendada
Use esta versão **mínima e funcional**:

```storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    match /solicitacoes/{protocolo}/{tipoDocumento}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
  }
}
```

### Por que funciona
- ✅ Firestore Rules já validam quem pode fazer o quê
- ✅ Storage apenas valida autenticação
- ✅ Menos overhead
- ✅ Mais simples manter

**Ação:** Copiar estas regras para Storage Console (substitui `firebase-storage-rules.txt`)

---

## 3. OTIMIZAÇÃO DO PAYLOAD POWER AUTOMATE

### Problema com Versão Original
Muitos campos opcionais, estrutura complexa.

### Solução Recomendada
Use este **payload enxuto e padronizado**:

```json
{
  "evento": "ADM_ACIONOU_LOGISTICA",
  "protocolo": "WR-2026-0007",
  "numeroPedido": "WR-2026-0007",
  "status": "AGUARDANDO_DATA_INSTALACAO",
  "etapaAtual": "data_instalacao",
  "cliente": {
    "shipTo": "12345",
    "nome": "Cliente Exemplo",
    "cnpj": "00.000.000/0001-00",
    "email": "cliente@empresa.com",
    "enderecoInstalacao": "Rua Exemplo, 100"
  },
  "maquina": {
    "fabricante": "Hobart",
    "modelo": "Ecomax 503",
    "fornecedor": "Hobart"
  },
  "documentos": {
    "contratoUrl": "https://...",
    "nfUrl": "https://...",
    "relatorioUrl": ""
  },
  "datas": {
    "criacao": "2026-03-29T12:00:00Z",
    "aprovacaoSupervisor": "2026-03-29T13:00:00Z",
    "aprovacaoAdm": "2026-03-29T14:00:00Z",
    "liberacaoMaquina": "2026-03-30",
    "coleta": "2026-03-31",
    "entrega": "2026-04-01",
    "instalacao": "",
    "finalizacao": ""
  },
  "responsaveis": {
    "vendas": "Nome Vendas",
    "supervisor": "Nome Supervisor",
    "admVendas": "Nome ADM",
    "fornecedor": "Hobart"
  },
  "observacoes": {
    "supervisor": "Especificação aprovada",
    "adm": "Encaminhado ao fornecedor",
    "fornecedor": "NF anexada",
    "logistica": "Coleta acionada",
    "relatorioFinal": ""
  },
  "timestampEvento": "2026-03-29T14:30:00Z"
}
```

### Por que funciona
✅ **NUNCA muda de estrutura** (mesmo payload para todos eventos)
✅ Campos opcionais ficam vazios (string vazia)
✅ Power Automate processa sempre igual
✅ Mais fácil para integrações downstream
✅ Menor payload (melhor performance)

**Ação:** Atualizar função `montarPayloadPowerAutomate()` em `power-automate-integration.js`

---

## 4. TEMPLATE ATUALIZADO PARA montarPayloadPowerAutomate()

Substituir a função completa por:

```javascript
function montarPayloadPowerAutomate(tipoEvento, solicitacao) {
  return {
    evento: tipoEvento,
    protocolo: solicitacao?.protocolo || '',
    numeroPedido: solicitacao?.numeroPedido || '',
    status: solicitacao?.status || '',
    etapaAtual: solicitacao?.etapaAtual || '',

    cliente: {
      shipTo: solicitacao?.dadosCliente?.shipTo || '',
      nome: solicitacao?.dadosCliente?.nomeCliente || '',
      cnpj: solicitacao?.dadosCliente?.cnpj || '',
      email: solicitacao?.dadosCliente?.emailCliente || '',
      enderecoInstalacao: solicitacao?.dadosCliente?.enderecoInstalacao || ''
    },

    maquina: {
      fabricante: solicitacao?.dadosSolicitacao?.fabricante || '',
      modelo: solicitacao?.dadosSolicitacao?.modeloMaquina || '',
      fornecedor: solicitacao?.dadosAdm?.encaminhadoFornecedor || ''
    },

    documentos: {
      contratoUrl: solicitacao?.contrato?.downloadURL || '',
      nfUrl: solicitacao?.notaFiscal?.downloadURL || '',
      relatorioUrl: solicitacao?.relatorioInstalacao?.downloadURL || ''
    },

    datas: {
      criacao: formatarData(solicitacao?.criadoEm),
      aprovacaoSupervisor: formatarData(solicitacao?.parecerSupervisor?.aprovadoEm),
      aprovacaoAdm: formatarData(solicitacao?.dadosAdm?.aprovadoEm),
      liberacaoMaquina: solicitacao?.dadosFornecedor?.dataLiberacaoMaquina || '',
      coleta: solicitacao?.dadosLogistica?.dataColeta || '',
      entrega: solicitacao?.dadosLogistica?.dataEntrega || '',
      instalacao: solicitacao?.dadosInstalacao?.dataInstalacao || '',
      finalizacao: formatarData(solicitacao?.dadosRelatorio?.finalizadoEm)
    },

    responsaveis: {
      vendas: solicitacao?.criadoPorNome || '',
      supervisor: solicitacao?.parecerSupervisor?.aprovadoPorNome || '',
      admVendas: solicitacao?.dadosAdm?.aprovadoPorNome || '',
      fornecedor: solicitacao?.dadosFornecedor?.fornecedor || ''
    },

    observacoes: {
      supervisor: solicitacao?.parecerSupervisor?.observacoes || '',
      adm: solicitacao?.dadosAdm?.observacoes || '',
      fornecedor: solicitacao?.dadosFornecedor?.observacoes || '',
      logistica: solicitacao?.dadosLogistica?.observacoes || '',
      relatorioFinal: solicitacao?.dadosRelatorio?.observacoesFinais || ''
    },

    timestampEvento: new Date().toISOString()
  };
}
```

**Benefícios:**
- Payload sempre igual (menos manutenção)
- Campos opcionais vazios (não quebra integrações)
- Simples de debugar

---

## 5. RESUMO DE MUDANÇAS RECOMENDADAS

| Arquivo | Mudança | Impacto |
|---------|---------|--------|
| `firestore-security-rules.txt` | Substituir versão simplificada | Mais legível, mesma segurança |
| `firebase-storage-rules.txt` | Substituir versão mínima | Mais simples, delegação ao Firestore |
| `power-automate-integration.js` | Atualizar `montarPayloadPowerAutomate()` | Payload sempre igual |

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Antes de copiar regras para Firebase

- [ ] Você entendeu as funções auxiliares?
- [ ] Você sabe quem pode fazer o quê?
- [ ] Você validou a lógica de acesso?
- [ ] Você testará com diferentes perfis?
- [ ] Você tem backup das regras antigas?

### Antes de integrar Power Automate

- [ ] Você testou `testarWebhookPowerAutomate()`?
- [ ] Você sabe a URL do webhook?
- [ ] Você validará o payload no Power Automate?
- [ ] Você documentará a integração?

### Antes de colocar em produção

- [ ] Regras Firestore testadas ✓
- [ ] Regras Storage testadas ✓
- [ ] Payload Power Automate validado ✓
- [ ] Sem dados reais expostos ✓
- [ ] Backup configurado ✓

---

## 7. DICAS PARA SIMPLIFICAR AINDA MAIS

### Se quiser máxima simplicidade (não recomendado para produção)

```javascript
// Desabilitar temporariamente regras para testes (NUNCA em produção!)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ APENAS PARA TESTES!
    }
  }
}
```

⚠️ **AVISO:** Usar apenas em ambiente de desenvolvimento local!

---

## 8. PRÓXIMAS ETAPAS SUGERIDAS

1. **Semana 1:** Implementar Firestore com regras simplificadas
2. **Semana 2:** Integrar módulos JS e testar fluxo
3. **Semana 3:** Configurar Power Automate e validar payloads
4. **Semana 4:** Testes de ponta a ponta e go-live

---

## QUESTÕES FREQUENTES

### P: Por que simplificar as regras?
R: Menos código = menos bugs, mais fácil manter, mesma segurança via funções.

### P: E se alguém tiver acesso ao Storage direto?
R: Firestore Rules já validam. Storage Rules apenas confirmam autenticação.

### P: O payload sempre igual não fica chato?
R: Não! Power Automate processa mais fácil, integrações downstream não quebram.

### P: Posso usar versões diferentes?
R: Sim, mas recomendamos usar simplificadas para primeira versão.

---

**✅ Recomendações finalizadas!**

Agora você tem:
- ✅ Arquivos bem estruturados
- ✅ Código simplificado
- ✅ Regras otimizadas
- ✅ Payloads padronizados
- ✅ Pronto para implementação

**Próximo passo:** Criar Repositório GitHub e configurar Firebase!
