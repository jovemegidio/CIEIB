/* ==============================================================
   Rotas de Autenticação — Login / Registro / Verificação
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { cpf, senha } = req.body;

        if (!cpf || !senha) {
            return res.status(400).json({ error: 'CPF e senha são obrigatórios' });
        }

        // Limpar CPF (só números)
        const cpfLimpo = cpf.replace(/\D/g, '');

        const result = await pool.query(
            'SELECT id, cpf, senha, nome, status FROM ministros WHERE cpf = $1',
            [cpfLimpo]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'CPF ou senha incorretos' });
        }

        const ministro = result.rows[0];

        // Verificar senha
        const senhaOk = await bcrypt.compare(senha, ministro.senha);
        if (!senhaOk) {
            return res.status(401).json({ error: 'CPF ou senha incorretos' });
        }

        if (ministro.status !== 'ATIVO') {
            return res.status(403).json({ error: 'Sua conta está inativa. Entre em contato com a administração.' });
        }

        // Gerar JWT
        const token = jwt.sign(
            { id: ministro.id, cpf: ministro.cpf },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Log de acesso
        await pool.query(
            'INSERT INTO logs_acesso (ministro_id, acao, ip) VALUES ($1, $2, $3)',
            [ministro.id, 'LOGIN', req.ip]
        );

        res.json({
            token,
            ministro: {
                id: ministro.id,
                nome: ministro.nome,
                cpf: ministro.cpf
            }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/auth/verify — Verifica se token é válido
router.get('/verify', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, cpf, nome, status FROM ministros WHERE id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ valid: true, ministro: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao verificar token' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        const result = await pool.query('SELECT senha FROM ministros WHERE id = $1', [req.userId]);
        const ministro = result.rows[0];

        const senhaOk = await bcrypt.compare(senhaAtual, ministro.senha);
        if (!senhaOk) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const novaHash = await bcrypt.hash(novaSenha, 10);
        await pool.query('UPDATE ministros SET senha = $1, updated_at = NOW() WHERE id = $2', [novaHash, req.userId]);

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});

module.exports = router;
