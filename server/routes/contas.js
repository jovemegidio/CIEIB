/* ==============================================================
   Rotas de Contas a Receber
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

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

module.exports = router;
