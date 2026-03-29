/**
 * ════════════════════════════════════════════════════════════════════════════
 * INTEGRAÇÃO POWER AUTOMATE
 * Sistema WORKRAIL — Solicitação de Máquinas AS&TS
 *
 * Responsabilidade: Enviar eventos de solicitações para Power Automate
 * Webhook centralizado para todas as etapas do fluxo
 *
 * Data: 29/03/2026
 * Versão: 1.0
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────
// Substitua pela URL do webhook do seu Power Automate
const POWER_AUTOMATE_WEBHOOK_URL = 'https://prod-123.westus.logic.azure.com:443/workflows/...';

// Eventos que devem ser enviados para Power Automate
const POWER_AUTOMATE_EVENTOS = [
  'SOLICITACAO_CRIADA',
  'SUPERVISOR_APROVOU',
  'SUPERVISOR_REJEITOU',
  'ADM_ENCAMINHOU_FORNECEDOR',
  'FORNECEDOR_ANEXOU_NF',
  'ADM_ACIONOU_LOGISTICA',
  'SUPERVISOR_INFORMOU_DATA_INSTALACAO',
  'SUPERVISOR_ANEXOU_RELATORIO',
  'PROCESSO_FINALIZADO'
];

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO PRINCIPAL: Enviar Evento para Power Automate
 * ════════════════════════════════════════════════════════════════════════════
 *
 * @param {string} tipoEvento - Tipo de evento (ex: SOLICITACAO_CRIADA)
 * @param {object} solicitacao - Documento completo da solicitação (Firestore doc)
 *
 * Exemplo de uso:
 *   enviarEventoPowerAutomate('SOLICITACAO_CRIADA', solicitacaoObj);
 */
