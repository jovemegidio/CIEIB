/* ==============================================================
   Rotas de Contas a Receber
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---- Multer config para comprovante PIX ----
const comprovDir = path.join(__dirname, '..', '..', 'uploads', 'comprovantes');
if (!fs.existsSync(comprovDir)) fs.mkdirSync(comprovDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, comprovDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `comprov_${req.userId}_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
});

// GET /api/contas — Contas do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const { status } = req.query; // ABERTO, QUITADO, etc
        let query = 'SELECT * FROM contas_receber WHERE ministro_id = $1';
        const params = [req.userId];

        if (status) {
            query += ' AND status = $2';
            params.push(status.toUpperCase());
        }

        query += ' ORDER BY data_vencimento DESC';

        const result = await pool.query(query, params);

        // Calcular totais
        const totais = {
            total: 0, descontos: 0, pago: 0, saldo: 0
        };
        result.rows.forEach(c => {
            totais.total += parseFloat(c.valor);
            totais.descontos += parseFloat(c.desconto);
            totais.pago += parseFloat(c.valor_pago);
            totais.saldo += parseFloat(c.saldo);
        });

        res.json({ contas: result.rows, totais });
    } catch (err) {
        console.error('Erro ao buscar contas:', err);
        res.status(500).json({ error: 'Erro ao buscar contas a receber' });
    }
});

// GET /api/contas/resumo — Resumo agrupado por serviço
router.get('/resumo', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT servico,
                   SUM(valor) as total,
                   SUM(desconto) as descontos,
                   SUM(valor_pago) as quitado,
                   SUM(saldo) as em_aberto
            FROM contas_receber
            WHERE ministro_id = $1
            GROUP BY servico
            ORDER BY servico
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

// POST /api/contas/:id/solicitar-boleto — Solicitar boleto para uma conta
router.post('/:id/solicitar-boleto', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se a conta pertence ao ministro
        const conta = await pool.query(
            'SELECT * FROM contas_receber WHERE id = $1 AND ministro_id = $2 AND status = $3',
            [id, req.userId, 'ABERTO']
        );

        if (conta.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada ou já quitada' });
        }

        await pool.query(`
            UPDATE contas_receber
            SET forma_pagamento = 'boleto', boleto_solicitado = true, boleto_solicitado_em = NOW()
            WHERE id = $1
        `, [id]);

        // Notificação
        await pool.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
            VALUES ($1, 'Boleto Solicitado', $2, 'info')
        `, [req.userId, `Boleto para "${conta.rows[0].servico}" foi solicitado. Você será notificado quando estiver disponível.`]);

        res.json({
            message: 'Boleto solicitado com sucesso!',
            link_pagamento: 'https://www.asaas.com/c/opw88e6g4dn9xckp'
        });
    } catch (err) {
        console.error('Erro ao solicitar boleto:', err);
        res.status(500).json({ error: 'Erro ao solicitar boleto' });
    }
});

// POST /api/contas/:id/enviar-comprovante — Upload de comprovante PIX
router.post('/:id/enviar-comprovante', auth, upload.single('comprovante'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Verificar se a conta pertence ao ministro
        const conta = await pool.query(
            'SELECT * FROM contas_receber WHERE id = $1 AND ministro_id = $2 AND status = $3',
            [id, req.userId, 'ABERTO']
        );

        if (conta.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada ou já quitada' });
        }

        const fileUrl = `/uploads/comprovantes/${req.file.filename}`;

        await pool.query(`
            UPDATE contas_receber
            SET forma_pagamento = 'pix', comprovante_pix_url = $1
            WHERE id = $2
        `, [fileUrl, id]);

        // Notificação
        await pool.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
            VALUES ($1, 'Comprovante PIX Enviado', $2, 'success')
        `, [req.userId, `Comprovante PIX para "${conta.rows[0].servico}" recebido. Aguarde a confirmação.`]);

        res.json({
            message: 'Comprovante enviado com sucesso! Aguarde a confirmação.',
            comprovante_url: fileUrl
        });
    } catch (err) {
        console.error('Erro ao enviar comprovante:', err);
        res.status(500).json({ error: 'Erro ao enviar comprovante' });
    }
});

// POST /api/contas/solicitar-carteirinha — Solicitar carteirinha física
router.post('/solicitar-carteirinha', auth, async (req, res) => {
    try {
        const { endereco_entrega, telefone, observacao } = req.body;

        if (!endereco_entrega) {
            return res.status(400).json({ error: 'Endereço de entrega é obrigatório' });
        }

        // Buscar dados do ministro
        const ministro = await pool.query(
            'SELECT nome, cargo FROM ministros WHERE id = $1',
            [req.userId]
        );

        if (ministro.rows.length === 0) {
            return res.status(404).json({ error: 'Ministro não encontrado' });
        }

        const m = ministro.rows[0];

        // Verificar se já tem solicitação pendente
        const pendente = await pool.query(
            "SELECT id FROM solicitacoes_carteirinha WHERE ministro_id = $1 AND status = 'PENDENTE'",
            [req.userId]
        );

        if (pendente.rows.length > 0) {
            return res.status(400).json({ error: 'Você já possui uma solicitação pendente' });
        }

        const linkPagamento = 'https://www.asaas.com/c/rgza79nqnp1os846';

        await pool.query(`
            INSERT INTO solicitacoes_carteirinha (ministro_id, nome_completo, cargo, endereco_entrega, telefone, observacao, link_pagamento)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [req.userId, m.nome, m.cargo, endereco_entrega, telefone || null, observacao || null, linkPagamento]);

        // Notificação
        await pool.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
            VALUES ($1, 'Carteirinha Física Solicitada', 'Sua solicitação de carteirinha física foi registrada. Efetue o pagamento para concluir.', 'info')
        `, [req.userId]);

        res.json({
            message: 'Solicitação registrada! Efetue o pagamento para concluir.',
            link_pagamento: linkPagamento
        });
    } catch (err) {
        console.error('Erro ao solicitar carteirinha:', err);
        res.status(500).json({ error: 'Erro ao solicitar carteirinha física' });
    }
});

// GET /api/contas/carteirinha-status — Status da solicitação de carteirinha
router.get('/carteirinha-status', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM solicitacoes_carteirinha WHERE ministro_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.json({ tem_solicitacao: false });
        }

        res.json({ tem_solicitacao: true, solicitacao: result.rows[0] });
    } catch (err) {
        console.error('Erro ao buscar status carteirinha:', err);
        res.status(500).json({ error: 'Erro ao buscar status' });
    }
});

module.exports = router;
