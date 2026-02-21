/* ==============================================================
   Rotas de Mensagens Diretas
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/mensagens — Mensagens do ministro logado (enviadas + recebidas)
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM mensagens 
             WHERE ministro_id = $1 AND excluida = FALSE 
             ORDER BY data_envio DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar mensagens:', err);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// GET /api/mensagens/nao-lidas — Count de não lidas
router.get('/nao-lidas', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as total FROM mensagens 
             WHERE ministro_id = $1 AND lida = FALSE AND excluida = FALSE AND tipo = 'recebida'`,
            [req.userId]
        );
        res.json({ total: parseInt(result.rows[0].total) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao contar mensagens' });
    }
});

// GET /api/mensagens/:id — Detalhe de uma mensagem
router.get('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM mensagens WHERE id = $1 AND ministro_id = $2 AND excluida = FALSE',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        // Marcar como lida automaticamente ao abrir
        if (!result.rows[0].lida) {
            await pool.query(
                'UPDATE mensagens SET lida = TRUE WHERE id = $1',
                [req.params.id]
            );
            result.rows[0].lida = true;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar mensagem:', err);
        res.status(500).json({ error: 'Erro ao buscar mensagem' });
    }
});

// POST /api/mensagens — Enviar nova mensagem
router.post('/', auth, async (req, res) => {
    try {
        const { destinatario, assunto, conteudo } = req.body;

        if (!assunto || !conteudo) {
            return res.status(400).json({ error: 'Assunto e conteúdo são obrigatórios' });
        }

        const ministro = await pool.query('SELECT nome FROM ministros WHERE id = $1', [req.userId]);
        const nomeMinistro = ministro.rows[0]?.nome || 'Ministro';

        const result = await pool.query(`
            INSERT INTO mensagens (ministro_id, remetente, destinatario, assunto, conteudo, tipo)
            VALUES ($1, $2, $3, $4, $5, 'enviada') RETURNING *
        `, [req.userId, nomeMinistro, destinatario || 'Secretaria CIEIB', assunto, conteudo]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
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

// POST /api/mensagens/:id/responder — Responder a uma mensagem
router.post('/:id/responder', auth, async (req, res) => {
    try {
        const { conteudo } = req.body;
        if (!conteudo) {
            return res.status(400).json({ error: 'Conteúdo da resposta é obrigatório' });
        }

        // Buscar mensagem original
        const original = await pool.query(
            'SELECT * FROM mensagens WHERE id = $1 AND ministro_id = $2 AND excluida = FALSE',
            [req.params.id, req.userId]
        );
        if (original.rows.length === 0) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }

        const ministro = await pool.query('SELECT nome FROM ministros WHERE id = $1', [req.userId]);
        const nomeMinistro = ministro.rows[0]?.nome || 'Ministro';
        const msg = original.rows[0];

        // Criar mensagem de resposta (como "enviada")
        const result = await pool.query(`
            INSERT INTO mensagens (ministro_id, remetente, destinatario, assunto, conteudo, tipo, mensagem_pai_id)
            VALUES ($1, $2, $3, $4, $5, 'enviada', $6) RETURNING *
        `, [
            req.userId,
            nomeMinistro,
            msg.remetente === nomeMinistro ? msg.destinatario : msg.remetente,
            msg.assunto.startsWith('Re: ') ? msg.assunto : `Re: ${msg.assunto}`,
            conteudo,
            msg.id
        ]);

        // Marcar mensagem original como respondida
        await pool.query(
            'UPDATE mensagens SET respondida = TRUE WHERE id = $1',
            [req.params.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao responder mensagem:', err);
        res.status(500).json({ error: 'Erro ao responder mensagem' });
    }
});

// DELETE /api/mensagens/:id — Excluir mensagem (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE mensagens SET excluida = TRUE WHERE id = $1 AND ministro_id = $2 RETURNING id',
            [req.params.id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }
        res.json({ message: 'Mensagem excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir mensagem:', err);
        res.status(500).json({ error: 'Erro ao excluir mensagem' });
    }
});

module.exports = router;
