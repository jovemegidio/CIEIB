/* ==============================================================
   Rotas de Credencial Digital
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// GET /api/credencial — Dados da credencial do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, cpf, nome, cargo, conv_estadual, registro, foto_url,
                   data_registro, data_validade, credencial_codigo, status
            FROM ministros WHERE id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ministro não encontrado' });
        }

        const ministro = result.rows[0];

        // Se não tem código de credencial, gerar
        if (!ministro.credencial_codigo) {
            const codigo = `CIEIB-${ministro.registro || ministro.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            
            // Se não tem data de validade, definir 1 ano a partir de agora
            const validade = new Date();
            validade.setFullYear(validade.getFullYear() + 1);

            await pool.query(`
                UPDATE ministros SET credencial_codigo = $1, data_validade = $2 WHERE id = $3
            `, [codigo, validade, req.userId]);

            ministro.credencial_codigo = codigo;
            ministro.data_validade = validade;
        }

        // URL pública de verificação
        const verificarUrl = `/verificar-credencial.html?code=${ministro.credencial_codigo}`;

        res.json({
            nome: ministro.nome,
            cargo: ministro.cargo,
            convencao: ministro.conv_estadual,
            registro: ministro.registro,
            foto_url: ministro.foto_url,
            data_registro: ministro.data_registro,
            data_validade: ministro.data_validade,
            codigo: ministro.credencial_codigo,
            status: ministro.status,
            verificar_url: verificarUrl
        });
    } catch (err) {
        console.error('Erro ao buscar credencial:', err);
        res.status(500).json({ error: 'Erro ao buscar credencial' });
    }
});

// GET /api/credencial/verificar/:codigo — Verificação pública (sem auth)
router.get('/verificar/:codigo', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT nome, cargo, conv_estadual, registro, foto_url,
                   data_registro, data_validade, credencial_codigo, status
            FROM ministros WHERE credencial_codigo = $1
        `, [req.params.codigo]);

        if (result.rows.length === 0) {
            return res.json({
                valido: false,
                mensagem: 'Credencial não encontrada no sistema da CIEIB.'
            });
        }

        const m = result.rows[0];
        const agora = new Date();
        const validade = new Date(m.data_validade);
        const expirada = validade < agora;

        res.json({
            valido: !expirada && m.status === 'ATIVO',
            expirada,
            nome: m.nome,
            cargo: m.cargo,
            convencao: m.conv_estadual,
            registro: m.registro,
            foto_url: m.foto_url,
            data_registro: m.data_registro,
            data_validade: m.data_validade,
            status: m.status,
            mensagem: expirada
                ? 'Esta credencial está expirada.'
                : m.status !== 'ATIVO'
                    ? 'Este ministro não está com status ativo.'
                    : 'Credencial válida e verificada pela CIEIB.'
        });
    } catch (err) {
        console.error('Erro na verificação:', err);
        res.status(500).json({ error: 'Erro ao verificar credencial' });
    }
});

// POST /api/credencial/renovar — Solicitar renovação de credencial
router.post('/renovar', auth, async (req, res) => {
    try {
        const novaValidade = new Date();
        novaValidade.setFullYear(novaValidade.getFullYear() + 1);

        await pool.query(`
            UPDATE ministros SET data_validade = $1, updated_at = NOW() WHERE id = $2
        `, [novaValidade, req.userId]);

        // Notificação
        await pool.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
            VALUES ($1, 'Credencial renovada!', 'Sua credencial ministerial foi renovada com sucesso.', 'success')
        `, [req.userId]);

        res.json({ message: 'Credencial renovada com sucesso!', nova_validade: novaValidade });
    } catch (err) {
        console.error('Erro ao renovar credencial:', err);
        res.status(500).json({ error: 'Erro ao renovar credencial' });
    }
});

module.exports = router;
