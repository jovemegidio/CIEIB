/* ==============================================================
   Rotas de Notificações
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/notificacoes — Notificações do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            (SELECT id, titulo, mensagem, tipo, link, lida, created_at
             FROM notificacoes
             WHERE ministro_id = $1
             ORDER BY created_at DESC
             LIMIT 50)
            UNION ALL
            (SELECT id, titulo, mensagem, tipo, link, FALSE as lida, created_at
             FROM notificacoes
             WHERE global = TRUE AND created_at >= NOW() - INTERVAL '30 days'
             ORDER BY created_at DESC
             LIMIT 20)
            ORDER BY created_at DESC
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar notificações:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// PUT /api/notificacoes/:id/lida — Marcar como lida
router.put('/:id/lida', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND ministro_id = $2',
            [req.params.id, req.userId]
        );
        res.json({ message: 'Notificação marcada como lida' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
});

// PUT /api/notificacoes/ler-todas — Marcar todas como lidas
router.put('/ler-todas', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE notificacoes SET lida = TRUE WHERE ministro_id = $1',
            [req.userId]
        );
        res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
});

// GET /api/notificacoes/nao-lidas — Contagem de não lidas
router.get('/nao-lidas', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notificacoes WHERE ministro_id = $1 AND lida = FALSE',
            [req.userId]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao contar notificações' });
    }
});

// GET /api/notificacoes/site — Notificações públicas para o site (sem auth)
router.get('/site', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, titulo, mensagem, tipo, link, data_inicio
            FROM notificacoes_site
            WHERE ativa = TRUE
              AND data_inicio <= NOW()
              AND (data_fim IS NULL OR data_fim >= NOW())
            ORDER BY data_inicio DESC
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar notificações do site:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

module.exports = router;
