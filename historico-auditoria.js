/**
 * ════════════════════════════════════════════════════════════════════════════
 * HISTÓRICO E AUDITORIA
 * Sistema WORKRAIL — Solicitação de Máquinas AS&TS
 *
 * Responsabilidade:
 * - Registrar cada evento (ação) que acontece em uma solicitação
 * - Manter histórico imutável (append-only)
 * - Rastrear quem fez o quê e quando
 * - Preparar dados para Power Automate
 *
 * Estrutura: solicitacoes/{docId}/historico/{eventoId}
 *
 * Data: 29/03/2026
 * Versão: 1.0
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── TIPOS DE EVENTOS POSSÍVEIS ────────────────────────────────────────────
const TIPOS_EVENTO = {
  SOLICITACAO_CRIADA: 'SOLICITACAO_CRIADA',
  SUPERVISOR_APROVOU: 'SUPERVISOR_APROVOU',
  SUPERVISOR_REJEITOU: 'SUPERVISOR_REJEITOU',
  ADM_APROVOU: 'ADM_APROVOU',
  ADM_ENCAMINHOU_FORNECEDOR: 'ADM_ENCAMINHOU_FORNECEDOR',
  FORNECEDOR_ANEXOU_NF: 'FORNECEDOR_ANEXOU_NF',
  ADM_ACIONOU_LOGISTICA: 'ADM_ACIONOU_LOGISTICA',
  SUPERVISOR_INFORMOU_DATA_INSTALACAO: 'SUPERVISOR_INFORMOU_DATA_INSTALACAO',
  SUPERVISOR_ANEXOU_RELATORIO: 'SUPERVISOR_ANEXOU_RELATORIO',
  PROCESSO_FINALIZADO: 'PROCESSO_FINALIZADO'
};

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO PRINCIPAL: Adicionar Evento ao Histórico
 * ════════════════════════════════════════════════════════════════════════════
 *
 * @param {string} solicitacaoId - ID do documento Firestore
 * @param {string} tipoEvento - Tipo de evento (vide TIPOS_EVENTO)
 * @param {object} dados - Dados específicos do evento
 * @param {object} user - Dados do usuário (uid, nome, perfil)
 *
 * Exemplo:
 *   await adicionarHistorico('doc123', 'SUPERVISOR_APROVOU', {
 *     fornecedorDefinido: 'EBST',
 *     especificacaoMaquina: 'HD-200'
 *   }, currentUser);
 */
