/* ==============================================================
   Rotas de Eventos e Inscrições
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/eventos — Listar eventos (público para o site)
router.get('/', async (req, res) => {
    try {
        const { status, limit } = req.query;
        let query = 'SELECT * FROM eventos';
        const params = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY data_evento DESC';

        if (limit) {
            query += ` LIMIT ${parseInt(limit)}`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

// GET /api/eventos/inscricoes — Inscrições do ministro logado
router.get('/inscricoes', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ei.*, e.titulo, e.convencao, e.status as evento_status,
                   e.data_evento, e.hora_inicio, e.data_termino
            FROM evento_inscricoes ei
            JOIN eventos e ON e.id = ei.evento_id
            WHERE ei.ministro_id = $1
            ORDER BY ei.data_inscricao DESC
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }
});

// POST /api/eventos/:id/inscrever — Inscrever ministro em evento
router.post('/:id/inscrever', auth, async (req, res) => {
    try {
        const eventoId = req.params.id;

        // Verificar se já está inscrito
        const existe = await pool.query(
            'SELECT id FROM evento_inscricoes WHERE evento_id = $1 AND ministro_id = $2',
            [eventoId, req.userId]
        );
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Você já está inscrito neste evento' });
        }

        // Buscar evento
        const evento = await pool.query('SELECT * FROM eventos WHERE id = $1', [eventoId]);
        if (evento.rows.length === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }

        const e = evento.rows[0];
        const numInsc = `${Math.floor(100000 + Math.random() * 900000)}`;

        await pool.query(`
            INSERT INTO evento_inscricoes (evento_id, ministro_id, numero_inscricao, valor, status_inscricao)
            VALUES ($1, $2, $3, $4, 'ABERTO')
        `, [eventoId, req.userId, numInsc, e.valor]);

        res.json({ message: 'Inscrição realizada com sucesso', numero: numInsc });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao realizar inscrição' });
    }
});

module.exports = router;
