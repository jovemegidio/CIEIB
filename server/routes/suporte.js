/* ==============================================================
   Rotas de Suporte — Chamados do Ministro
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// Gerar protocolo único: SUP-YYYYMMDD-XXXX
function gerarProtocolo() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    return `SUP-${y}${m}${d}-${rand}`;
}

// GET /api/suporte — Listar chamados do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, protocolo, categoria, assunto, mensagem, prioridade, status,
                    resposta, respondido_por, respondido_em, created_at, updated_at
             FROM suporte_tickets
             WHERE ministro_id = $1
             ORDER BY created_at DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar chamados:', err.message);
        res.status(500).json({ error: 'Erro ao buscar chamados de suporte' });
    }
});

// POST /api/suporte — Criar novo chamado
router.post('/', auth, async (req, res) => {
    try {
        const { categoria, assunto, mensagem, prioridade } = req.body;

        if (!categoria || !assunto || !mensagem) {
            return res.status(400).json({ error: 'Categoria, assunto e mensagem são obrigatórios' });
        }

        // Gerar protocolo único (tenta até 3 vezes em caso de colisão)
        let protocolo;
        for (let i = 0; i < 3; i++) {
            protocolo = gerarProtocolo();
            const exists = await pool.query('SELECT id FROM suporte_tickets WHERE protocolo = $1', [protocolo]);
            if (exists.rows.length === 0) break;
        }

        const result = await pool.query(`
            INSERT INTO suporte_tickets (ministro_id, protocolo, categoria, assunto, mensagem, prioridade)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [req.userId, protocolo, categoria, assunto, mensagem, prioridade || 'normal']);

        // Registrar log
        await pool.query(
            `INSERT INTO logs_acesso (ministro_id, acao, ip) VALUES ($1, $2, $3)`,
            [req.userId, 'ABRIR_CHAMADO_SUPORTE', req.ip]
        ).catch(() => {});

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar chamado:', err.message);
        res.status(500).json({ error: 'Erro ao criar chamado de suporte' });
    }
});

module.exports = router;
