/* ==============================================================
   CIEIB — Server Principal (Express + PostgreSQL)
   Deploy-ready para Railway
   ============================================================== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

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

// ---- Servir arquivos estáticos (HTML, CSS, JS) ----
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ---- SPA Fallback: Rotas HTML ----
const htmlPages = [
    'index', 'quem-somos', 'diretoria', 'noticias',
    'contato', 'area-do-ministro', 'painel-ministro', 'verificar-credencial', 'painel-admin'
];

htmlPages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ---- Health Check (Railway) ----
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
    console.error('Erro:', err.message);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : err.message
    });
});

// ---- Start ----
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ CIEIB Server rodando na porta ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
