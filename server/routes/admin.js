/* ==============================================================
   Rotas Administrativas — CRUD completo
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---- Upload config ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `admin-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ================================================================
// AUTH ADMIN
// ================================================================

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });

        const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND ativo = true', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

        const admin = result.rows[0];
        const senhaOk = await bcrypt.compare(senha, admin.senha);
        if (!senhaOk) return res.status(401).json({ error: 'Credenciais inválidas' });

        await pool.query('UPDATE admins SET ultimo_acesso = NOW() WHERE id = $1', [admin.id]);

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email, role: admin.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/me
router.get('/me', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT id, nome, email, role, ultimo_acesso FROM admins WHERE id = $1', [req.adminId]);
        if (r.rows.length === 0) return res.status(404).json({ error: 'Admin não encontrado' });
        res.json(r.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================================================================
// DASHBOARD STATS
// ================================================================
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const [ministros, eventos, noticias, cursos, contatos, matriculas] = await Promise.all([
            pool.query("SELECT COUNT(*) as total FROM ministros"),
            pool.query("SELECT COUNT(*) as total FROM eventos"),
            pool.query("SELECT COUNT(*) as total FROM noticias"),
            pool.query("SELECT COUNT(*) as total FROM cursos"),
            pool.query("SELECT COUNT(*) as total FROM contatos WHERE lida = false"),
            pool.query("SELECT COUNT(*) as total FROM curso_matriculas"),
        ]);

        const recentMinistros = await pool.query('SELECT id, nome, cargo, status, created_at FROM ministros ORDER BY created_at DESC LIMIT 5');
        const recentContatos = await pool.query('SELECT id, nome, assunto, created_at, lida FROM contatos ORDER BY created_at DESC LIMIT 5');

        res.json({
            stats: {
                ministros: parseInt(ministros.rows[0].total),
                eventos: parseInt(eventos.rows[0].total),
                noticias: parseInt(noticias.rows[0].total),
                cursos: parseInt(cursos.rows[0].total),
                contatos_pendentes: parseInt(contatos.rows[0].total),
                matriculas: parseInt(matriculas.rows[0].total),
            },
            recentMinistros: recentMinistros.rows,
            recentContatos: recentContatos.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================================================================
// NOTÍCIAS CRUD
// ================================================================
router.get('/noticias', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM noticias ORDER BY data_publicacao DESC');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/noticias', adminAuth, async (req, res) => {
    try {
        const { titulo, resumo, conteudo, imagem_url, categoria, destaque } = req.body;
        const r = await pool.query(
            'INSERT INTO noticias (titulo, resumo, conteudo, imagem_url, categoria, destaque) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [titulo, resumo, conteudo, imagem_url, categoria, destaque || false]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/noticias/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, resumo, conteudo, imagem_url, categoria, destaque, publicada } = req.body;
        const r = await pool.query(
            `UPDATE noticias SET titulo=$1, resumo=$2, conteudo=$3, imagem_url=$4, categoria=$5, destaque=$6, publicada=$7 WHERE id=$8 RETURNING *`,
            [titulo, resumo, conteudo, imagem_url, categoria, destaque, publicada, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/noticias/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM noticias WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// EVENTOS CRUD
// ================================================================
router.get('/eventos', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM eventos ORDER BY data_evento DESC');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/eventos', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, local, data_evento, hora_inicio, data_termino, status, categoria, valor } = req.body;
        const r = await pool.query(
            'INSERT INTO eventos (titulo, descricao, local, data_evento, hora_inicio, data_termino, status, categoria, valor) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [titulo, descricao, local, data_evento, hora_inicio, data_termino, status || 'Aberto', categoria, valor || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/eventos/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, local, data_evento, hora_inicio, data_termino, status, categoria, valor } = req.body;
        const r = await pool.query(
            `UPDATE eventos SET titulo=$1, descricao=$2, local=$3, data_evento=$4, hora_inicio=$5, data_termino=$6, status=$7, categoria=$8, valor=$9 WHERE id=$10 RETURNING *`,
            [titulo, descricao, local, data_evento, hora_inicio, data_termino, status, categoria, valor, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/eventos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM evento_inscricoes WHERE evento_id = $1', [req.params.id]);
        await pool.query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// CURSOS CRUD (Admin)
// ================================================================
router.get('/cursos', adminAuth, async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT c.*, 
                (SELECT COUNT(*) FROM curso_modulos WHERE curso_id = c.id) as total_modulos,
                (SELECT COUNT(*) FROM curso_matriculas WHERE curso_id = c.id) as total_matriculas
            FROM cursos c ORDER BY c.created_at DESC
        `);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cursos', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, categoria, nivel, carga_horaria, certificado, imagem_url } = req.body;
        const r = await pool.query(
            'INSERT INTO cursos (titulo, descricao, categoria, nivel, carga_horaria, certificado, imagem_url, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [titulo, descricao, categoria, nivel, carga_horaria || 0, certificado !== false, imagem_url, 'ativo']
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/cursos/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, categoria, nivel, carga_horaria, certificado, imagem_url, status } = req.body;
        const r = await pool.query(
            `UPDATE cursos SET titulo=$1, descricao=$2, categoria=$3, nivel=$4, carga_horaria=$5, certificado=$6, imagem_url=$7, status=$8 WHERE id=$9 RETURNING *`,
            [titulo, descricao, categoria, nivel, carga_horaria, certificado, imagem_url, status, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/cursos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM cursos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- Módulos ----
router.get('/cursos/:id/modulos', adminAuth, async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT m.*, (SELECT COUNT(*) FROM curso_aulas WHERE modulo_id = m.id) as total_aulas
            FROM curso_modulos m WHERE m.curso_id = $1 ORDER BY m.ordem
        `, [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/cursos/:id/modulos', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, ordem } = req.body;
        const r = await pool.query(
            'INSERT INTO curso_modulos (curso_id, titulo, descricao, ordem) VALUES ($1,$2,$3,$4) RETURNING *',
            [req.params.id, titulo, descricao, ordem || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/modulos/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, descricao, ordem } = req.body;
        const r = await pool.query(
            'UPDATE curso_modulos SET titulo=$1, descricao=$2, ordem=$3 WHERE id=$4 RETURNING *',
            [titulo, descricao, ordem, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/modulos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM curso_modulos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- Aulas ----
router.get('/modulos/:id/aulas', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM curso_aulas WHERE modulo_id = $1 ORDER BY ordem', [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/modulos/:id/aulas', adminAuth, async (req, res) => {
    try {
        const { titulo, tipo, duracao_minutos, conteudo, ordem } = req.body;
        const r = await pool.query(
            'INSERT INTO curso_aulas (modulo_id, titulo, tipo, duracao_minutos, conteudo, ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [req.params.id, titulo, tipo || 'texto', duracao_minutos || 0, conteudo, ordem || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/aulas/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, tipo, duracao_minutos, conteudo, ordem } = req.body;
        const r = await pool.query(
            'UPDATE curso_aulas SET titulo=$1, tipo=$2, duracao_minutos=$3, conteudo=$4, ordem=$5 WHERE id=$6 RETURNING *',
            [titulo, tipo, duracao_minutos, conteudo, ordem, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/aulas/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM curso_aulas WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// MINISTROS (Admin view)
// ================================================================
router.get('/ministros', adminAuth, async (req, res) => {
    try {
        const { status, search, page = 1 } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;
        let where = [];
        let params = [];
        let idx = 1;

        if (status) { where.push(`status = $${idx++}`); params.push(status); }
        if (search) { where.push(`(nome ILIKE $${idx++} OR cpf ILIKE $${idx++} OR email ILIKE $${idx++})`); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

        const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const countR = await pool.query(`SELECT COUNT(*) as total FROM ministros ${whereStr}`, params);
        const r = await pool.query(`SELECT id, cpf, nome, cargo, email, status, registro, created_at FROM ministros ${whereStr} ORDER BY nome LIMIT $${idx++} OFFSET $${idx++}`, [...params, limit, offset]);

        res.json({ ministros: r.rows, total: parseInt(countR.rows[0].total), page: parseInt(page), pages: Math.ceil(countR.rows[0].total / limit) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ministros/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const r = await pool.query('UPDATE ministros SET status = $1 WHERE id = $2 RETURNING id, nome, status', [status, req.params.id]);
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// CONTATOS (mensagens do site)
// ================================================================
router.get('/contatos', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM contatos ORDER BY created_at DESC');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/contatos/:id/lida', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('UPDATE contatos SET lida = true WHERE id = $1 RETURNING *', [req.params.id]);
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/contatos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM contatos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// CONFIGURAÇÕES DO SITE
// ================================================================
router.get('/configuracoes', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM configuracoes ORDER BY chave');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/configuracoes', adminAuth, async (req, res) => {
    try {
        const { configs } = req.body; // [{chave, valor}]
        for (const c of configs) {
            await pool.query(
                'INSERT INTO configuracoes (chave, valor) VALUES ($1, $2) ON CONFLICT (chave) DO UPDATE SET valor = $2',
                [c.chave, c.valor]
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// CONTEÚDOS DE PÁGINAS (CMS)
// ================================================================
router.get('/conteudos', adminAuth, async (req, res) => {
    try {
        const { pagina } = req.query;
        let q = 'SELECT * FROM pagina_conteudos';
        let params = [];
        if (pagina) { q += ' WHERE pagina = $1'; params.push(pagina); }
        q += ' ORDER BY pagina, ordem';
        const r = await pool.query(q, params);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/conteudos', adminAuth, async (req, res) => {
    try {
        const { pagina, secao, titulo, conteudo, imagem_url, ordem } = req.body;
        const r = await pool.query(
            `INSERT INTO pagina_conteudos (pagina, secao, titulo, conteudo, imagem_url, ordem)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (pagina, secao) DO UPDATE SET titulo=$3, conteudo=$4, imagem_url=$5, ordem=$6, updated_at=NOW()
             RETURNING *`,
            [pagina, secao, titulo, conteudo, imagem_url, ordem || 0]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/conteudos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM pagina_conteudos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// DIRETORIA CRUD
// ================================================================
router.get('/diretoria', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM diretoria ORDER BY ordem, nome');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/diretoria', adminAuth, async (req, res) => {
    try {
        const { nome, cargo, descricao, foto_url, email, ordem } = req.body;
        const r = await pool.query(
            'INSERT INTO diretoria (nome, cargo, descricao, foto_url, email, ordem) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [nome, cargo, descricao, foto_url, email, ordem || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/diretoria/:id', adminAuth, async (req, res) => {
    try {
        const { nome, cargo, descricao, foto_url, email, ordem, ativo } = req.body;
        const r = await pool.query(
            'UPDATE diretoria SET nome=$1, cargo=$2, descricao=$3, foto_url=$4, email=$5, ordem=$6, ativo=$7 WHERE id=$8 RETURNING *',
            [nome, cargo, descricao, foto_url, email, ordem, ativo, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/diretoria/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM diretoria WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// REDES SOCIAIS CRUD
// ================================================================
router.get('/redes-sociais', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM redes_sociais ORDER BY ordem');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/redes-sociais', adminAuth, async (req, res) => {
    try {
        const { nome, url, icone, ordem } = req.body;
        const r = await pool.query(
            'INSERT INTO redes_sociais (nome, url, icone, ordem) VALUES ($1,$2,$3,$4) RETURNING *',
            [nome, url, icone, ordem || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/redes-sociais/:id', adminAuth, async (req, res) => {
    try {
        const { nome, url, icone, ordem, ativa } = req.body;
        const r = await pool.query(
            'UPDATE redes_sociais SET nome=$1, url=$2, icone=$3, ordem=$4, ativa=$5 WHERE id=$6 RETURNING *',
            [nome, url, icone, ordem, ativa, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/redes-sociais/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM redes_sociais WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// NOTIFICAÇÕES SITE
// ================================================================
router.get('/notificacoes-site', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM notificacoes_site ORDER BY created_at DESC');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notificacoes-site', adminAuth, async (req, res) => {
    try {
        const { titulo, mensagem, tipo, link, ativa } = req.body;
        const r = await pool.query(
            'INSERT INTO notificacoes_site (titulo, mensagem, tipo, link, ativa) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [titulo, mensagem, tipo || 'info', link, ativa !== false]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notificacoes-site/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, mensagem, tipo, link, ativa } = req.body;
        const r = await pool.query(
            'UPDATE notificacoes_site SET titulo=$1, mensagem=$2, tipo=$3, link=$4, ativa=$5 WHERE id=$6 RETURNING *',
            [titulo, mensagem, tipo, link, ativa, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/notificacoes-site/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM notificacoes_site WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// UPLOAD DE MÍDIAS
// ================================================================
router.get('/midias', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM midias ORDER BY created_at DESC');
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/midias/upload', adminAuth, upload.single('arquivo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        const url = `/uploads/${req.file.filename}`;
        const tipo = req.file.mimetype.startsWith('image') ? 'imagem' : 'documento';
        const r = await pool.query(
            'INSERT INTO midias (titulo, tipo, url, tamanho, admin_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [req.body.titulo || req.file.originalname, tipo, url, req.file.size, req.adminId]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/midias/:id', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT url FROM midias WHERE id = $1', [req.params.id]);
        if (r.rows[0]) {
            const filePath = path.join(__dirname, '..', '..', r.rows[0].url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await pool.query('DELETE FROM midias WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