async function enviarEventoPowerAutomate(tipoEvento, solicitacao) {
  // Validar se é um evento que deve ser enviado
  if (!POWER_AUTOMATE_EVENTOS.includes(tipoEvento)) {
    console.warn('[PA] Evento não mapeado para Power Automate:', tipoEvento);
    return; // Silenciosamente ignorar eventos não mapeados
  }

  try {
    console.log('[PA] Preparando envio de evento:', tipoEvento);

    // Montar payload standardizado
    const payload = montarPayloadPowerAutomate(tipoEvento, solicitacao);

    // Log do payload (para debug)
    console.log('[PA] Payload:', JSON.stringify(payload, null, 2));

    // Enviar via fetch (sem bloquear UI)
    // Usar keepalive para garantir envio mesmo se página fecha
    const response = await fetch(POWER_AUTOMATE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    });

    if (response.ok) {
      console.log('[PA] ✓ Evento enviado com sucesso:', tipoEvento);
      return true;
    } else {
      console.error('[PA] ✗ Falha ao enviar evento. HTTP', response.status);
      // Não fazer retry automático - deixar para Power Automate ou logs
      return false;
    }

  } catch (error) {
    console.error('[PA] ✗ Erro ao enviar evento:', error);
    // Em produção, registrar em logs do Firebase
    if (db) {
      try {
        await db.collection('logs_power_automate').add({
          tipoEvento,
          protocolo: solicitacao?.protocolo || 'DESCONHECIDO',
          erro: error.message,
          timestamp: new Date(),
          status: 'erro'
        });
      } catch (logError) {
        console.error('[PA] Erro ao registrar log:', logError);
      }
    }
    return false;
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * MONTAR PAYLOAD STANDARDIZADO
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Formato único para TODOS os eventos, preenchendo campos conforme disponível
 */
function montarPayloadPowerAutomate(tipoEvento, solicitacao) {
  return {
    // ─── INFORMAÇÕES DO EVENTO ──────────────────────────────────────────────
    evento: tipoEvento,
    timestampEvento: new Date().toISOString(),

    // ─── IDENTIFICADORES ────────────────────────────────────────────────────
    protocolo: solicitacao?.protocolo || '',
    numeroPedido: solicitacao?.numeroPedido || '',
    status: solicitacao?.status || '',
    etapaAtual: solicitacao?.etapaAtual || '',

    // ─── DADOS DO CLIENTE ───────────────────────────────────────────────────
    cliente: {
      shipTo: solicitacao?.dadosCliente?.shipTo || '',
      nome: solicitacao?.dadosCliente?.nomeCliente || '',
      cnpj: solicitacao?.dadosCliente?.cnpj || '',
      email: solicitacao?.dadosCliente?.emailCliente || '',
      enderecoInstalacao: solicitacao?.dadosCliente?.enderecoInstalacao || ''
    },

    // ─── DADOS DA MÁQUINA ───────────────────────────────────────────────────
    maquina: {
      fabricante: solicitacao?.dadosSolicitacao?.fabricante || '',
      modelo: solicitacao?.dadosSolicitacao?.modeloMaquina || '',
      fornecedor: solicitacao?.dadosAdm?.encaminhadoFornecedor || ''
    },

    // ─── DOCUMENTOS (URLs) ──────────────────────────────────────────────────
    documentos: {
      contratoUrl: solicitacao?.contrato?.downloadURL || '',
      nfUrl: solicitacao?.notaFiscal?.downloadURL || '',
      relatorioUrl: solicitacao?.relatorioInstalacao?.downloadURL || ''
    },

    // ─── DATAS IMPORTANTES ──────────────────────────────────────────────────
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

    // ─── RESPONSÁVEIS ──────────────────────────────────────────────────────
    responsaveis: {
      vendas: solicitacao?.criadoPorNome || '',
      supervisor: solicitacao?.parecerSupervisor?.aprovadoPorNome || '',
      admVendas: solicitacao?.dadosAdm?.aprovadoPorNome || '',
      fornecedor: solicitacao?.dadosFornecedor?.fornecedor || ''
    },

    // ─── OBSERVAÇÕES/COMENTÁRIOS ───────────────────────────────────────────
    observacoes: {
      supervisor: solicitacao?.parecerSupervisor?.observacoes || '',
      adm: solicitacao?.dadosAdm?.observacoes || '',
      fornecedor: solicitacao?.dadosFornecedor?.observacoes || '',
      logistica: solicitacao?.dadosLogistica?.observacoes || '',
      relatorioFinal: solicitacao?.dadosRelatorio?.observacoesFinais || ''
    },

    // ─── DETALHES ADICIONAIS ───────────────────────────────────────────────
    detalhes: {
      tipoSolicitacao: solicitacao?.dadosSolicitacao?.tipoSolicitacao || '',
      refeicoesDia: solicitacao?.dadosSolicitacao?.refeicoesDia || 0,
      refeicoesHora: solicitacao?.dadosSolicitacao?.refeicoesHora || 0,
      mesaNecessaria: solicitacao?.dadosSolicitacao?.mesaNecessaria || false,
      detergente: solicitacao?.dadosSolicitacao?.detergente || '',
      secante: solicitacao?.dadosSolicitacao?.secante || ''
    }
  };
}

/**
 * FUNÇÃO AUXILIAR: Formatar timestamp para ISO string
 */
function formatarData(timestamp) {
  if (!timestamp) return '';
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  if (timestamp.toDate) { // Firebase Timestamp
    return timestamp.toDate().toISOString();
  }
  return '';
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * EXEMPLOS DE COMO CHAMAR ESTA FUNÇÃO NO FLUXO
 * ════════════════════════════════════════════════════════════════════════════

 // ETAPA 1: Quando vendas envia solicitação
 async function confirmEnviarSolicitacao() {
   // ... validar dados ...
   const solId = await criarSolicitacao(dados);
   const sol = await db.collection('solicitacoes').doc(solId).get();
   await enviarEventoPowerAutomate('SOLICITACAO_CRIADA', sol.data());
 }

 // ETAPA 2: Quando supervisor aprova
 async function confirmAprovarSupervisor() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('SUPERVISOR_APROVOU', sol.data());
 }

 // ETAPA 2: Quando supervisor rejeita
 async function confirmRejeitarSupervisor() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('SUPERVISOR_REJEITOU', sol.data());
 }

 // ETAPA 3: Quando ADM encaminha ao fornecedor
 async function confirmExpedicaoADM() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('ADM_ENCAMINHOU_FORNECEDOR', sol.data());
 }

 // ETAPA 4: Quando fornecedor anexa NF
 async function confirmAnexarNF() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('FORNECEDOR_ANEXOU_NF', sol.data());
 }

 // ETAPA 5: Quando ADM aciona logística
 async function confirmAcionarLogistica() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('ADM_ACIONOU_LOGISTICA', sol.data());
 }

 // ETAPA 6: Quando supervisor informa data de instalação
 async function confirmAgendarInstalacao() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('SUPERVISOR_INFORMOU_DATA_INSTALACAO', sol.data());
 }

 // ETAPA 7: Quando supervisor anexa relatório
 async function confirmAnexarRelatorio() {
   // ... atualizar status ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('SUPERVISOR_ANEXOU_RELATORIO', sol.data());
 }

 // ETAPA 7: Quando processo finaliza
 async function finalizarProcesso() {
   // ... atualizar status para CONCLUIDA ...
   const sol = await db.collection('solicitacoes').doc(currentSolicitacaoId).get();
   await enviarEventoPowerAutomate('PROCESSO_FINALIZADO', sol.data());
 }

 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * FUNÇÃO AUXILIAR: Registrar evento em log local (para debug)
 * Útil durante desenvolvimento
 */
async function registrarEventoLog(tipoEvento, solicitacao, sucesso) {
  if (!db) return;

  try {
    await db.collection('logs_power_automate').add({
      tipoEvento,
      protocolo: solicitacao?.protocolo,
      numeroPedido: solicitacao?.numeroPedido,
      status: solicitacao?.status,
      sucesso,
      timestamp: new Date(),
      userUid: currentUser?.uid,
      userPerfil: currentUser?.perfil
    });
  } catch (error) {
    console.error('[LOG] Erro ao registrar evento:', error);
  }
}

/**
 * FUNÇÃO AUXILIAR: Testar conexão com Power Automate
 * Use no console para validar webhook
 */
async function testarWebhookPowerAutomate() {
  const payloadTeste = {
    evento: 'TESTE',
    protocolo: 'WR-2026-0000',
    status: 'TESTE',
    timestampEvento: new Date().toISOString(),
    mensagem: 'Teste de conexão com Power Automate'
  };

  console.log('[PA-TEST] Enviando teste de webhook...');

  try {
    const response = await fetch(POWER_AUTOMATE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTeste),
      keepalive: true
    });

    if (response.ok) {
      console.log('[PA-TEST] ✓ Webhook está respondendo corretamente');
      return true;
    } else {
      console.error('[PA-TEST] ✗ Webhook retornou erro HTTP', response.status);
      return false;
    }
  } catch (error) {
    console.error('[PA-TEST] ✗ Erro ao conectar ao webhook:', error);
    return false;
  }
}

// Exportar para uso em módulos
// module.exports = {
//   enviarEventoPowerAutomate,
//   montarPayloadPowerAutomate,
//   testarWebhookPowerAutomate
// };
