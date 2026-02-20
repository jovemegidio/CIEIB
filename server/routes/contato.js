/* ==============================================================
   Rotas de Contato — Formulário do site
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');

// POST /api/contato — Enviar mensagem de contato (público)
router.post('/', async (req, res) => {
    try {
        const { nome, email, telefone, assunto, mensagem } = req.body;

        if (!nome || !email || !mensagem) {
            return res.status(400).json({ error: 'Nome, email e mensagem são obrigatórios' });
        }

        const result = await pool.query(`
            INSERT INTO contatos (nome, email, telefone, assunto, mensagem)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [nome, email, telefone || null, assunto || 'Geral', mensagem]);

        res.json({
            message: 'Mensagem enviada com sucesso! Em breve entraremos em contato.',
            id: result.rows[0].id
        });
    } catch (err) {
        console.error('Erro no contato:', err);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// GET /api/contato — Listar mensagens (protegido - futuro admin)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contatos ORDER BY created_at DESC LIMIT 50'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
});

module.exports = router;
