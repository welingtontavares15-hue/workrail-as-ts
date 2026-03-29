/**
 * ════════════════════════════════════════════════════════════════════════════
 * CONTROLE DE ACESSO POR PERFIL
 * Sistema WORKRAIL — Solicitação de Máquinas AS&TS
 *
 * Responsabilidade:
 * - Validar permissões de visualização e edição
 * - Controlar visibilidade de menus e telas
 * - Bloquear ações indevidas em front-end
 * - Rastrear quem fez cada alteração
 *
 * Nota: Segurança real está nas Firestore Rules. Isso é validação UX/UX.
 *
 * Data: 29/03/2026
 * Versão: 1.0
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── MAPEAMENTO DE PERFIS (CENTRALIZADO) ───────────────────────────────────
const PERFIS_WORKRAIL = {
  super_admin: {
    label: 'Administrador',
    descricao: 'Acesso total. Gerencia usuários, fornecedores, modelos.',
    chip: 'c-admin',
    cor: '#b71c1c'
  },
  vendas: {
    label: 'Vendas',
    descricao: 'Cria solicitações, anexa contrato. Vê apenas suas solicitações.',
    chip: 'c-pending',
    cor: '#e65100'
  },
  supervisor_asts: {
    label: 'Supervisor AS&TS',
    descricao: 'Valida solicitações, define fornecedor e máquina. Vê tudo.',
    chip: 'c-analysis',
    cor: '#1565c0'
  },
  adm_vendas: {
    label: 'ADM Vendas',
    descricao: 'Aprova solicitações, encaminha fornecedor, aciona logística.',
    chip: 'c-approved',
    cor: '#2e7d32'
  },
  fornecedor_ebst: {
    label: 'Fornecedor EBST',
    descricao: 'Anexa NF, informa data de liberação. Vê apenas EBST.',
    chip: 'c-supplier',
    cor: '#4527a0'
  },
  fornecedor_hobart: {
    label: 'Fornecedor Hobart',
    descricao: 'Anexa NF, informa data de liberação. Vê apenas Hobart.',
    chip: 'c-supplier',
    cor: '#4527a0'
  }
};

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Verificar se usuário pode visualizar solicitação
 * ════════════════════════════════════════════════════════════════════════════
 */
