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

// POST /api/contato/newsletter — Cadastrar e-mail na newsletter (público)
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-mail é obrigatório' });
        }

        // Verificar se email já está cadastrado na newsletter
        const existing = await pool.query(
            "SELECT id FROM contatos WHERE email = $1 AND assunto = 'Newsletter'",
            [email]
        );

        if (existing.rows.length > 0) {
            return res.json({ message: 'E-mail já cadastrado na newsletter!' });
        }

        await pool.query(`
            INSERT INTO contatos (nome, email, assunto, mensagem)
            VALUES ($1, $2, $3, $4)
        `, ['Newsletter', email, 'Newsletter', 'Cadastro na newsletter']);

        res.json({ message: 'E-mail cadastrado com sucesso!' });
    } catch (err) {
        console.error('Erro na newsletter:', err);
        res.status(500).json({ error: 'Erro ao cadastrar e-mail' });
    }
});

// GET /api/contato — Listar mensagens (protegido)
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
