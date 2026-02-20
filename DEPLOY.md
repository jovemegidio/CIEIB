# 🚀 CIEIB — Guia de Deploy na VPS Hostinger

> Guia completo para colocar o sistema CIEIB em produção numa VPS Ubuntu da Hostinger.

---

## 📋 Pré-requisitos

| Item | Versão |
|------|--------|
| VPS Hostinger | Ubuntu 22.04 ou 24.04 |
| Node.js | 18+ (recomendado 20 LTS) |
| PostgreSQL | 15+ |
| Nginx | qualquer versão recente |
| Domínio | apontado para o IP da VPS |

---

## 1️⃣ Acesso à VPS

Acesse o painel da Hostinger → **VPS** → copie o **IP** e use SSH:

```bash
ssh root@SEU_IP_VPS
```

> 💡 Na Hostinger, o acesso inicial é como `root`. Vamos criar um usuário dedicado.

---

## 2️⃣ Configuração Inicial do Servidor

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar utilitários
apt install -y curl git build-essential ufw

# Criar usuário para a aplicação (opcional mas recomendado)
adduser cieib
usermod -aG sudo cieib
```

---

## 3️⃣ Instalar Node.js 20 LTS

```bash
# Via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verificar
node -v    # v20.x.x
npm -v     # 10.x.x
```

---

## 4️⃣ Instalar PostgreSQL

```bash
# Instalar
apt install -y postgresql postgresql-contrib

# Verificar
systemctl status postgresql

# Criar banco e usuário
sudo -u postgres psql
```

Dentro do `psql`:

```sql
CREATE USER cieib_user WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';
CREATE DATABASE cieib_db OWNER cieib_user;
GRANT ALL PRIVILEGES ON DATABASE cieib_db TO cieib_user;

-- Permissões no schema public (PostgreSQL 15+)
\c cieib_db
GRANT ALL ON SCHEMA public TO cieib_user;

\q
```

> ⚠️ **ANOTE A SENHA!** Você vai usar no `.env`.

---

## 5️⃣ Instalar PM2 (Process Manager)

```bash
npm install -g pm2
```

---

## 6️⃣ Instalar Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## 7️⃣ Configurar Firewall (UFW)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

> Isso libera portas 22 (SSH), 80 (HTTP) e 443 (HTTPS).

---

## 8️⃣ Clonar o Projeto

```bash
# Criar diretório
mkdir -p /var/www/cieib
cd /var/www/cieib

# Clonar repositório
git clone https://github.com/jovemegidio/CIEIB.git .

# Instalar dependências
npm ci --production
```

---

## 9️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com seus dados reais
nano .env
```

Preencha o `.env`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://cieib_user:SUA_SENHA_FORTE_AQUI@localhost:5432/cieib_db
JWT_SECRET=GERE_ALGO_SEGURO_AQUI
FRONTEND_URL=https://seudominio.com.br
ADMIN_EMAIL=admin@cieib.org.br
ADMIN_PASSWORD=TROQUE_ESTA_SENHA
```

### Gerar JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e cole no `JWT_SECRET`.

---

## 🔟 Inicializar Banco de Dados

```bash
cd /var/www/cieib

# Criar todas as tabelas
npm run db:init

# Popular dados iniciais (admin, configs, etc.)
npm run db:seed
```

---

## 1️⃣1️⃣ Criar Diretórios Necessários

```bash
# Uploads
mkdir -p /var/www/cieib/uploads
chmod 755 /var/www/cieib/uploads

# Logs do PM2
mkdir -p /var/log/cieib
```

---

## 1️⃣2️⃣ Iniciar com PM2

```bash
cd /var/www/cieib

# Iniciar aplicação em cluster
pm2 start ecosystem.config.js --env production

# Verificar se está rodando
pm2 status

# Ver logs
pm2 logs cieib --lines 30

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save
```

### Testar:

```bash
curl http://localhost:3000/api/health
# Deve retornar: {"status":"ok","env":"production","timestamp":"..."}
```

---

## 1️⃣3️⃣ Configurar Nginx (Reverse Proxy)

```bash
# Copiar configuração
cp /var/www/cieib/nginx/cieib.conf /etc/nginx/sites-available/cieib

# Editar para colocar SEU domínio
nano /etc/nginx/sites-available/cieib
```

**Substitua** todas as ocorrências de `seudominio.com.br` pelo seu domínio real.

```bash
# Ativar o site
ln -s /etc/nginx/sites-available/cieib /etc/nginx/sites-enabled/