function podeVisualizarSolicitacao(solicitacao, userPerfil, userUid) {
  if (!solicitacao || !userPerfil) return false;

  // super_admin vê tudo
  if (userPerfil === 'super_admin') return true;

  // supervisor_asts, adm_vendas veem tudo
  if (userPerfil === 'supervisor_asts' || userPerfil === 'adm_vendas') return true;

  // vendas vê só suas solicitações
  if (userPerfil === 'vendas') {
    return solicitacao.criadoPorUid === userUid;
  }

  // fornecedor_ebst vê só EBST
  if (userPerfil === 'fornecedor_ebst') {
    return solicitacao.dadosAdm?.encaminhadoFornecedor === 'EBST';
  }

  // fornecedor_hobart vê só Hobart
  if (userPerfil === 'fornecedor_hobart') {
    return solicitacao.dadosAdm?.encaminhadoFornecedor === 'Hobart Brasil';
  }

  return false;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Verificar se usuário pode editar uma etapa
 * ════════════════════════════════════════════════════════════════════════════
 */
function podeEditarEtapa(etapaAtual, userPerfil, solicitacao) {
  if (!userPerfil || !etapaAtual) return false;

  // super_admin pode editar tudo
  if (userPerfil === 'super_admin') return true;

  // Validar por etapa
  switch (etapaAtual) {
    case 'solicitacao':
      return userPerfil === 'vendas';

    case 'supervisor':
      return userPerfil === 'supervisor_asts';

    case 'adm_vendas':
      return userPerfil === 'adm_vendas';

    case 'fornecedor':
      // Fornecedor correto conforme definição
      if (solicitacao?.dadosAdm?.encaminhadoFornecedor === 'EBST') {
        return userPerfil === 'fornecedor_ebst';
      }
      if (solicitacao?.dadosAdm?.encaminhadoFornecedor === 'Hobart Brasil') {
        return userPerfil === 'fornecedor_hobart';
      }
      return false;

    case 'logistica':
      return userPerfil === 'adm_vendas';

    case 'data_instalacao':
      return userPerfil === 'supervisor_asts';

    case 'relatorio_final':
      return userPerfil === 'supervisor_asts';

    default:
      return false;
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Obter botões visíveis para uma etapa
 * ════════════════════════════════════════════════════════════════════════════
 */
function getBotoesEtapa(etapaAtual, userPerfil, solicitacao) {
  const botoes = [];

  // Validar acesso
  if (!podeEditarEtapa(etapaAtual, userPerfil, solicitacao)) {
    return botoes; // Retornar vazio se não tem permissão
  }

  switch (etapaAtual) {
    case 'solicitacao':
      botoes.push({
        id: 'btn-enviar-solicitacao',
        texto: 'Enviar Solicitação',
        classe: 'btn-primary',
        funcao: 'confirmEnviarSolicitacao'
      });
      break;

    case 'supervisor':
      botoes.push({
        id: 'btn-aprovar-supervisor',
        texto: 'Aprovar',
        classe: 'btn-primary',
        funcao: 'confirmAprovarSupervisor'
      });
      botoes.push({
        id: 'btn-rejeitar-supervisor',
        texto: 'Rejeitar',
        classe: 'btn-danger',
        funcao: 'confirmRejeitarSupervisor'
      });
      break;

    case 'adm_vendas':
      botoes.push({
        id: 'btn-aprovar-adm',
        texto: 'Aprovar e Encaminhar',
        classe: 'btn-primary',
        funcao: 'confirmExpedicaoADM'
      });
      break;

    case 'fornecedor':
      botoes.push({
        id: 'btn-anexar-nf',
        texto: 'Anexar NF e Confirmar',
        classe: 'btn-primary',
        funcao: 'confirmAnexarNF'
      });
      break;

    case 'logistica':
      botoes.push({
        id: 'btn-acionar-logistica',
        texto: 'Acionar Logística',
        classe: 'btn-primary',
        funcao: 'confirmAcionarLogistica'
      });
      break;

    case 'data_instalacao':
      botoes.push({
        id: 'btn-agendar-instalacao',
        texto: 'Confirmar Data de Instalação',
        classe: 'btn-primary',
        funcao: 'confirmAgendarInstalacao'
      });
      break;

    case 'relatorio_final':
      botoes.push({
        id: 'btn-anexar-relatorio',
        texto: 'Anexar Relatório e Concluir',
        classe: 'btn-primary',
        funcao: 'confirmAnexarRelatorio'
      });
      break;
  }

  return botoes;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Controlar visibilidade de campos por etapa
 * ════════════════════════════════════════════════════════════════════════════
 */
function getCamposVisiveis(etapaAtual, userPerfil) {
  const campos = {
    dados_cliente: false,
    dados_solicitacao: false,
    parecerSupervisor: false,
    dados_adm: false,
    dados_fornecedor: false,
    dados_logistica: false,
    dados_instalacao: false,
    dados_relatorio: false,
    historico: true, // sempre visível
    documentos: true // sempre visível
  };

  if (userPerfil === 'super_admin') {
    // Admin vê tudo
    Object.keys(campos).forEach(k => campos[k] = true);
    return campos;
  }

  // Por etapa/perfil
  switch (etapaAtual) {
    case 'solicitacao':
      if (userPerfil === 'vendas') {
        campos.dados_cliente = true;
        campos.dados_solicitacao = true;
      }
      break;

    case 'supervisor':
      campos.dados_cliente = true;
      campos.dados_solicitacao = true;
      if (userPerfil === 'supervisor_asts') {
        campos.parecerSupervisor = true;
      }
      break;

    case 'adm_vendas':
      campos.dados_cliente = true;
      campos.dados_solicitacao = true;
      campos.parecerSupervisor = true;
      if (userPerfil === 'adm_vendas') {
        campos.dados_adm = true;
      }
      break;

    case 'fornecedor':
      campos.dados_cliente = true;
      campos.dados_solicitacao = true;
      campos.parecerSupervisor = true;
      campos.dados_adm = true;
      if (userPerfil.startsWith('fornecedor_')) {
        campos.dados_fornecedor = true;
      }
      break;

    case 'logistica':
      campos.dados_cliente = true;
      campos.dados_solicitacao = true;
      campos.dados_fornecedor = true;
      if (userPerfil === 'adm_vendas') {
        campos.dados_logistica = true;
      }
      break;

    case 'data_instalacao':
      campos.dados_cliente = true;
      campos.dados_logistica = true;
      if (userPerfil === 'supervisor_asts') {
        campos.dados_instalacao = true;
      }
      break;

    case 'relatorio_final':
      campos.dados_cliente = true;
      campos.dados_logistica = true;
      campos.dados_instalacao = true;
      if (userPerfil === 'supervisor_asts') {
        campos.dados_relatorio = true;
      }
      break;
  }

  return campos;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Controlar visibilidade de menus da sidebar
 * ════════════════════════════════════════════════════════════════════════════
 */
function getMenusVisiveis(userPerfil) {
  const menus = {
    home: true,
    dashboard: false,
    solicitacao: false,
    historico: false,
    pendentes: false,
    notificacoes: false,
    relatorios: false,
    configuracoes: false,
    admin: false
  };

  switch (userPerfil) {
    case 'super_admin':
      Object.keys(menus).forEach(k => menus[k] = true);
      break;

    case 'vendas':
      menus.home = true;
      menus.solicitacao = true;
      menus.historico = true;
      menus.notificacoes = true;
      break;

    case 'supervisor_asts':
      menus.home = true;
      menus.dashboard = true;
      menus.historico = true;
      menus.pendentes = true;
      menus.notificacoes = true;
      break;

    case 'adm_vendas':
      menus.home = true;
      menus.dashboard = true;
      menus.historico = true;
      menus.pendentes = true;
      menus.notificacoes = true;
      menus.relatorios = true;
      break;

    case 'fornecedor_ebst':
    case 'fornecedor_hobart':
      menus.home = true;
      menus.historico = true;
      menus.notificacoes = true;
      break;
  }

  return menus;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Aplicar controle de acesso na interface
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Esta função deve ser chamada quando a solicitação carrega
 * para ocultar/mostrar elementos baseado em permissões
 */
function aplicarControleAcessoUX(solicitacao, userPerfil, userUid) {
  // Verificar acesso básico
  if (!podeVisualizarSolicitacao(solicitacao, userPerfil, userUid)) {
    // Usuário não tem acesso - redirecionar ou mostrar erro
    console.warn('[ACL] Usuário sem acesso a esta solicitação');
    return false;
  }

  // Controlar visibilidade de seções
  const camposVisiveis = getCamposVisiveis(solicitacao.etapaAtual, userPerfil);

  Object.entries(camposVisiveis).forEach(([secao, visivel]) => {
    const elemento = document.querySelector(`[data-secao="${secao}"]`);
    if (elemento) {
      elemento.style.display = visivel ? '' : 'none';
    }
  });

  // Controlar visibilidade de botões
  const botoes = getBotoesEtapa(solicitacao.etapaAtual, userPerfil, solicitacao);

  // Ocultar TODOS os botões de ação
  document.querySelectorAll('[data-tipo="botao-acao"]').forEach(btn => {
    btn.style.display = 'none';
  });

  // Mostrar apenas botões permitidos
  botoes.forEach(botao => {
    const btn = document.getElementById(botao.id);
    if (btn) {
      btn.style.display = '';
    }
  });

  // Desabilitar inputs não permitidos
  if (!podeEditarEtapa(solicitacao.etapaAtual, userPerfil, solicitacao)) {
    document.querySelectorAll('[data-etapa-current] input, [data-etapa-current] select, [data-etapa-current] textarea').forEach(input => {
      input.disabled = true;
    });
  }

  return true;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Obter label do perfil
 * ════════════════════════════════════════════════════════════════════════════
 */
function getPerfilLabel(perfil) {
  return PERFIS_WORKRAIL[perfil]?.label || perfil;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Obter chip CSS do perfil
 * ════════════════════════════════════════════════════════════════════════════
 */
function getPerfilChip(perfil) {
  return PERFIS_WORKRAIL[perfil]?.chip || 'c-pending';
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Registrar auditoria (quem fez o quê)
 * ════════════════════════════════════════════════════════════════════════════
 */
async function registrarAuditoria(tipoAcao, solicitacaoId, userUid, userNome, userPerfil, detalhes = {}) {
  if (!db) return;

  try {
    await db.collection('auditoria').add({
      tipoAcao,
      solicitacaoId,
      userUid,
      userNome,
      userPerfil,
      detalhes,
      timestamp: new Date(),
      ipAddress: await obterIPAddress() // Opcional
    });
  } catch (error) {
    console.error('[AUDIT] Erro ao registrar auditoria:', error);
  }
}

/**
 * FUNÇÃO AUXILIAR: Obter IP do usuário (para auditoria)
 * Usar API externa
 */
async function obterIPAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'desconhecido';
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FUNÇÃO: Validar se ação é permitida (double check)
 * ════════════════════════════════════════════════════════════════════════════
 */
function validarPermissaoAcao(acao, userPerfil, solicitacao, userUid) {
  const permissoes = {
    criar_solicitacao: () => userPerfil === 'vendas',
    aprovar_supervisor: () => userPerfil === 'supervisor_asts',
    rejeitar_supervisor: () => userPerfil === 'supervisor_asts',
    encaminhar_fornecedor: () => userPerfil === 'adm_vendas',
    anexar_nf: () => podeEditarEtapa('fornecedor', userPerfil, solicitacao),
    acionar_logistica: () => userPerfil === 'adm_vendas',
    agendar_instalacao: () => userPerfil === 'supervisor_asts',
    anexar_relatorio: () => userPerfil === 'supervisor_asts',
    deletar_solicitacao: () => userPerfil === 'super_admin',
    editar_usuario: () => userPerfil === 'super_admin',
    deletar_usuario: () => userPerfil === 'super_admin'
  };

  const validacao = permissoes[acao];
  if (!validacao) {
    console.warn('[ACL] Ação desconhecida:', acao);
    return false;
  }

  return validacao();
}

// Exportar (se usar módulos)
// module.exports = {
//   PERFIS_WORKRAIL,
//   podeVisualizarSolicitacao,
//   podeEditarEtapa,
//   getBotoesEtapa,
//   getCamposVisiveis,
//   getMenusVisiveis,
//   aplicarControleAcessoUX,
//   getPerfilLabel,
//   getPerfilChip,
//   registrarAuditoria,
//   validarPermissaoAcao
// };
