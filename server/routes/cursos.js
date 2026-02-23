/* ==============================================================
   Rotas de Cursos / Faculdades
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/cursos — Listar todos os cursos ativos
router.get('/', async (req, res) => {
    try {
        const { area } = req.query;
        let query = 'SELECT * FROM cursos WHERE ativo = TRUE';
        const params = [];

        if (area) {
            params.push(area);
            query += ` AND area = $${params.length}`;
        }

        query += ' ORDER BY ordem ASC, titulo ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar cursos:', err);
        res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
});

// ⚠ IMPORTANTE: Rotas específicas ANTES de /:id para evitar conflito de parâmetros

// GET /api/cursos/minhas/matriculas — Matrículas do ministro logado
router.get('/minhas/matriculas', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cm.*, c.titulo, c.area, c.nivel, c.carga_horaria, c.imagem_url, c.duracao
            FROM curso_matriculas cm
            JOIN cursos c ON c.id = cm.curso_id
            WHERE cm.ministro_id = $1
            ORDER BY cm.data_matricula DESC
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar matrículas:', err);
        res.status(500).json({ error: 'Erro ao buscar matrículas' });
    }
});

// GET /api/cursos/meus/certificados — Certificados do ministro
router.get('/meus/certificados', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cc.*, c.titulo, c.area, c.carga_horaria, c.nivel
            FROM curso_certificados cc
            JOIN cursos c ON c.id = cc.curso_id
            WHERE cc.ministro_id = $1
            ORDER BY cc.data_emissao DESC
        `, [req.userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar certificados:', err);
        res.status(500).json({ error: 'Erro ao buscar certificados' });
    }
});

// GET /api/cursos/certificado/verificar/:codigo — Verificar certificado (público)
router.get('/certificado/verificar/:codigo', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cc.*, c.titulo as curso_titulo, c.carga_horaria, c.nivel,
                   m.nome as ministro_nome, m.cpf
            FROM curso_certificados cc
            JOIN cursos c ON c.id = cc.curso_id
            JOIN ministros m ON m.id = cc.ministro_id
            WHERE cc.codigo_validacao = $1
        `, [req.params.codigo]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Certificado não encontrado', valido: false });
        }

        const cert = result.rows[0];
        res.json({
            valido: true,
            curso: cert.curso_titulo,
            carga_horaria: cert.carga_horaria,
            nivel: cert.nivel,
            ministro: cert.ministro_nome,
            cpf: cert.cpf ? cert.cpf.substring(0, 3) + '.***.***-' + cert.cpf.substring(9) : '',
            data_emissao: cert.data_emissao,
            codigo: cert.codigo_validacao
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao verificar certificado' });
    }
});

// POST /api/cursos/aulas/:aulaId/concluir — Marcar aula como concluída
router.post('/aulas/:aulaId/concluir', auth, async (req, res) => {
    try {
        const { aulaId } = req.params;

        // Buscar aula e módulo
        const aula = await pool.query(`
            SELECT ca.id, ca.modulo_id, cm.curso_id
            FROM curso_aulas ca
            JOIN curso_modulos cm ON cm.id = ca.modulo_id
            WHERE ca.id = $1
        `, [aulaId]);

        if (aula.rows.length === 0) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        const cursoId = aula.rows[0].curso_id;

        // Verificar matrícula
        const matricula = await pool.query(
            'SELECT id FROM curso_matriculas WHERE curso_id = $1 AND ministro_id = $2',
            [cursoId, req.userId]
        );

        if (matricula.rows.length === 0) {
            return res.status(403).json({ error: 'Você não está matriculado neste curso' });
        }

        const matriculaId = matricula.rows[0].id;

        // Inserir ou atualizar progresso
        await pool.query(`
            INSERT INTO curso_progresso (matricula_id, aula_id, concluida, data_conclusao)
            VALUES ($1, $2, TRUE, NOW())
            ON CONFLICT (matricula_id, aula_id) DO UPDATE SET concluida = TRUE, data_conclusao = NOW()
        `, [matriculaId, aulaId]);

        // Calcular progresso total
        const totalAulas = await pool.query(`
            SELECT COUNT(*) FROM curso_aulas ca
            JOIN curso_modulos cm ON cm.id = ca.modulo_id
            WHERE cm.curso_id = $1
        `, [cursoId]);

        const aulasFeitas = await pool.query(`
            SELECT COUNT(*) FROM curso_progresso
            WHERE matricula_id = $1 AND concluida = TRUE
        `, [matriculaId]);

        const total = parseInt(totalAulas.rows[0].count);
        const feitas = parseInt(aulasFeitas.rows[0].count);
        const progresso = total > 0 ? Math.round((feitas / total) * 100) : 0;

        await pool.query(
            'UPDATE curso_matriculas SET progresso = $1 WHERE id = $2',
            [progresso, matriculaId]
        );

        // Se concluiu 100%, atualizar status
        if (progresso >= 100) {
            await pool.query(
                "UPDATE curso_matriculas SET status = 'concluido', data_conclusao = NOW() WHERE id = $1",
                [matriculaId]
            );
        }

        res.json({ message: 'Aula concluída!', progresso, feitas, total });
    } catch (err) {
        console.error('Erro ao concluir aula:', err);
        res.status(500).json({ error: 'Erro ao marcar aula como concluída' });
    }
});

// POST /api/cursos/avaliacoes/:id/responder — Responder avaliação
router.post('/avaliacoes/:id/responder', auth, async (req, res) => {
    try {
        const { respostas } = req.body;
        const avaliacaoId = req.params.id;

        // Buscar avaliação
        const avaliacao = await pool.query(
            'SELECT * FROM curso_avaliacoes WHERE id = $1',
            [avaliacaoId]
        );
        if (avaliacao.rows.length === 0) {
            return res.status(404).json({ error: 'Avaliação não encontrada' });
        }

        const av = avaliacao.rows[0];

        // Verificar tentativas
        const tentativas = await pool.query(
            'SELECT COUNT(*) FROM curso_avaliacao_respostas WHERE avaliacao_id = $1 AND ministro_id = $2',
            [avaliacaoId, req.userId]
        );

        const numTentativas = parseInt(tentativas.rows[0].count);
        if (numTentativas >= av.tentativas_max) {
            return res.status(400).json({ error: 'Você atingiu o número máximo de tentativas' });
        }

        // Calcular nota
        const perguntas = av.perguntas || [];
        let acertos = 0;
        perguntas.forEach((p, i) => {
            if (respostas[i] === p.resposta_correta) acertos++;
        });
        const nota = perguntas.length > 0 ? (acertos / perguntas.length) * 10 : 0;
        const aprovado = nota >= parseFloat(av.nota_minima);

        const result = await pool.query(`
            INSERT INTO curso_avaliacao_respostas (avaliacao_id, ministro_id, respostas, nota, aprovado, tentativa)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [avaliacaoId, req.userId, JSON.stringify(respostas), nota, aprovado, numTentativas + 1]);

        res.json({
            nota: nota.toFixed(1),
            aprovado,
            tentativa: numTentativas + 1,
            tentativas_restantes: av.tentativas_max - (numTentativas + 1)
        });
    } catch (err) {
        console.error('Erro na avaliação:', err);
        res.status(500).json({ error: 'Erro ao processar avaliação' });
    }
});

// GET /api/cursos/:id — Detalhes de um curso com módulos e aulas
// ⚠ Esta rota DEVE ficar DEPOIS das rotas específicas acima
router.get('/:id', async (req, res) => {
    try {
        const curso = await pool.query('SELECT * FROM cursos WHERE id = $1 AND ativo = TRUE', [req.params.id]);
        if (curso.rows.length === 0) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        const modulos = await pool.query(
            'SELECT * FROM curso_modulos WHERE curso_id = $1 ORDER BY ordem ASC',
            [req.params.id]
        );

        // Buscar aulas de cada módulo
        for (let mod of modulos.rows) {
            const aulas = await pool.query(
                'SELECT id, titulo, descricao, tipo, duracao_minutos, ordem FROM curso_aulas WHERE modulo_id = $1 ORDER BY ordem ASC',
                [mod.id]
            );
            mod.aulas = aulas.rows;
        }

        const avaliacoes = await pool.query(
            'SELECT id, titulo, descricao, nota_minima, tentativas_max FROM curso_avaliacoes WHERE curso_id = $1',
            [req.params.id]
        );

        res.json({
            ...curso.rows[0],
            modulos: modulos.rows,
            avaliacoes: avaliacoes.rows
        });
    } catch (err) {
        console.error('Erro ao buscar curso:', err);
        res.status(500).json({ error: 'Erro ao buscar curso' });
    }
});

// POST /api/cursos/:id/matricular — Matricular no curso
router.post('/:id/matricular', auth, async (req, res) => {
    try {
        const cursoId = req.params.id;

        // Verificar se curso existe
        const curso = await pool.query('SELECT * FROM cursos WHERE id = $1 AND ativo = TRUE', [cursoId]);
        if (curso.rows.length === 0) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        // Verificar se já está matriculado
        const existe = await pool.query(
            'SELECT id FROM curso_matriculas WHERE curso_id = $1 AND ministro_id = $2',
            [cursoId, req.userId]
        );
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Você já está matriculado neste curso' });
        }

        const result = await pool.query(`
            INSERT INTO curso_matriculas (curso_id, ministro_id, status, progresso)
            VALUES ($1, $2, 'ativo', 0) RETURNING *
        `, [cursoId, req.userId]);

        // Notificação
        await pool.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo, link)
            VALUES ($1, $2, $3, 'success', $4)
        `, [
            req.userId,
            'Matrícula realizada!',
            `Você se matriculou no curso: ${curso.rows[0].titulo}`,
            '/painel-ministro.html#cursos'
        ]);

        res.json({ message: 'Matrícula realizada com sucesso!', matricula: result.rows[0] });
    } catch (err) {
        console.error('Erro na matrícula:', err);
        res.status(500).json({ error: 'Erro ao realizar matrícula' });
    }
});

// GET /api/cursos/:id/aulas — Aulas do curso (requer matrícula)
router.get('/:id/aulas', auth, async (req, res) => {
    try {
        // Verificar matrícula
        const matricula = await pool.query(
            'SELECT id FROM curso_matriculas WHERE curso_id = $1 AND ministro_id = $2',
            [req.params.id, req.userId]
        );
        if (matricula.rows.length === 0) {
            return res.status(403).json({ error: 'Você não está matriculado neste curso' });
        }

        const matriculaId = matricula.rows[0].id;

        const modulos = await pool.query(
            'SELECT * FROM curso_modulos WHERE curso_id = $1 ORDER BY ordem ASC',
            [req.params.id]
        );

        for (let mod of modulos.rows) {
            const aulas = await pool.query(
                `SELECT ca.*, 
                    COALESCE(cp.concluida, FALSE) as concluida,
                    cp.data_conclusao as data_conclusao_aula
                 FROM curso_aulas ca
                 LEFT JOIN curso_progresso cp ON cp.aula_id = ca.id AND cp.matricula_id = $1
                 WHERE ca.modulo_id = $2
                 ORDER BY ca.ordem ASC`,
                [matriculaId, mod.id]
            );
            mod.aulas = aulas.rows;
        }

        res.json({ modulos: modulos.rows, matricula_id: matriculaId });
    } catch (err) {
        console.error('Erro ao buscar aulas:', err);
        res.status(500).json({ error: 'Erro ao buscar aulas' });
    }
});

// POST /api/cursos/:id/certificado — Solicitar certificado (requer conclusão)
router.post('/:id/certificado', auth, async (req, res) => {
    try {
        const cursoId = req.params.id;

        // Verificar matrícula concluída
        const matricula = await pool.query(
            "SELECT id FROM curso_matriculas WHERE curso_id = $1 AND ministro_id = $2 AND status = 'concluido'",
            [cursoId, req.userId]
        );

        if (matricula.rows.length === 0) {
            return res.status(400).json({ error: 'Você precisa concluir o curso para emitir o certificado' });
        }

        // Verificar se já existe
        const existe = await pool.query(
            'SELECT id FROM curso_certificados WHERE curso_id = $1 AND ministro_id = $2',
            [cursoId, req.userId]
        );
        if (existe.rows.length > 0) {
            return res.json(existe.rows[0]);
        }

        // Gerar código de validação
        const codigo = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const result = await pool.query(`
            INSERT INTO curso_certificados (matricula_id, ministro_id, curso_id, codigo_validacao)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [matricula.rows[0].id, req.userId, cursoId, codigo]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao emitir certificado:', err);
        res.status(500).json({ error: 'Erro ao emitir certificado' });
    }
});

module.exports = router;