# Remover site padrão do Nginx
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Recarregar
systemctl reload nginx
```

---

## 1️⃣4️⃣ SSL com Let's Encrypt (HTTPS Grátis)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Gerar certificado SSL (substitua pelo seu domínio)
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Responda as perguntas:
- Email: seu email real
- Termos: **Y**
- Redirecionar HTTP → HTTPS: **2** (sim)

### Renovação automática:

```bash
# Testar renovação
certbot renew --dry-run

# O Certbot já cria um cron/timer automático
systemctl status certbot.timer
```

---

## 1️⃣5️⃣ Apontar Domínio para a VPS

No painel da **Hostinger** (ou onde seu domínio está registrado):

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **A** | `@` | `SEU_IP_VPS` | 3600 |
| **A** | `www` | `SEU_IP_VPS` | 3600 |

> ⏳ A propagação DNS pode levar de 5 min a 48h.

---

## ✅ Verificação Final

```bash
# 1. PM2 está rodando?
pm2 status

# 2. Health check local
curl http://localhost:3000/api/health

# 3. Nginx está ok?
nginx -t && systemctl status nginx

# 4. SSL funciona?
curl -I https://seudominio.com.br

# 5. Testar no navegador
# Abra: https://seudominio.com.br
# Abra: https://seudominio.com.br/painel-admin
```

---

## 🔄 Atualizações Futuras (Deploy)

Após fazer `git push` no seu computador local:

```bash
# Na VPS:
cd /var/www/cieib
bash deploy.sh
```

Ou manualmente:

```bash
cd /var/www/cieib
git pull origin main
npm ci --production
npm run db:init      # aplica novas tabelas se houver
pm2 reload cieib
```

---

## 📊 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Ver status da aplicação |
| `pm2 logs cieib` | Ver logs em tempo real |
| `pm2 logs cieib --lines 100` | Últimas 100 linhas |
| `pm2 restart cieib` | Reiniciar (com downtime) |
| `pm2 reload cieib` | Reiniciar sem downtime (0-downtime) |
| `pm2 stop cieib` | Parar aplicação |
| `pm2 monit` | Monitor em tempo real (CPU, RAM) |
| `pm2 flush cieib` | Limpar logs |
| `systemctl restart nginx` | Reiniciar Nginx |
| `certbot renew` | Renovar SSL |
| `sudo -u postgres psql cieib_db` | Acessar banco direto |

---

## 🔒 Segurança Extra (Recomendado)

### Desabilitar login root por senha:

```bash
nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no  (após configurar chave SSH)
systemctl restart sshd
```

### Fail2Ban (proteção contra brute-force):

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### Backups automáticos do banco:

```bash
# Criar script de backup
cat > /var/www/cieib/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/cieib"
mkdir -p $BACKUP_DIR
FILENAME="cieib_$(date +%Y%m%d_%H%M%S).sql.gz"
sudo -u postgres pg_dump cieib_db | gzip > "$BACKUP_DIR/$FILENAME"
# Manter apenas os últimos 30 backups
ls -t $BACKUP_DIR/cieib_*.sql.gz | tail -n +31 | xargs rm -f 2>/dev/null
echo "Backup: $FILENAME"
EOF

chmod +x /var/www/cieib/backup-db.sh

# Agendar backup diário às 3h da manhã
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/cieib/backup-db.sh") | crontab -
```

---

## 🆘 Troubleshooting

### Erro: "ECONNREFUSED" no PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql
# Verificar se a senha está correta no .env
sudo -u postgres psql -c "ALTER USER cieib_user PASSWORD 'nova_senha';"
```

### Erro: 502 Bad Gateway no Nginx
```bash
# Verificar se o Node está rodando
pm2 status
# Ver logs do Node
pm2 logs cieib --lines 50
# Reiniciar
pm2 restart cieib
```

### Erro: Permission denied nos uploads
```bash
chown -R $USER:$USER /var/www/cieib/uploads
chmod 755 /var/www/cieib/uploads
```

### Porta 3000 já em uso
```bash
# Ver o que está usando a porta
lsof -i :3000
# Matar processo
kill -9 <PID>
pm2 start ecosystem.config.js --env production
```

---

## 📁 Estrutura de Arquivos no Servidor

```
/var/www/cieib/          ← Aplicação
├── server.js
├── ecosystem.config.js
├── .env                 ← NÃO está no git
├── uploads/             ← Mídias enviadas
├── server/
│   └── db/
│       ├── init.js
│       └── seed.js
└── ...

/etc/nginx/
├── sites-available/
│   └── cieib            ← Config do Nginx
└── sites-enabled/
    └── cieib → ../sites-available/cieib

/var/log/cieib/          ← Logs PM2
├── out.log
└── error.log

/var/backups/cieib/      ← Backups do banco
└── cieib_20260220.sql.gz
```
