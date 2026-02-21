/* ==============================================================
   CIEIB — Server Principal (Express + PostgreSQL)
   Deploy: VPS Hostinger com PM2 + Nginx
   ============================================================== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ---- Versão para cache-busting (muda a cada restart/deploy) ----
const APP_VERSION = Date.now().toString(36);

// ---- Trust proxy (Nginx) ----
if (isProd) app.set('trust proxy', 1);

// ---- Middlewares ----
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', apiLimiter);

// ---- Favicon redirect ----
app.get('/favicon.ico', (req, res) => {
    res.redirect(302, '/fav.jpg');
});

// ---- Cache control para HTML (nunca cachear) ----
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});

// ---- Servir arquivos estáticos (CSS, JS, imagens) ----
app.use(express.static(__dirname, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            // CSS/JS: sem cache forte — sempre revalidar via ETag
            res.set('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Helper: servir HTML com cache-busting automático ----
const fs = require('fs');
function sendHtmlWithCacheBust(res, filePath) {
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) return res.status(404).send('Página não encontrada');
        // Injeta ?v=VERSAO em todos os CSS/JS locais
        const busted = html
            .replace(/(href=["'](?:\/)?css\/[^"']+)(["'])/g, `$1?v=${APP_VERSION}$2`)
            .replace(/(src=["'](?:\/)?js\/[^"']+)(["'])/g, `$1?v=${APP_VERSION}$2`);
        res.set('Content-Type', 'text/html');
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(busted);
    });
}

// ---- Rotas da API ----
const authRoutes = require('./server/routes/auth');
const ministrosRoutes = require('./server/routes/ministros');
const noticiasRoutes = require('./server/routes/noticias');
const contatoRoutes = require('./server/routes/contato');
const eventosRoutes = require('./server/routes/eventos');
const mensagensRoutes = require('./server/routes/mensagens');
const contasRoutes = require('./server/routes/contas');
const convencoesRoutes = require('./server/routes/convencoes');
const dashboardRoutes = require('./server/routes/dashboard');
const cursosRoutes = require('./server/routes/cursos');
const credencialRoutes = require('./server/routes/credencial');
const notificacoesRoutes = require('./server/routes/notificacoes');
const adminRoutes = require('./server/routes/admin');
const registroRoutes = require('./server/routes/registro');
const suporteRoutes = require('./server/routes/suporte');

app.use('/api/auth', authRoutes);
app.use('/api/ministros', ministrosRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/contato', contatoRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/contas', contasRoutes);
app.use('/api/convencoes', convencoesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/credencial', credencialRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registro', registroRoutes);
app.use('/api/suporte', suporteRoutes);

// ---- SPA Fallback: Rotas HTML com cache-busting ----
const htmlPages = [
    'index', 'quem-somos', 'diretoria', 'noticias',
    'contato', 'area-do-ministro', 'painel-ministro', 'verificar-credencial', 'painel-admin'
];

htmlPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        sendHtmlWithCacheBust(res, path.join(__dirname, `${page}.html`));
    });
});

app.get('/', (req, res) => {
    sendHtmlWithCacheBust(res, path.join(__dirname, 'index.html'));
});

// ---- Health Check ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev', timestamp: new Date().toISOString() });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    res.status(err.status || 500).json({
        error: isProd
            ? 'Erro interno do servidor'
            : err.message
    });
});

// ---- Start ----
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ CIEIB Server rodando na porta ${PORT} [${process.env.NODE_ENV || 'dev'}]`);
    if (!isProd) console.log(`🌐 http://localhost:${PORT}`);
});

// ---- Graceful Shutdown (PM2 cluster) ----
process.on('SIGINT', () => {
    console.log('\n⏳ Encerrando servidor...');
    server.close(() => { process.exit(0); });
});
process.on('SIGTERM', () => {
    console.log('\n⏳ SIGTERM recebido, encerrando...');
    server.close(() => { process.exit(0); });
});
