# 🔧 GUIA DE CORREÇÃO - PROBLEMA DE LOGIN NO WORKRAIL

## 📌 Problema Identificado
O documento do usuário na coleção `usuarios` do Firestore está **incompleto** ou **mal formatado**. O código de login não consegue encontrar o usuário porque falta um ou mais campos obrigatórios.

---

## ✅ SOLUÇÃO: Corrigir o Documento no Firestore

### Passo 1: Acessar o Firebase Console
1. Abra: https://console.firebase.google.com/u/0/project/workrail-solenis/firestore
2. Clique em **"Firestore Database"** (no menu à esquerda)
3. Procure pela **Collection: `usuarios`**

### Passo 2: Verificar/Atualizar o Documento

**Campo de Identificação:**
- **ID do Documento:** Pode ser qualquer UUID ou string única
- **username:** "welington.tavares" ← Este é o valor que você digita no login!

### Passo 3: Garantir TODOS Estes Campos Existem

Copie e cole este objeto JSON como referência. **TODOS** estes campos são OBRIGATÓRIOS:

```json
{
  "ativo": true,
  "email": "welington@solenis.com",
  "nome": "Welington Tavares",
  "perfil": "admin",
  "senhaHash": "$2b$10$a1KgPjOdzK/TJBVmRKMen.jX3dGEa28chulVxFS/VHWOzpXJf2G9K",
  "username": "welington.tavares",
  "fornecedor": null
}
```

#### 📝 Descrição de Cada Campo:

| Campo | Tipo | Valor Exemplo | Obrigatório? | Notas |
|-------|------|--------------|-------------|-------|
| `username` | String | "welington.tavares" | ✅ SIM | Campo de busca - DEVE SER EXATO |
| `senhaHash` | String | "$2b$10$..." | ✅ SIM | Hash bcrypt - NÃO mude! |
| `ativo` | Boolean | true | ✅ SIM | Se false, login é bloqueado |
| `nome` | String | "Welington Tavares" | ✅ SIM | Nome completo do usuário |
| `email` | String | "welington@solenis.com" | ✅ SIM | Email do usuário |
| `perfil` | String | "admin" | ✅ SIM | Valores válidos: "admin", "gerente", "fornecedor" |
| `fornecedor` | String/null | null | ❌ NÃO | Opcional - vincular a um fornecedor |

---

## 🔐 Senha Definida

- **Username:** `welington.tavares`
- **Senha em Texto Plano:** `Solenis@2024`
- **Hash Bcrypt:** `$2b$10$a1KgPjOdzK/TJBVmRKMen.jX3dGEa28chulVxFS/VHWOzpXJf2G9K`

⚠️ **NUNCA armazene a senha em texto plano!** Use SEMPRE o hash.

---

## 🛠️ Passo a Passo no Firebase Console

### Se o documento JÁ EXISTE:
1. Clique no documento na coleção `usuarios`
2. Para cada campo faltante, clique em **"Adicionar campo"**
3. Digite o nome do campo (ex: "senhaHash")
4. Selecione o tipo (String, Boolean, etc.)
5. Cole o valor

### Se o documento NÃO EXISTE:
1. Clique em **"Adicionar documento"** (botão **+**)
2. Cole o JSON acima como um novo documento
3. Dê um ID ao documento (pode ser qualquer nome único)

---

## ✔️ CHECKLIST FINAL

Depois de atualizar, verifique:
- ✅ Campo `username` = "welington.tavares" (exatamente assim)
- ✅ Campo `senhaHash` = `$2b$10$a1KgPjOdzK/TJBVmRKMen.jX3dGEa28chulVxFS/VHWOzpXJf2G9K`
- ✅ Campo `ativo` = true
- ✅ Campo `nome` = seu nome completo
- ✅ Campo `email` = seu email
- ✅ Campo `perfil` = "admin" (ou outro valor válido)

---

## 🧪 Testando

Depois de atualizar:
1. Vá para: https://welingtontavares15-hue.github.io/workrail-as-ts/
2. Tente fazer login com:
   - **Usuário:** `welington.tavares`
   - **Senha:** `Solenis@2024`

---

## ❓ Ainda não funciona?

Se ainda receber erro, abra o **Console do Navegador** (F12) e veja a mensagem de erro completa. Copie e envie para debug.

---

**Data:** 29/03/2026
**Versão:** 1.0
**Status:** Pendente de Execução
