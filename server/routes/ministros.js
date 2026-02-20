/* ==============================================================
   Rotas de Ministros — CRUD de dados pessoais
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload de foto
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'fotos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `ministro_${req.userId}_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
});

// GET /api/ministros/me — Dados do ministro logado
router.get('/me', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, cpf, nome, nome_social, doc_estrangeiro, cargo, conv_estadual,
                   sexo, data_nascimento, pais_nascimento, estado_nascimento,
                   cidade_nascimento, nacionalidade, estado_civil, nome_conjuge,
                   data_nasc_conjuge, pai, mae, rg, orgao_expedidor, email,
                   biometria, data_registro, registro, foto_url, status
            FROM ministros WHERE id = $1
        `, [req.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ministro não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao buscar ministro:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do ministro' });
    }
});

// PUT /api/ministros/me — Atualizar dados do ministro logado
router.put('/me', auth, async (req, res) => {
    try {
        const {
            nome_social, doc_estrangeiro, sexo, data_nascimento,
            pais_nascimento, estado_nascimento, cidade_nascimento,
            nacionalidade, estado_civil, nome_conjuge, data_nasc_conjuge,
            pai, mae, rg, orgao_expedidor, email
        } = req.body;

        await pool.query(`
            UPDATE ministros SET
                nome_social = COALESCE($1, nome_social),
                doc_estrangeiro = COALESCE($2, doc_estrangeiro),
                sexo = COALESCE($3, sexo),
                data_nascimento = COALESCE($4, data_nascimento),
                pais_nascimento = COALESCE($5, pais_nascimento),
                estado_nascimento = COALESCE($6, estado_nascimento),
                cidade_nascimento = COALESCE($7, cidade_nascimento),
                nacionalidade = COALESCE($8, nacionalidade),
                estado_civil = COALESCE($9, estado_civil),
                nome_conjuge = COALESCE($10, nome_conjuge),
                data_nasc_conjuge = $11,
                pai = COALESCE($12, pai),
                mae = COALESCE($13, mae),
                rg = COALESCE($14, rg),
                orgao_expedidor = COALESCE($15, orgao_expedidor),
                email = COALESCE($16, email),
                updated_at = NOW()
            WHERE id = $17
        `, [
            nome_social, doc_estrangeiro, sexo, data_nascimento || null,
            pais_nascimento, estado_nascimento, cidade_nascimento,
            nacionalidade, estado_civil, nome_conjuge, data_nasc_conjuge || null,
            pai, mae, rg, orgao_expedidor, email, req.userId
        ]);

        // Log
        await pool.query(
            'INSERT INTO logs_acesso (ministro_id, acao, ip) VALUES ($1, $2, $3)',
            [req.userId, 'ATUALIZAR_CADASTRO', req.ip]
        );

        res.json({ message: 'Dados atualizados com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar ministro:', err);
        res.status(500).json({ error: 'Erro ao atualizar dados' });
    }
});

// POST /api/ministros/foto — Upload de foto
router.post('/foto', auth, upload.single('foto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma foto enviada' });
        }

        const fotoUrl = `/uploads/fotos/${req.file.filename}`;
        await pool.query(
            'UPDATE ministros SET foto_url = $1, updated_at = NOW() WHERE id = $2',
            [fotoUrl, req.userId]
        );

        res.json({ message: 'Foto enviada com sucesso', foto_url: fotoUrl });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao enviar foto' });
    }
});

module.exports = router;
