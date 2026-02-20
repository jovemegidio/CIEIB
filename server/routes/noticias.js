/* ==============================================================
   Rotas de Notícias — Público (site) + Admin
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');

// GET /api/noticias — Listar notícias publicadas (público)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 9, categoria } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM noticias WHERE publicada = TRUE';
        const params = [];

        if (categoria) {
            params.push(categoria);
            query += ` AND categoria = $${params.length}`;
        }

        // Total para paginação
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        query += ' ORDER BY data_publicacao DESC';
        params.push(limit);
        query += ` LIMIT $${params.length}`;
        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        res.json({
            noticias: result.rows,
            total,
            pagina: parseInt(page),
            totalPaginas: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Erro ao buscar notícias:', err);
        res.status(500).json({ error: 'Erro ao buscar notícias' });
    }
});

// GET /api/noticias/:id — Detalhes de uma notícia
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM noticias WHERE id = $1 AND publicada = TRUE',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notícia não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar notícia' });
    }
});

module.exports = router;