async function adicionarHistorico(solicitacaoId, tipoEvento, dados = {}, user) {
  if (!db) {
    console.error('[HIST] Firestore não inicializado');
    return null;
  }

  if (!solicitacaoId || !tipoEvento || !user?.uid) {
    console.error('[HIST] Parâmetros inválidos');
    return null;
  }

  try {
    // Validar se evento é válido
    if (!Object.values(TIPOS_EVENTO).includes(tipoEvento)) {
      console.warn('[HIST] Tipo de evento desconhecido:', tipoEvento);
    }

    // Obter documento atual para validar
    const solRef = db.collection('solicitacoes').doc(solicitacaoId);
    const solSnapshot = await solRef.get();

    if (!solSnapshot.exists) {
      console.error('[HIST] Solicitação não encontrada:', solicitacaoId);
      return null;
    }

    const solicitacao = solSnapshot.data();

    // Definir transição de etapas e status
    const { etapaDestino, statusResultante } = definirTransicao(tipoEvento, solicitacao.etapaAtual);

    // Montar documento do evento
    const evento = {
      tipoEvento,
      descricao: gerarDescricaoEvento(tipoEvento, user.nome, dados),
      etapaOrigem: solicitacao.etapaAtual || '',
      etapaDestino,
      statusResultante,
      executadoPorUid: user.uid,
      executadoPorNome: user.nome || 'Desconhecido',
      executadoPorPerfil: user.perfil || 'desconhecido',
      dataEvento: new Date(), // Será convertido para serverTimestamp() pelo Firebase
      payloadResumo: montarPayloadResumo(tipoEvento, solicitacao, dados)
    };

    // Adicionar à subcoleção histórico
    const historicoRef = await solRef.collection('historico').add(evento);

    // Registrar em logs (opcional)
    console.log('[HIST] Evento registrado:', {
      solicitacaoId,
      eventoId: historicoRef.id,
      tipoEvento,
      usuario: user.nome
    });

    return historicoRef.id;

  } catch (error) {
    console.error('[HIST] Erro ao adicionar histórico:', error);
    throw error;
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO AUXILIAR: Definir transição de etapa e status
 * ════════════════════════════════════════════════════════════════════════════
 */
function definirTransicao(tipoEvento, etapaAtual) {
  const transicoes = {
    SOLICITACAO_CRIADA: {
      etapaDestino: 'supervisor',
      statusResultante: 'AGUARDANDO_SUPERVISOR'
    },
    SUPERVISOR_APROVOU: {
      etapaDestino: 'adm_vendas',
      statusResultante: 'AGUARDANDO_ADM'
    },
    SUPERVISOR_REJEITOU: {
      etapaDestino: 'solicitacao', // Volta para vendas ajustar
      statusResultante: 'REJEITADA_SUPERVISOR'
    },
    ADM_ENCAMINHOU_FORNECEDOR: {
      etapaDestino: 'fornecedor',
      statusResultante: 'EM_PREPARACAO_FORNECEDOR'
    },
    FORNECEDOR_ANEXOU_NF: {
      etapaDestino: 'logistica',
      statusResultante: 'NF_ANEXADA_AGUARDANDO_LOGISTICA'
    },
    ADM_ACIONOU_LOGISTICA: {
      etapaDestino: 'data_instalacao',
      statusResultante: 'AGUARDANDO_DATA_INSTALACAO'
    },
    SUPERVISOR_INFORMOU_DATA_INSTALACAO: {
      etapaDestino: 'relatorio_final',
      statusResultante: 'AGUARDANDO_RELATORIO_FINAL'
    },
    SUPERVISOR_ANEXOU_RELATORIO: {
      etapaDestino: 'concluido',
      statusResultante: 'CONCLUIDA'
    },
    PROCESSO_FINALIZADO: {
      etapaDestino: 'concluido',
      statusResultante: 'CONCLUIDA'
    }
  };

  const transicao = transicoes[tipoEvento];
  return transicao || { etapaDestino: etapaAtual, statusResultante: '' };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO AUXILIAR: Gerar descrição legível do evento
 * ════════════════════════════════════════════════════════════════════════════
 */
function gerarDescricaoEvento(tipoEvento, userName, dados) {
  const descricoes = {
    SOLICITACAO_CRIADA: `Solicitação criada por ${userName}`,
    SUPERVISOR_APROVOU: `Aprovado por Supervisor ${userName} para ${dados.fornecedorDefinido || 'fornecedor não definido'}`,
    SUPERVISOR_REJEITOU: `Rejeitado por Supervisor ${userName}. Motivo: ${dados.motivo || 'não informado'}`,
    ADM_ENCAMINHOU_FORNECEDOR: `Encaminhado ao fornecedor ${dados.fornecedor || ''} por ADM ${userName}`,
    FORNECEDOR_ANEXOU_NF: `NF ${dados.numeroNF || ''} anexada por fornecedor`,
    ADM_ACIONOU_LOGISTICA: `Logística acionada por ADM ${userName} para coleta em ${dados.dataColeta || ''}`,
    SUPERVISOR_INFORMOU_DATA_INSTALACAO: `Data de instalação informada como ${dados.dataInstalacao || ''} por ${userName}`,
    SUPERVISOR_ANEXOU_RELATORIO: `Relatório de instalação anexado por ${userName}`,
    PROCESSO_FINALIZADO: `Processo finalizado em ${new Date().toLocaleDateString('pt-BR')}`
  };

  return descricoes[tipoEvento] || `Evento: ${tipoEvento}`;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO AUXILIAR: Montar resumo do payload
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Armazena dados relevantes do evento no histórico para referência rápida
 */
function montarPayloadResumo(tipoEvento, solicitacao, dados) {
  const resumo = {
    protocolo: solicitacao?.protocolo,
    numeroPedido: solicitacao?.numeroPedido,
    cliente: solicitacao?.dadosCliente?.nomeCliente,
    maquina: solicitacao?.dadosSolicitacao?.modeloMaquina
  };

  // Adicionar dados específicos por evento
  switch (tipoEvento) {
    case 'SUPERVISOR_APROVOU':
      resumo.fornecedorDefinido = dados.fornecedorDefinido;
      resumo.especificacaoMaquina = dados.especificacaoMaquina;
      break;

    case 'ADM_ENCAMINHOU_FORNECEDOR':
      resumo.fornecedor = dados.fornecedor;
      break;

    case 'FORNECEDOR_ANEXOU_NF':
      resumo.numeroNF = dados.numeroNF;
      resumo.dataLiberacao = dados.dataLiberacaoMaquina;
      break;

    case 'ADM_ACIONOU_LOGISTICA':
      resumo.dataColeta = dados.dataColeta;
      resumo.dataEntrega = dados.dataEntrega;
      break;

    case 'SUPERVISOR_INFORMOU_DATA_INSTALACAO':
      resumo.dataInstalacao = dados.dataInstalacao;
      break;
  }

  return resumo;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Carregar histórico da solicitação
 * ════════════════════════════════════════════════════════════════════════════
 *
 * @param {string} solicitacaoId - ID do documento
 * @returns {array} Array de eventos ordenados por data
 */
async function carregarHistoricoFirebase(solicitacaoId) {
  if (!db) {
    console.error('[HIST] Firestore não inicializado');
    return [];
  }

  try {
    const snapshot = await db
      .collection('solicitacoes')
      .doc(solicitacaoId)
      .collection('historico')
      .orderBy('dataEvento', 'asc')
      .get();

    if (snapshot.empty) {
      console.log('[HIST] Nenhum histórico encontrado');
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Converter timestamp para Date se necessário
      dataEvento: doc.data().dataEvento?.toDate?.() || doc.data().dataEvento
    }));

  } catch (error) {
    console.error('[HIST] Erro ao carregar histórico:', error);
    return [];
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Renderizar histórico na tela
 * ════════════════════════════════════════════════════════════════════════════
 */
function renderizarHistorico(eventos, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (!eventos || eventos.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum evento registrado ainda</div>';
    return;
  }

  const html = eventos.map((evento, index) => `
    <div class="historico-item">
      <div class="hist-marker">
        <div class="hist-number">${index + 1}</div>
        ${index < eventos.length - 1 ? '<div class="hist-line"></div>' : ''}
      </div>
      <div class="hist-content">
        <div class="hist-header">
          <span class="hist-tipo">${evento.tipoEvento}</span>
          <span class="hist-data">${formatarData(evento.dataEvento)}</span>
        </div>
        <div class="hist-descricao">${evento.descricao}</div>
        <div class="hist-usuario">Por: <strong>${evento.executadoPorNome}</strong> (${evento.executadoPorPerfil})</div>
        ${evento.payloadResumo ? `<div class="hist-resumo"><pre>${JSON.stringify(evento.payloadResumo, null, 2)}</pre></div>` : ''}
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO AUXILIAR: Formatar data
 * ════════════════════════════════════════════════════════════════════════════
 */
function formatarData(data) {
  if (!data) return '';
  if (typeof data === 'number') {
    data = new Date(data);
  }
  return new Date(data).toLocaleString('pt-BR');
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Obter estatísticas do histórico
 * ════════════════════════════════════════════════════════════════════════════
 */
function obterEstatisticasHistorico(eventos) {
  const stats = {
    totalEventos: eventos.length,
    primeiroEvento: eventos[0]?.dataEvento,
    ultimoEvento: eventos[eventos.length - 1]?.dataEvento,
    usuariosEnvolvidos: new Set(eventos.map(e => e.executadoPorNome)).size,
    eventosPorTipo: {}
  };

  eventos.forEach(evento => {
    stats.eventosPorTipo[evento.tipoEvento] = (stats.eventosPorTipo[evento.tipoEvento] || 0) + 1;
  });

  return stats;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Exportar histórico em CSV/JSON
 * ════════════════════════════════════════════════════════════════════════════
 */
function exportarHistorico(eventos, formato = 'json') {
  if (formato === 'json') {
    const json = JSON.stringify(eventos, null, 2);
    baixarArquivo(json, 'historico.json', 'application/json');
  } else if (formato === 'csv') {
    const csv = eventos.map(e => [
      e.tipoEvento,
      e.executadoPorNome,
      e.executadoPorPerfil,
      formatarData(e.dataEvento),
      e.descricao
    ].join(';')).join('\n');

    const header = 'Evento;Usuário;Perfil;Data;Descrição\n';
    baixarArquivo(header + csv, 'historico.csv', 'text/csv;charset=utf-8');
  }
}

/**
 * FUNÇÃO AUXILIAR: Baixar arquivo
 */
function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

// Exportar (se usar módulos)
// module.exports = {
//   TIPOS_EVENTO,
//   adicionarHistorico,
//   carregarHistoricoFirebase,
//   renderizarHistorico,
//   obterEstatisticasHistorico,
//   exportarHistorico
// };
