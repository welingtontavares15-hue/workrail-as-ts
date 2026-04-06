'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const POWER_AUTOMATE_CONFIG_DOC = 'power_automate';
const SHAREPOINT_SYNC_EVENT = 'WORKRAIL_SHAREPOINT_SYNC';
const SUPPORTED_DOCUMENT_TYPES = new Set([
  'CONTRATO',
  'NOTA_FISCAL',
  'RELATORIO_INSTALACAO'
]);

const DOCUMENT_TYPE_LABELS = {
  CONTRATO: 'Contrato',
  NOTA_FISCAL: 'Nota Fiscal',
  RELATORIO_INSTALACAO: 'Relatorio de Instalacao'
};

const DOCUMENT_TYPE_FOLDERS = {
  CONTRATO: 'Contratos',
  NOTA_FISCAL: 'Notas Fiscais',
  RELATORIO_INSTALACAO: 'Relatorios de Instalacao'
};

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000);
  }
  return null;
}

function formatDateIso(value) {
  const dt = toDate(value);
  if (!dt) return '';
  return dt.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
  const iso = formatDateIso(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year}`;
}

function normalizeSegment(value, fallback = 'Sem dado') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[~"#%&*:<>?/\\{|}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized || fallback;
}

function joinSharePointPath(...parts) {
  return parts
    .map(part => String(part || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').trim())
    .filter(Boolean)
    .join('/');
}

function inferDocumentType(doc) {
  const directType = String(doc?.tipoDocumento || doc?.tipo || '').trim().toUpperCase();
  if (SUPPORTED_DOCUMENT_TYPES.has(directType)) return directType;

  const storagePath = String(doc?.storagePath || '').toLowerCase();
  if (storagePath.includes('/contratos/')) return 'CONTRATO';
  if (storagePath.includes('/documentos-fiscais/')) return 'NOTA_FISCAL';
  if (storagePath.includes('/relatorios/')) return 'RELATORIO_INSTALACAO';
  return '';
}

function getMimeType(doc) {
  if (doc?.mimeType) return String(doc.mimeType).trim();
  const legacyType = String(doc?.tipo || '').trim();
  return SUPPORTED_DOCUMENT_TYPES.has(legacyType.toUpperCase()) ? '' : legacyType;
}

function getDocumentKey(doc) {
  return [
    inferDocumentType(doc),
    doc?.storagePath || '',
    doc?.url || '',
    doc?.nomeArquivo || '',
    doc?.dataAnexo || ''
  ].join('|');
}

function getNewSupportedDocuments(beforeDocs, afterDocs) {
  const beforeKeys = new Set((beforeDocs || [])
    .map(doc => ({ doc, type: inferDocumentType(doc) }))
    .filter(item => item.type)
    .map(item => getDocumentKey(item.doc)));

  return (afterDocs || [])
    .map(doc => ({ doc, type: inferDocumentType(doc) }))
    .filter(item => item.type)
    .filter(item => !beforeKeys.has(getDocumentKey(item.doc)))
    .map(item => ({
      ...item.doc,
      tipoDocumento: item.type,
      mimeType: getMimeType(item.doc)
    }));
}

function getSolicitacaoNumero(data, fallbackId) {
  return normalizeSegment(data?.protocolo || fallbackId, 'Sem numero');
}

function getSolicitacaoCliente(data) {
  return normalizeSegment(
    data?.dadosCliente?.nomeCliente ||
      data?.dadosSolicitacao?.nomeCliente ||
      data?.cliente,
    'Cliente'
  );
}

function getSolicitacaoDate(data) {
  return data?.dadosSolicitacao?.dataSolicitacao || data?.criadoEm || new Date();
}

function splitFileName(fileName) {
  const original = String(fileName || '').trim();
  if (!original) return { base: 'arquivo', ext: '' };
  const idx = original.lastIndexOf('.');
  if (idx <= 0 || idx === original.length - 1) {
    return { base: original, ext: '' };
  }
  return {
    base: original.slice(0, idx),
    ext: original.slice(idx)
  };
}

function buildSharePointFileData(config, solicitacao, doc, fallbackId) {
  const numeroSolicitacao = getSolicitacaoNumero(solicitacao, fallbackId);
  const cliente = getSolicitacaoCliente(solicitacao);
  const dataReferencia = formatDateLabel(getSolicitacaoDate(solicitacao)) || formatDateLabel(new Date());
  const tipoDocumento = inferDocumentType(doc);
  const tipoLabel = DOCUMENT_TYPE_LABELS[tipoDocumento] || tipoDocumento;
  const subpasta = DOCUMENT_TYPE_FOLDERS[tipoDocumento] || 'Arquivos';
  const pastaSolicitacao = `${numeroSolicitacao} - ${cliente} - ${dataReferencia}`;
  const fileParts = splitFileName(doc?.nomeArquivo);
  const nomeOriginalNormalizado = normalizeSegment(fileParts.base, 'arquivo');
  const nomeArquivoDestino = `${tipoLabel} - ${numeroSolicitacao} - ${cliente} - ${dataReferencia} - ${nomeOriginalNormalizado}${fileParts.ext}`;

  return {
    tipoDocumento,
    tipoLabel,
    subpasta,
    pastaSolicitacao,
    nomeArquivoDestino,
    pastaDestino: joinSharePointPath(config.rootFolder, pastaSolicitacao, subpasta)
  };
}

async function registerIntegrationLog(status, payload) {
  try {
    await db.collection('integracoes_logs').add({
      integracao: 'power_automate',
      status,
      ...payload,
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[powerAutomateSync] falha ao registrar log:', err);
  }
}

/**
 * resolveUsername — Cloud Function callable (HTTPS)
 *
 * Resolve username → email para o fluxo de login do WORKRAIL.
 */
exports.resolveUsername = functions
  .runWith({ maxInstances: 5 })
  .https.onCall(async (data) => {
    const username = (data.username || '').toLowerCase().trim();

    if (!username || username.length < 3 || username.length > 64) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username inválido.'
      );
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username contém caracteres inválidos.'
      );
    }

    try {
      const doc = await db.collection('username_lookup').doc(username).get();

      if (!doc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Usuário não encontrado. Verifique o username.'
        );
      }

      const entry = doc.data();

      if (!entry.email || entry.ativo === false) {
        throw new functions.https.HttpsError(
          'not-found',
          'Usuário não encontrado ou desativado. Contate o administrador.'
        );
      }

      return { email: entry.email };
    } catch (err) {
      if (err instanceof functions.https.HttpsError) throw err;

      console.error('[resolveUsername] erro interno:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao processar login. Tente novamente.'
      );
    }
  });

/**
 * Dispara o Power Automate sempre que entrar um novo Contrato, NF ou
 * Relatório de Instalação em uma solicitação.
 */
exports.syncSharePointDocuments = functions
  .runWith({ maxInstances: 10, timeoutSeconds: 60, memory: '256MB' })
  .firestore.document('solicitacoes/{solicitacaoId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const novosDocumentos = getNewSupportedDocuments(before.documentos, after.documentos);

    if (!novosDocumentos.length) {
      return null;
    }

    const cfgSnap = await db.collection('integracoes').doc(POWER_AUTOMATE_CONFIG_DOC).get();
    const cfgData = cfgSnap.exists ? cfgSnap.data() : {};
    const config = {
      enabled: !!cfgData.enabled,
      webhookUrl: String(cfgData.webhookUrl || '').trim(),
      siteName: String(cfgData.siteName || 'Solenis Brasil').trim(),
      libraryName: String(cfgData.libraryName || 'Documentos Compartilhados').trim(),
      rootFolder: String(cfgData.rootFolder || 'WORKRAIL/AS&TS').trim()
    };

    if (!config.enabled || !config.webhookUrl) {
      await registerIntegrationLog('skipped', {
        solicitacaoId: context.params.solicitacaoId,
        motivo: 'integration-disabled',
        quantidadeArquivos: novosDocumentos.length
      });
      return null;
    }

    const protocolo = getSolicitacaoNumero(after, context.params.solicitacaoId);
    const cliente = getSolicitacaoCliente(after);
    const dataSolicitacao = formatDateIso(getSolicitacaoDate(after));
    const pastaBase = `${protocolo} - ${cliente} - ${formatDateLabel(getSolicitacaoDate(after)) || formatDateLabel(new Date())}`;
    const arquivos = novosDocumentos.map(doc => {
      const sharePoint = buildSharePointFileData(config, after, doc, context.params.solicitacaoId);
      return {
        tipoDocumento: sharePoint.tipoDocumento,
        tipoLabel: sharePoint.tipoLabel,
        nomeOriginal: doc.nomeArquivo || '',
        nomeArquivoDestino: sharePoint.nomeArquivoDestino,
        mimeType: doc.mimeType || '',
        tamanhoBytes: Number(doc.tamanho || 0),
        urlDownload: doc.url || '',
        storagePath: doc.storagePath || '',
        etapa: doc.etapa || after.etapaAtual || '',
        responsavel: doc.responsavel || '',
        dataAnexo: doc.dataAnexo || '',
        sharePoint: {
          siteName: config.siteName,
          libraryName: config.libraryName,
          rootFolder: config.rootFolder,
          pastaSolicitacao: pastaBase,
          subpasta: sharePoint.subpasta,
          pastaDestino: sharePoint.pastaDestino
        }
      };
    });

    const payload = {
      evento: SHAREPOINT_SYNC_EVENT,
      origem: 'WORKRAIL',
      geradoEm: new Date().toISOString(),
      solicitacao: {
        id: context.params.solicitacaoId,
        numeroSolicitacao: protocolo,
        protocolo,
        numeroPedido: after?.dadosAdm?.numeroPedido || after?.dadosSolicitacao?.numeroPedido || '',
        cliente,
        cnpj: after?.dadosCliente?.cnpj || '',
        shipTo: after?.dadosCliente?.shipTo || '',
        dataSolicitacao,
        status: after?.status || '',
        etapaAtual: after?.etapaAtual || ''
      },
      sharePoint: {
        siteName: config.siteName,
        libraryName: config.libraryName,
        rootFolder: config.rootFolder,
        pastaSolicitacao: joinSharePointPath(config.rootFolder, pastaBase)
      },
      arquivos
    };

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText.slice(0, 500)}`);
      }

      await registerIntegrationLog('success', {
        solicitacaoId: context.params.solicitacaoId,
        numeroSolicitacao: protocolo,
        cliente,
        quantidadeArquivos: arquivos.length,
        tiposDocumento: arquivos.map(file => file.tipoDocumento),
        respostaWebhook: responseText.slice(0, 500)
      });
    } catch (err) {
      console.error('[powerAutomateSync] erro ao enviar webhook:', err);
      await registerIntegrationLog('error', {
        solicitacaoId: context.params.solicitacaoId,
        numeroSolicitacao: protocolo,
        cliente,
        quantidadeArquivos: arquivos.length,
        tiposDocumento: arquivos.map(file => file.tipoDocumento),
        erro: err.message || String(err)
      });
    }

    return null;
  });
