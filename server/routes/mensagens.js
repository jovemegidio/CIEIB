/* ==============================================================
   Rotas de Mensagens Diretas
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/mensagens — Mensagens do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM mensagens WHERE ministro_id = $1 ORDER BY data_envio DESC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// POST /api/mensagens — Enviar nova mensagem
router.post('/', auth, async (req, res) => {
    try {
        const { assunto, conteudo } = req.body;

        if (!assunto || !conteudo) {
            return res.status(400).json({ error: 'Assunto e conteúdo são obrigatórios' });
        }

        const ministro = await pool.query('SELECT nome FROM ministros WHERE id = $1', [req.userId]);

        const result = await pool.query(`
            INSERT INTO mensagens (ministro_id, remetente, assunto, conteudo)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [req.userId, ministro.rows[0]?.nome || 'Ministro', assunto, conteudo]);

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// PUT /api/mensagens/:id/lida — Marcar como lida
router.put('/:id/lida', auth, async (req, res) => {
    try {
        await pool.query(
            'UPDATE mensagens SET lida = TRUE WHERE id = $1 AND ministro_id = $2',
            [req.params.id, req.userId]
        );
        res.json({ message: 'Mensagem marcada como lida' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar mensagem' });
    }
});

module.exports = router;
