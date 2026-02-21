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

// GET /api/admin/login — prevent 405 on browser prefetch/navigation
router.get('/login', (req, res) => {
    res.status(200).json({ error: 'Use POST para autenticar', redirect: '/painel-admin' });
});

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
// MINISTROS (Admin view) — GESTÃO COMPLETA DE MEMBROS
// ================================================================
router.get('/ministros', adminAuth, async (req, res) => {
    try {
        const { status, search, page = 1, anuidade, credencial, cargo } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;
        let where = [];
        let params = [];
        let idx = 1;

        if (status) { where.push(`m.status = $${idx++}`); params.push(status); }
        if (cargo) { where.push(`m.cargo = $${idx++}`); params.push(cargo); }
        if (anuidade) { where.push(`m.anuidade_status = $${idx++}`); params.push(anuidade); }
        if (credencial) { where.push(`m.credencial_status = $${idx++}`); params.push(credencial); }
        if (search) { where.push(`(m.nome ILIKE $${idx++} OR m.cpf ILIKE $${idx++} OR m.email ILIKE $${idx++} OR m.registro ILIKE $${idx++})`); params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

        const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const countR = await pool.query(`SELECT COUNT(*) as total FROM ministros m ${whereStr}`, params);
        const r = await pool.query(`
            SELECT m.id, m.cpf, m.nome, m.cargo, m.email, m.telefone, m.whatsapp, m.status, m.registro,
                   m.foto_url, m.nome_igreja, m.data_nascimento, m.sexo, m.estado_civil,
                   m.anuidade_status, m.credencial_status, m.aprovado, m.created_at, m.data_registro,
                   m.funcao_ministerial, m.tempo_ministerio, m.data_consagracao, m.escolaridade,
                   e.cidade, e.uf
            FROM ministros m
            LEFT JOIN ministro_endereco e ON e.ministro_id = m.id
            ${whereStr}
            ORDER BY m.nome
            LIMIT $${idx++} OFFSET $${idx++}
        `, [...params, limit, offset]);

        res.json({ ministros: r.rows, total: parseInt(countR.rows[0].total), page: parseInt(page), pages: Math.ceil(countR.rows[0].total / limit) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/ministros/:id — Detalhe completo do membro
router.get('/ministros/:id', adminAuth, async (req, res) => {
    try {
        const mid = req.params.id;
        const [ministro, endereco, filhos, docs, convencoes, boletos, credenciais, historico, contas] = await Promise.all([
            pool.query('SELECT * FROM ministros WHERE id = $1', [mid]),
            pool.query('SELECT * FROM ministro_endereco WHERE ministro_id = $1', [mid]),
            pool.query('SELECT * FROM ministro_filhos WHERE ministro_id = $1 ORDER BY nome', [mid]),
            pool.query('SELECT * FROM ministro_documentos WHERE ministro_id = $1', [mid]),
            pool.query('SELECT * FROM ministro_convencoes WHERE ministro_id = $1', [mid]),
            pool.query('SELECT * FROM ministro_boletos WHERE ministro_id = $1 ORDER BY ano DESC, mes DESC', [mid]),
            pool.query('SELECT * FROM ministro_credenciais WHERE ministro_id = $1 ORDER BY created_at DESC', [mid]),
            pool.query('SELECT * FROM ministro_historico WHERE ministro_id = $1 ORDER BY created_at DESC LIMIT 50', [mid]),
            pool.query('SELECT * FROM contas_receber WHERE ministro_id = $1 ORDER BY data_vencimento DESC', [mid]),
        ]);

        if (ministro.rows.length === 0) return res.status(404).json({ error: 'Ministro não encontrado' });

        res.json({
            ...ministro.rows[0],
            endereco: endereco.rows[0] || null,
            filhos: filhos.rows,
            documentos: docs.rows[0] || null,
            convencoes: convencoes.rows,
            boletos: boletos.rows,
            credenciais: credenciais.rows,
            historico: historico.rows,
            contas: contas.rows,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/ministros/:id — Editar dados do membro
router.put('/ministros/:id', adminAuth, async (req, res) => {
    try {
        const { nome, cargo, email, telefone, whatsapp, status, nome_igreja, funcao_ministerial,
                tempo_ministerio, data_consagracao, escolaridade, registro, observacoes_admin,
                anuidade_status, credencial_status, aprovado,
                data_batismo, data_ordenacao, igreja_ordenacao, cidade_ordenacao } = req.body;
        const r = await pool.query(`
            UPDATE ministros SET
                nome = COALESCE($1, nome), cargo = COALESCE($2, cargo), email = COALESCE($3, email),
                telefone = COALESCE($4, telefone), whatsapp = COALESCE($5, whatsapp), status = COALESCE($6, status),
                nome_igreja = COALESCE($7, nome_igreja), funcao_ministerial = COALESCE($8, funcao_ministerial),
                tempo_ministerio = COALESCE($9, tempo_ministerio), data_consagracao = COALESCE($10, data_consagracao),
                escolaridade = COALESCE($11, escolaridade), registro = COALESCE($12, registro),
                observacoes_admin = COALESCE($13, observacoes_admin), anuidade_status = COALESCE($14, anuidade_status),
                credencial_status = COALESCE($15, credencial_status), aprovado = COALESCE($16, aprovado),
                data_batismo = COALESCE($17, data_batismo), data_ordenacao = COALESCE($18, data_ordenacao),
                igreja_ordenacao = COALESCE($19, igreja_ordenacao), cidade_ordenacao = COALESCE($20, cidade_ordenacao),
                updated_at = NOW()
            WHERE id = $21 RETURNING id, nome, status
        `, [nome, cargo, email, telefone, whatsapp, status, nome_igreja, funcao_ministerial,
            tempo_ministerio, data_consagracao || null, escolaridade, registro, observacoes_admin,
            anuidade_status, credencial_status, aprovado,
            data_batismo || null, data_ordenacao || null, igreja_ordenacao, cidade_ordenacao,
            req.params.id]);

        // Log histórico
        await pool.query(
            'INSERT INTO ministro_historico (ministro_id, acao, descricao, admin_nome) VALUES ($1, $2, $3, $4)',
            [req.params.id, 'EDIÇÃO', 'Dados do membro atualizados pelo admin', 'Administrador']
        );

        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/ministros/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const r = await pool.query('UPDATE ministros SET status = $1 WHERE id = $2 RETURNING id, nome, status', [status, req.params.id]);

        await pool.query(
            'INSERT INTO ministro_historico (ministro_id, acao, descricao, admin_nome) VALUES ($1, $2, $3, $4)',
            [req.params.id, 'ALTERAÇÃO DE STATUS', `Status alterado para ${status}`, 'Administrador']
        );

        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/ministros/:id
router.delete('/ministros/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM ministros WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// BOLETOS / ANUIDADES
// ================================================================
router.get('/ministros/:id/boletos', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM ministro_boletos WHERE ministro_id = $1 ORDER BY ano DESC, mes DESC', [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ministros/:id/boletos', adminAuth, async (req, res) => {
    try {
        const { tipo, referencia, ano, mes, valor, data_vencimento, status, observacao, arquivo_boleto_url } = req.body;
        const r = await pool.query(
            `INSERT INTO ministro_boletos (ministro_id, tipo, referencia, ano, mes, valor, data_vencimento, status, observacao, arquivo_boleto_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [req.params.id, tipo || 'anuidade', referencia, ano, mes, valor || 0, data_vencimento, status || 'pendente', observacao, arquivo_boleto_url]
        );

        await pool.query(
            'INSERT INTO ministro_historico (ministro_id, acao, descricao, admin_nome) VALUES ($1, $2, $3, $4)',
            [req.params.id, 'BOLETO ADICIONADO', `Boleto ${tipo || 'anuidade'} - ${referencia || ''} - R$ ${valor || 0}`, 'Administrador']
        );

        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/boletos/:id', adminAuth, async (req, res) => {
    try {
        const { status, data_pagamento, valor_pago, arquivo_comprovante_url, observacao } = req.body;
        const r = await pool.query(
            `UPDATE ministro_boletos SET status=COALESCE($1,status), data_pagamento=$2, valor_pago=COALESCE($3,valor_pago),
             arquivo_comprovante_url=COALESCE($4,arquivo_comprovante_url), observacao=COALESCE($5,observacao), updated_at=NOW()
             WHERE id=$6 RETURNING *`,
            [status, data_pagamento || null, valor_pago, arquivo_comprovante_url, observacao, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/boletos/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM ministro_boletos WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload de boleto/comprovante
router.post('/ministros/:id/upload-boleto', adminAuth, upload.single('arquivo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        const url = `/uploads/${req.file.filename}`;
        res.json({ url, filename: req.file.filename, size: req.file.size });
    } catch (err) { res.status(500).json({ error: 'Erro ao fazer upload' }); }
});

// ================================================================
// CREDENCIAIS DIGITAIS
// ================================================================
router.get('/ministros/:id/credenciais', adminAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM ministro_credenciais WHERE ministro_id = $1 ORDER BY created_at DESC', [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ministros/:id/credenciais', adminAuth, async (req, res) => {
    try {
        const { numero_credencial, tipo, data_emissao, data_validade, arquivo_frente_url,
                arquivo_verso_url, arquivo_pdf_url, status, observacao } = req.body;

        // Gerar número de credencial se não fornecido
        const numCred = numero_credencial || `CIEIB-${new Date().getFullYear()}-${String(req.params.id).padStart(4, '0')}`;

        const r = await pool.query(
            `INSERT INTO ministro_credenciais (ministro_id, numero_credencial, tipo, data_emissao, data_validade,
             arquivo_frente_url, arquivo_verso_url, arquivo_pdf_url, status, observacao, emitido_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [req.params.id, numCred, tipo || 'ministro', data_emissao || new Date(), data_validade,
             arquivo_frente_url, arquivo_verso_url, arquivo_pdf_url, status || 'ativa', observacao, 'Administrador']
        );

        // Atualizar status no ministro
        await pool.query('UPDATE ministros SET credencial_status = $1 WHERE id = $2', ['ativa', req.params.id]);

        await pool.query(
            'INSERT INTO ministro_historico (ministro_id, acao, descricao, admin_nome) VALUES ($1, $2, $3, $4)',
            [req.params.id, 'CREDENCIAL EMITIDA', `Credencial ${numCred} emitida`, 'Administrador']
        );

        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/credenciais/:id', adminAuth, async (req, res) => {
    try {
        const { status, data_validade, arquivo_frente_url, arquivo_verso_url, arquivo_pdf_url, observacao } = req.body;
        const r = await pool.query(
            `UPDATE ministro_credenciais SET status=COALESCE($1,status), data_validade=$2,
             arquivo_frente_url=COALESCE($3,arquivo_frente_url), arquivo_verso_url=COALESCE($4,arquivo_verso_url),
             arquivo_pdf_url=COALESCE($5,arquivo_pdf_url), observacao=COALESCE($6,observacao), updated_at=NOW()
             WHERE id=$7 RETURNING *`,
            [status, data_validade || null, arquivo_frente_url, arquivo_verso_url, arquivo_pdf_url, observacao, req.params.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/credenciais/:id', adminAuth, async (req, res) => {
    try {
        await pool.query('DELETE FROM ministro_credenciais WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================================================================
// RELATÓRIOS — Download de dados para credencial
// ================================================================
router.get('/relatorios/membros', adminAuth, async (req, res) => {
    try {
        const { formato, status, anuidade, credencial } = req.query;
        let where = [];
        let params = [];
        let idx = 1;

        if (status) { where.push(`m.status = $${idx++}`); params.push(status); }
        if (anuidade) { where.push(`m.anuidade_status = $${idx++}`); params.push(anuidade); }
        if (credencial) { where.push(`m.credencial_status = $${idx++}`); params.push(credencial); }

        const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const r = await pool.query(`
            SELECT m.id, m.cpf, m.nome, m.nome_social, m.cargo, m.registro, m.email, m.telefone, m.whatsapp,
                   m.sexo, m.data_nascimento, m.estado_civil, m.nome_conjuge, m.rg, m.orgao_expedidor,
                   m.nome_igreja, m.funcao_ministerial, m.tempo_ministerio, m.data_consagracao,
                   m.escolaridade, m.status, m.anuidade_status, m.credencial_status,
                   m.foto_url, m.data_registro, m.created_at,
                   e.cep, e.endereco, e.numero, e.complemento, e.bairro, e.cidade, e.uf,
                   mc.numero_credencial, mc.data_emissao AS cred_emissao, mc.data_validade AS cred_validade,
                   mc.status AS cred_status_atual
            FROM ministros m
            LEFT JOIN ministro_endereco e ON e.ministro_id = m.id
            LEFT JOIN LATERAL (
                SELECT * FROM ministro_credenciais WHERE ministro_id = m.id ORDER BY created_at DESC LIMIT 1
            ) mc ON true
            ${whereStr}
            ORDER BY m.nome
        `, params);

        if (formato === 'csv') {
            // CSV export
            const headers = ['ID','CPF','Nome','Cargo','Registro','Email','Telefone','WhatsApp','Sexo',
                           'Data Nascimento','Estado Civil','Cônjuge','RG','Órgão Expedidor','Igreja',
                           'Função Ministerial','Tempo Ministério','Data Consagração','Escolaridade',
                           'Status','Anuidade','Credencial','CEP','Endereço','Número','Complemento',
                           'Bairro','Cidade','UF','Nº Credencial','Emissão Credencial','Validade Credencial'];

            const csvRows = [headers.join(';')];
            for (const m of r.rows) {
                csvRows.push([
                    m.id, m.cpf, `"${(m.nome||'').replace(/"/g,'""')}"`, m.cargo, m.registro, m.email,
                    m.telefone, m.whatsapp, m.sexo === 'M' ? 'Masculino' : 'Feminino',
                    m.data_nascimento ? new Date(m.data_nascimento).toLocaleDateString('pt-BR') : '',
                    m.estado_civil, `"${(m.nome_conjuge||'').replace(/"/g,'""')}"`, m.rg, m.orgao_expedidor,
                    `"${(m.nome_igreja||'').replace(/"/g,'""')}"`, m.funcao_ministerial, m.tempo_ministerio,
                    m.data_consagracao ? new Date(m.data_consagracao).toLocaleDateString('pt-BR') : '',
                    m.escolaridade, m.status, m.anuidade_status, m.credencial_status,
                    m.cep, `"${(m.endereco||'').replace(/"/g,'""')}"`, m.numero, m.complemento,
                    m.bairro, m.cidade, m.uf,
                    m.numero_credencial, m.cred_emissao ? new Date(m.cred_emissao).toLocaleDateString('pt-BR') : '',
                    m.cred_validade ? new Date(m.cred_validade).toLocaleDateString('pt-BR') : ''
                ].join(';'));
            }

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=relatorio_membros_${new Date().toISOString().split('T')[0]}.csv`);
            return res.send('\uFEFF' + csvRows.join('\n')); // BOM para Excel reconhecer UTF-8
        }

        // JSON (default)
        res.json({ membros: r.rows, total: r.rows.length, gerado_em: new Date().toISOString() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Estatísticas rápidas dos membros
router.get('/relatorios/stats-membros', adminAuth, async (req, res) => {
    try {
        const [total, ativos, inativos, pendentes, anuidadeOk, anuidadePend, credAtiva, credPend] = await Promise.all([
            pool.query("SELECT COUNT(*) as n FROM ministros"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE status = 'ATIVO'"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE status = 'INATIVO'"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE status = 'PENDENTE'"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE anuidade_status = 'paga'"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE anuidade_status = 'pendente' OR anuidade_status IS NULL"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE credencial_status = 'ativa'"),
            pool.query("SELECT COUNT(*) as n FROM ministros WHERE credencial_status = 'pendente' OR credencial_status IS NULL"),
        ]);

        const cargos = await pool.query("SELECT cargo, COUNT(*) as total FROM ministros GROUP BY cargo ORDER BY total DESC");

        res.json({
            total: parseInt(total.rows[0].n),
            ativos: parseInt(ativos.rows[0].n),
            inativos: parseInt(inativos.rows[0].n),
            pendentes: parseInt(pendentes.rows[0].n),
            anuidade_paga: parseInt(anuidadeOk.rows[0].n),
            anuidade_pendente: parseInt(anuidadePend.rows[0].n),
            credencial_ativa: parseInt(credAtiva.rows[0].n),
            credencial_pendente: parseInt(credPend.rows[0].n),
            por_cargo: cargos.rows,
        });
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
        const { nome, cargo, tipo, descricao, foto_url, email, ordem } = req.body;
        const r = await pool.query(
            'INSERT INTO diretoria (nome, cargo, tipo, descricao, foto_url, email, ordem) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [nome, cargo, tipo || 'diretoria', descricao, foto_url, email, ordem || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/diretoria/:id', adminAuth, async (req, res) => {
    try {
        const { nome, cargo, tipo, descricao, foto_url, email, ordem, ativo } = req.body;
        const r = await pool.query(
            'UPDATE diretoria SET nome=$1, cargo=$2, tipo=$3, descricao=$4, foto_url=$5, email=$6, ordem=$7, ativo=$8 WHERE id=$9 RETURNING *',
            [nome, cargo, tipo || 'diretoria', descricao, foto_url, email, ordem, ativo, req.params.id]
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
        const { titulo, mensagem, tipo, link, ativa, data_inicio, data_fim } = req.body;
        const r = await pool.query(
            'INSERT INTO notificacoes_site (titulo, mensagem, tipo, link, ativa, data_inicio, data_fim) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [titulo, mensagem, tipo || 'info', link, ativa !== false, data_inicio || new Date(), data_fim || null]
        );
        res.status(201).json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notificacoes-site/:id', adminAuth, async (req, res) => {
    try {
        const { titulo, mensagem, tipo, link, ativa, data_inicio, data_fim } = req.body;
        const r = await pool.query(
            'UPDATE notificacoes_site SET titulo=$1, mensagem=$2, tipo=$3, link=$4, ativa=$5, data_inicio=$6, data_fim=$7 WHERE id=$8 RETURNING *',
            [titulo, mensagem, tipo, link, ativa, data_inicio || null, data_fim || null, req.params.id]
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

// POST /api/admin/upload-image — Upload genérico de imagem (retorna URL)
router.post('/upload-image', adminAuth, upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Formato não permitido. Use JPG, PNG, WebP ou GIF.' });
        }
        const url = `/uploads/${req.file.filename}`;
        res.json({ url, filename: req.file.filename, size: req.file.size });
    } catch (err) {
        console.error('Erro upload:', err);
        res.status(500).json({ error: 'Erro ao fazer upload' });
    }
});

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
