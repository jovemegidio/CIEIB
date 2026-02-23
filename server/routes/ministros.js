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
                   telefone, whatsapp, escolaridade,
                   biometria, data_registro, registro, foto_url, status,
                   data_batismo, data_ordenacao, igreja_ordenacao, cidade_ordenacao,
                   funcao_ministerial, nome_igreja, tempo_ministerio, data_consagracao,
                   credencial_aprovada
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
            pai, mae, rg, orgao_expedidor, email, telefone, whatsapp, escolaridade,
            data_batismo, data_ordenacao, igreja_ordenacao, cidade_ordenacao,
            funcao_ministerial, nome_igreja, tempo_ministerio, data_consagracao
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
                data_nasc_conjuge = COALESCE($11, data_nasc_conjuge),
                pai = COALESCE($12, pai),
                mae = COALESCE($13, mae),
                rg = COALESCE($14, rg),
                orgao_expedidor = COALESCE($15, orgao_expedidor),
                email = COALESCE($16, email),
                escolaridade = COALESCE($17, escolaridade),
                data_batismo = COALESCE($18, data_batismo),
                data_ordenacao = COALESCE($19, data_ordenacao),
                igreja_ordenacao = COALESCE($20, igreja_ordenacao),
                cidade_ordenacao = COALESCE($21, cidade_ordenacao),
                funcao_ministerial = COALESCE($22, funcao_ministerial),
                nome_igreja = COALESCE($23, nome_igreja),
                tempo_ministerio = COALESCE($24, tempo_ministerio),
                data_consagracao = COALESCE($25, data_consagracao),
                telefone = COALESCE($26, telefone),
                whatsapp = COALESCE($27, whatsapp),
                updated_at = NOW()
            WHERE id = $28
        `, [
            nome_social || null, doc_estrangeiro || null, sexo || null, data_nascimento || null,
            pais_nascimento || null, estado_nascimento || null, cidade_nascimento || null,
            nacionalidade || null, estado_civil || null, nome_conjuge || null, data_nasc_conjuge || null,
            pai || null, mae || null, rg || null, orgao_expedidor || null, email || null, escolaridade || null,
            data_batismo || null, data_ordenacao || null,
            igreja_ordenacao || null, cidade_ordenacao || null,
            funcao_ministerial || null, nome_igreja || null, tempo_ministerio || null,
            data_consagracao || null, telefone || null, whatsapp || null, req.userId
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

// PUT /api/ministros/me/acesso — Atualizar dados de acesso (email, telefone, whatsapp)
router.put('/me/acesso', auth, async (req, res) => {
    try {
        const { email, telefone, whatsapp } = req.body;

        await pool.query(`
            UPDATE ministros SET
                email = COALESCE($1, email),
                telefone = COALESCE($2, telefone),
                whatsapp = COALESCE($3, whatsapp),
                updated_at = NOW()
            WHERE id = $4
        `, [email || null, telefone || null, whatsapp || null, req.userId]);

        await pool.query(
            'INSERT INTO logs_acesso (ministro_id, acao, ip) VALUES ($1, $2, $3)',
            [req.userId, 'ATUALIZAR_DADOS_ACESSO', req.ip]
        );

        res.json({ message: 'Dados de acesso atualizados com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar dados de acesso:', err);
        res.status(500).json({ error: 'Erro ao atualizar dados de acesso' });
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

// ================================================================
// ENDEREÇO DO MINISTRO
// ================================================================

// GET /api/ministros/endereco — Endereço do ministro logado
router.get('/endereco', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ministro_endereco WHERE ministro_id = $1',
            [req.userId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error('Erro ao buscar endereço:', err);
        res.status(500).json({ error: 'Erro ao buscar endereço' });
    }
});

// PUT /api/ministros/endereco — Criar ou atualizar endereço
router.put('/endereco', auth, async (req, res) => {
    try {
        const { cep, endereco, numero, complemento, bairro, cidade, uf } = req.body;

        const exists = await pool.query(
            'SELECT id FROM ministro_endereco WHERE ministro_id = $1',
            [req.userId]
        );

        if (exists.rows.length > 0) {
            await pool.query(`
                UPDATE ministro_endereco SET
                    cep = COALESCE($1, cep), endereco = COALESCE($2, endereco),
                    numero = COALESCE($3, numero), complemento = $4,
                    bairro = COALESCE($5, bairro), cidade = COALESCE($6, cidade),
                    uf = COALESCE($7, uf), updated_at = NOW()
                WHERE ministro_id = $8
            `, [cep, endereco, numero, complemento || null, bairro, cidade, uf, req.userId]);
        } else {
            await pool.query(`
                INSERT INTO ministro_endereco (ministro_id, cep, endereco, numero, complemento, bairro, cidade, uf)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `, [req.userId, cep, endereco, numero, complemento || null, bairro, cidade, uf]);
        }

        res.json({ message: 'Endereço atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar endereço:', err);
        res.status(500).json({ error: 'Erro ao atualizar endereço' });
    }
});

// ================================================================
// FILHOS DO MINISTRO
// ================================================================

// GET /api/ministros/filhos — Filhos do ministro logado
router.get('/filhos', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ministro_filhos WHERE ministro_id = $1 ORDER BY nome',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar filhos:', err);
        res.status(500).json({ error: 'Erro ao buscar filhos' });
    }
});

// POST /api/ministros/filhos — Adicionar filho
router.post('/filhos', auth, async (req, res) => {
    try {
        const { nome, data_nascimento } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const result = await pool.query(
            'INSERT INTO ministro_filhos (ministro_id, nome, data_nascimento) VALUES ($1,$2,$3) RETURNING *',
            [req.userId, nome, data_nascimento || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar filho:', err);
        res.status(500).json({ error: 'Erro ao adicionar filho' });
    }
});

// DELETE /api/ministros/filhos/:id — Remover filho
router.delete('/filhos/:id', auth, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM ministro_filhos WHERE id = $1 AND ministro_id = $2',
            [req.params.id, req.userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao remover filho:', err);
        res.status(500).json({ error: 'Erro ao remover filho' });
    }
});

// ================================================================
// DOCUMENTOS DO MINISTRO
// ================================================================

// GET /api/ministros/documentos — Documentos do ministro logado
router.get('/documentos', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ministro_documentos WHERE ministro_id = $1',
            [req.userId]
        );
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error('Erro ao buscar documentos:', err);
        res.status(500).json({ error: 'Erro ao buscar documentos' });
    }
});

module.exports = router;
