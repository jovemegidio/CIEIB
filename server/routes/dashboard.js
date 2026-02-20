/* ==============================================================
   Rotas do Dashboard — Estatísticas e Configurações do site
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');

// GET /api/dashboard/stats — Estatísticas públicas do site
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT chave, valor FROM configuracoes
            WHERE chave LIKE 'stat_%'
        `);

        const stats = {};
        result.rows.forEach(row => {
            stats[row.chave.replace('stat_', '')] = parseInt(row.valor) || row.valor;
        });

        res.json(stats);
    } catch (err) {
        // Fallback com valores padrão
        res.json({
            igrejas: 500,
            ministros: 1200,
            estados: 26,
            convencoes: 50
        });
    }
});

// GET /api/dashboard/config — Configurações públicas do site
router.get('/config', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT chave, valor FROM configuracoes
            WHERE chave LIKE 'site_%'
        `);

        const config = {};
        result.rows.forEach(row => {
            config[row.chave.replace('site_', '')] = row.valor;
        });

        res.json(config);
    } catch (err) {
        res.json({
            telefone: '(00) 0000-0000',
            email: 'contato@cieib.org.br',
            whatsapp: '5500000000000',
            endereco: 'Rua Exemplo, 1000',
            horario: 'Seg a Sex: 09h às 17h'
        });
    }
});

// GET /api/dashboard/eventos-proximos — Próximos eventos para o site
router.get('/eventos-proximos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM eventos
            WHERE data_evento >= CURRENT_DATE AND status != 'Encerrado'
            ORDER BY data_evento ASC
            LIMIT 3
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

module.exports = router;
