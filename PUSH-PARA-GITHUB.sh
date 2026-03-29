#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════
# SCRIPT PARA FAZER PUSH DOS ARQUIVOS PARA GITHUB
# ════════════════════════════════════════════════════════════════════════════
#
# Use este script para fazer push de todos os 12 arquivos criados ao seu
# repositório GitHub workrail-as-ts.
#
# INSTRUÇÕES:
# 1. Clone o repositório em seu computador:
#    git clone https://github.com/SEU-USUARIO/workrail-as-ts.git
#
# 2. Copie todos os arquivos .md, .json, .txt, .js para a pasta local
#
# 3. Execute este script na pasta raiz do repositório:
#    chmod +x PUSH-PARA-GITHUB.sh
#    ./PUSH-PARA-GITHUB.sh
#
# 4. Digite 's' para confirmar o push
#
# ════════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    PUSH DE ARQUIVOS WORKRAIL v3.0 PARA GITHUB                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configurar usuário git (opcional)
echo "Configurando usuário Git..."
git config user.name "Agent IA WORKRAIL" 2>/dev/null || true
git config user.email "workrail@solenis.com" 2>/dev/null || true

# Verificar se estamos em repositório git
if [ ! -d ".git" ]; then
    echo "❌ ERRO: Não é um repositório Git!"
    echo ""
    echo "Por favor, crie o repositório primeiro:"
    echo "  git init"
    echo "  git remote add origin https://github.com/SEU-USUARIO/workrail-as-ts.git"
    exit 1
fi

# Mostrar arquivos a serem adicionados
echo "📋 Arquivos a adicionar:"
echo ""
echo "Documentação:"
echo "  ✓ COMECE-AQUI.txt"
echo "  ✓ README-IMPLEMENTACAO.md"
echo "  ✓ INDICE-COMPLETO.md"
echo "  ✓ RECOMENDACOES-FINAIS.md"
echo "  ✓ FASE-1-INSPECAO.md"
echo "  ✓ FASE-11-MIGRATION-GUIDE.md"
echo "  ✓ FASE-13-14-TESTE-HOMOLOGACAO.md"
echo ""
echo "Firebase:"
echo "  ✓ firestore-schema.json"
echo "  ✓ firestore-security-rules.txt"
echo "  ✓ firebase-storage-rules.txt"
echo ""
echo "JavaScript:"
echo "  ✓ power-automate-integration.js"
echo "  ✓ access-control.js"
echo "  ✓ historico-auditoria.js"
echo ""

# Pedir confirmação
read -p "Continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado."
    exit 1
fi

# Adicionar arquivos
echo ""
echo "📝 Adicionando arquivos..."
git add COMECE-AQUI.txt \
    README-IMPLEMENTACAO.md \
    INDICE-COMPLETO.md \
    RECOMENDACOES-FINAIS.md \
    FASE-1-INSPECAO.md \
    FASE-11-MIGRATION-GUIDE.md \
    FASE-13-14-TESTE-HOMOLOGACAO.md \
    firestore-schema.json \
    firestore-security-rules.txt \
    firebase-storage-rules.txt \
    power-automate-integration.js \
    access-control.js \
    historico-auditoria.js

# Verificar status
echo ""
echo "📊 Status:"
git status --short

# Fazer commit
echo ""
echo "💾 Fazendo commit..."
git commit -m "feat: WORKRAIL v3.0 - Infraestrutura completa

Adicionados 13 arquivos estruturados:
- 7 documentos de análise e implementação
- 3 arquivos de configuração Firebase
- 3 módulos JavaScript prontos
- Total: ~170 KB

Incluindo:
✓ Documentação completa (14 fases)
✓ Schema Firestore
✓ Regras de segurança
✓ Integração Power Automate
✓ Guia de migration
✓ Testes obrigatórios

Status: Pronto para implementação

Co-Authored-By: Agent IA WORKRAIL <workrail@solenis.com>"

# Fazer push (se houver origem)
echo ""
echo "🚀 Verificando repositório remoto..."
if git remote -v | grep -q origin; then
    read -p "Fazer push para GitHub agora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "⏳ Fazendo push..."
        git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || echo "⚠️ Erro ao fazer push. Verifique suas credenciais do GitHub."
        echo ""
        echo "✅ Push concluído!"
    fi
else
    echo "⚠️ Nenhum repositório remoto configurado."
    echo ""
    echo "Para adicionar o repositório remoto:"
    echo "  git remote add origin https://github.com/SEU-USUARIO/workrail-as-ts.git"
    echo "  git push -u origin main"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Script finalizado!                                        ║"
echo "║                                                                ║"
echo "║  Próximos passos:                                             ║"
echo "║  1. Verificar: https://github.com/SEU-USUARIO/workrail-as-ts ║"
echo "║  2. Configurar Firebase (firebase-schema.json)                ║"
echo "║  3. Seguir: README-IMPLEMENTACAO.md                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
