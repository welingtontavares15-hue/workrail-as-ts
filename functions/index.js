'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

/**
 * resolveUsername — Cloud Function callable (HTTPS)
 *
 * Resolve username → email para o fluxo de login do WORKRAIL.
 *
 * SEGURANÇA:
 *   - A coleção username_lookup é acessível APENAS pelo Admin SDK (esta função).
 *   - O cliente nunca lê username_lookup diretamente (regra Firestore: allow read: if false).
 *   - Elimina enumeração pública de usernames/emails — o cliente não tem acesso ao Firestore.
 *   - Anonymous Auth NÃO é mais necessário nem habilitado.
 *
 * RATE LIMIT:
 *   - maxInstances limita escalonamento; Firebase App Check pode ser adicionado em P1.
 *
 * USO NO CLIENTE:
 *   const fn = firebase.functions().httpsCallable('resolveUsername');
 *   const { data } = await fn({ username: 'joao.silva' });
 *   // data.email === 'joao.silva@solenis.com'
 */
exports.resolveUsername = functions
  .runWith({ maxInstances: 5 })
  .https.onCall(async (data, context) => {
    const username = (data.username || '').toLowerCase().trim();

    // Validação mínima — evita queries desnecessárias
    if (!username || username.length < 3 || username.length > 64) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username inválido.'
      );
    }

    // Caracteres permitidos (mesma regra do cadastro)
    if (!/^[a-z0-9._-]+$/.test(username)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username contém caracteres inválidos.'
      );
    }

    try {
      const doc = await admin
        .firestore()
        .collection('username_lookup')
        .doc(username)
        .get();

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

      // Retorna apenas o email — nunca expõe uid ou outros dados
      return { email: entry.email };

    } catch (err) {
      // Relança erros HttpsError (já formatados)
      if (err instanceof functions.https.HttpsError) throw err;

      // Erro interno inesperado — loga no servidor, não expõe detalhes ao cliente
      console.error('[resolveUsername] erro interno:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao processar login. Tente novamente.'
      );
    }
  });
