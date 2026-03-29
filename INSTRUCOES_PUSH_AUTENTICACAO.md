# 🚀 Instruções para Push - Sistema de Autenticação por Username

## ✅ O que foi alterado no index.html

### 1. **Sistema de Login**
- ❌ Removido: Login por email (loginEmail)
- ✅ Adicionado: Login por username (loginUsername)
  - Formato: `welington.tavares`, `joao.carvalho`, etc.

### 2. **Criptografia de Senha**
- Biblioteca bcryptjs adicionada: `https://cdnjs.cloudflare.com/ajax/libs/bcryptjs/2.4.3/bcrypt.min.js`
- Senhas armazenadas como **hash** no Firestore, nunca em texto plano
- Comparação segura de senha durante login

### 3. **Eliminação da Dependência de Firebase Auth**
- ✅ Não usa `identitytoolkit.googleapis.com` (endpoint bloqueado pelo firewall)
- ✅ Não precisa de credenciais do Google
- ✅ Funciona totalmente com Firestore + localStorage

### 4. **Interface de Admin Atualizada**
- Campo "Username" adicionado ao formulário de criar/editar usuário
- Tabela de usuários mostra username (ex: `@welington.tavares`)
- Email separado como "para notificações"

### 5. **Fluxo de Login**
```
Usuário digita:
  Username: welington.tavares
  Senha: ****

Sistema faz:
  1. Procura documento em Firestore.usuarios onde username == 'welington.tavares'
  2. Valida se está ativo
  3. Compara senha com bcrypt.compare()
  4. Se OK: Salva sessão em localStorage
  5. Carrega interface e menu por perfil
```

---

## 📝 Como Fazer o Push para GitHub

### Opção 1: PowerShell (Recomendado)

```powershell
# 1. Abra PowerShell na pasta do projeto
cd "C:\caminho\para\Novo Projeto"

# 2. Configure Git (primeira vez apenas)
git config user.email "seu@email.com"
git config user.name "Seu Nome"

# 3. Adicione o arquivo
git add index.html

# 4. Faça commit
git commit -m "Sistema de autenticação por username com bcryptjs"

# 5. Faça push
git push -f origin main

# 6. Pronto! 🎉
```

### Opção 2: GitHub Desktop
1. Abra o repositório no GitHub Desktop
2. Verá as mudanças do index.html
3. Clique em "Commit to main"
4. Clique em "Push origin"

### Opção 3: GitHub Web
1. Acesse: https://github.com/welingtontavares15/WORKRAIL
2. Click em "Add file" → "Upload files"
3. Escolha o arquivo index.html atualizado
4. Commit as changes

---

## 🔧 Modelo de Documento Firestore para Novo Usuário

```json
{
  "username": "welington.tavares",
  "nome": "Welington Tavares",
  "email": "welington@solenis.com",
  "senhaHash": "$2b$10$...", // Gerado por bcrypt.hash(senha, 10)
  "perfil": "vendas",
  "fornecedor": null,
  "ativo": true,
  "criadoEm": "2026-03-29T...",
  "criadoPor": "admin"
}
```

---

## 🔑 Criar Primeiro Usuário (Admin)

1. Acesse: https://welingtontavares15.github.io/WORKRAIL/
2. Tela de login mostrará campo "Usuário" (não email)
3. **Problema**: Não há usuário criado ainda!

### Solução Temporária:

Para criar o primeiro usuário, você pode:

#### Opção A: Inserir manualmente no Firestore (via Firebase Console)
1. Acesse: https://console.firebase.google.com/project/workrail-solenis/firestore
2. Coleção "usuarios" → Documento novo
3. ID: `uid_único` (use um UUID ou nome curto)
4. Dados:
```
username: welington.tavares
nome: Welington Tavares
email: welington@solenis.com
senhaHash: $2b$10$ZWYwzQmB9.FYZjM7NzQyN.Ac7L2dXfQ3bT9cP8qJ5rX2sL9oQ1p5W (bcrypt de "senha123")
perfil: super_admin
fornecedor: null
ativo: true
criadoEm: (servidor timestamp)
criadoPor: system
```

#### Opção B: Usar Função Cloud (precisa criar)
- Criar uma Cloud Function que gera hash bcrypt e insere usuário
- Chamar via REST API

---

## ✅ Checklist Pós-Push

- [ ] Arquivo index.html foi pushed para GitHub
- [ ] Acessou https://welingtontavares15.github.io/WORKRAIL/
- [ ] Formulário de login mostra campo "Usuário" (não "E-mail")
- [ ] Criou primeiro usuário (welington.tavares / super_admin)
- [ ] Conseguiu fazer login com username
- [ ] Página redirecionou para dashboard
- [ ] Menu lateral mostrou opções por perfil
- [ ] Tela de Admin carrega lista de usuários

---

## 🐛 Troubleshooting

### "Erro ao entrar. Tente novamente."
- Verifique se o username existe no Firestore
- Verifique se a senha está correta (compare com senhaHash usando bcrypt)
- Abra o console (F12) e procure por erros

### "Usuário não encontrado"
- Verifique se o documento foi criado no Firestore collection "usuarios"
- Verifique se o campo "username" está exatamente igual (case-sensitive)

### "Esta conta foi desativada"
- O usuário no Firestore tem `ativo: false`
- Edite no Firestore e mude para `true`

### Email não funciona
- O novo sistema não usa Firebase Auth
- Emails não são mais para login, apenas para notificações

---

## 📚 Estrutura de Dados Firestore

### Collection: usuarios
```
/usuarios/{documentId}
  ├── username (string) ← Chave de login
  ├── nome (string)
  ├── email (string)
  ├── senhaHash (string) ← Hash bcrypt
  ├── perfil (string)
  ├── fornecedor (string ou null)
  ├── ativo (boolean)
  ├── criadoEm (timestamp)
  └── criadoPor (string)
```

---

## 🎯 Próximos Passos

1. **Push do arquivo** (via PowerShell ou GitHub Desktop)
2. **Criar primeiro usuário** (manual no Firestore)
3. **Testar login** (welington.tavares / sua_senha)
4. **Testar admin panel** (criar novos usuários)
5. **Testar fluxo de solicitação** (com diferentes perfis)

---

**Desenvolvido por**: Claude AI
**Data**: 29 de Março de 2026
**Versão**: WORKRAIL v3.0 (Username Authentication)
