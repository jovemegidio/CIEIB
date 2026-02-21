@echo off
REM ============================================================
REM CIEIB - Deploy automatico para VPS (sem senha)
REM Uso: deploy.bat
REM ============================================================

echo [CIEIB] Iniciando deploy...

REM 1. Commit e push local
echo [1/4] Commitando alteracoes...
git add -A
git commit -m "deploy: auto-deploy %date% %time%" 2>nul
git push origin main

REM 2. Pull no servidor + restart PM2
echo [2/5] Atualizando VPS...
ssh -i "%USERPROFILE%\.ssh\id_rsa_cieib" -o StrictHostKeyChecking=no root@147.93.69.162 "cd /var/www/cieib && git pull origin main && npm ci --production 2>/dev/null && pm2 reload cieib --update-env"

REM 3. Atualizar Nginx config e recarregar
echo [3/5] Atualizando Nginx...
ssh -i "%USERPROFILE%\.ssh\id_rsa_cieib" -o StrictHostKeyChecking=no root@147.93.69.162 "cp /var/www/cieib/nginx/cieib-vps.conf /etc/nginx/sites-available/cieib && nginx -t && nginx -s reload && echo 'Nginx atualizado com sucesso' || echo 'ERRO ao atualizar Nginx'"

echo [4/5] Verificando status...
ssh -i "%USERPROFILE%\.ssh\id_rsa_cieib" -o StrictHostKeyChecking=no root@147.93.69.162 "pm2 status"

echo [5/5] Deploy concluido!
echo Acesse: http://147.93.69.162
pause
