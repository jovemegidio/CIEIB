#!/bin/bash
# ==============================================================
# CIEIB — Script de Deploy para VPS Hostinger
# Uso: bash deploy.sh
# ==============================================================

set -e

APP_DIR="/var/www/cieib"
REPO_URL="https://github.com/jovemegidio/CIEIB.git"
BRANCH="main"

echo ""
echo "============================================"
echo "  CIEIB — Deploy para Produção"
echo "============================================"
echo ""

# ---- 1. Pull do código ----
echo "📦 Atualizando código..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "⚠️  Diretório não é um repositório git."
    echo "   Execute primeiro o setup inicial (veja DEPLOY.md)"
    exit 1
fi

# ---- 2. Instalar dependências ----
echo "📥 Instalando dependências..."
npm ci --production

# ---- 3. Criar diretório de uploads se não existir ----
mkdir -p "$APP_DIR/uploads"
chmod 755 "$APP_DIR/uploads"

# ---- 4. Criar diretório de logs se não existir ----
sudo mkdir -p /var/log/cieib
sudo chown $USER:$USER /var/log/cieib

# ---- 5. Rodar migrações (criar tabelas) ----
echo "🗄️  Executando migrações do banco..."
node server/db/init.js

# ---- 6. Reiniciar PM2 ----
echo "🔄 Reiniciando aplicação..."
pm2 reload ecosystem.config.js --env production

# ---- 7. Salvar estado do PM2 ----
pm2 save

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Verifique: https://$(grep server_name /etc/nginx/sites-available/cieib 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';' || echo 'seudominio.com.br')"
echo ""

# ---- 8. Health Check ----
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check: OK (200)"
else
    echo "⚠️  Health check: Status $HTTP_STATUS — verifique os logs:"
    echo "   pm2 logs cieib --lines 20"
fi
