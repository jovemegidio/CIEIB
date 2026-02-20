/* ==============================================================
   Rotas de Convenções do Ministro
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/convencoes — Convenções do ministro logado
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ministro_convencoes WHERE ministro_id = $1 ORDER BY sigla',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar convenções' });
    }
});

module.exports = router;
