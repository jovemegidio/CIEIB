/* ==============================================================
   Rotas de Registro — Primeiro Acesso / Cadastro de Ministros
   ============================================================== */
const router = require('express').Router();
const pool = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ---- Multer config para documentos ----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'documentos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${unique}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Formato não permitido. Use JPG, PNG, PDF ou WebP.'));
    }
});

// ========== POST /api/registro — Etapa 1: Dados Pessoais + Endereço ==========
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            // Dados pessoais
            nome, cpf, rg, orgao_expedidor, data_nascimento, sexo,
            nacionalidade, naturalidade_estado, naturalidade_cidade,
            estado_civil, nome_conjuge, data_nasc_conjuge,
            pai, mae, email, telefone, whatsapp,
            // Endereço
            cep, endereco, numero, complemento, bairro, cidade, uf,
            // Escolaridade
            escolaridade,
            // Dados ministeriais
            cargo, nome_igreja, funcao_ministerial, tempo_ministerio,
            data_consagracao, data_batismo, data_ordenacao,
            igreja_ordenacao, cidade_ordenacao,
            // Filhos
            filhos
        } = req.body;

        // Validações obrigatórias
        if (!nome || !cpf || !email) {
            return res.status(400).json({ error: 'Nome, CPF e email são obrigatórios.' });
        }

        // Limpar CPF
        const cpfLimpo = cpf.replace(/\D/g, '');

        // Gerar senha automaticamente: 6 primeiros dígitos do CPF
        const senhaAutoGerada = cpfLimpo.substring(0, 6);

        // Verificar se CPF já existe
        const exists = await client.query('SELECT id FROM ministros WHERE cpf = $1', [cpfLimpo]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'CPF já cadastrado no sistema. Se você já possui cadastro, faça login.' });
        }

        // Hash da senha (auto-gerada)
        const senhaHash = await bcrypt.hash(senhaAutoGerada, 10);

        // Inserir ministro
        const result = await client.query(`
            INSERT INTO ministros (
                cpf, senha, nome, rg, orgao_expedidor, data_nascimento, sexo,
                nacionalidade, estado_nascimento, cidade_nascimento,
                estado_civil, nome_conjuge, data_nasc_conjuge, pai, mae,
                email, telefone, whatsapp, escolaridade,
                cargo, nome_igreja, funcao_ministerial, tempo_ministerio,
                data_consagracao, data_batismo, data_ordenacao,
                igreja_ordenacao, cidade_ordenacao,
                conv_estadual, status, aprovado
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
                'CIEIB', 'ATIVO', false
            )
            RETURNING id
        `, [
            cpfLimpo, senhaHash, nome.toUpperCase(), rg, orgao_expedidor,
            data_nascimento || null, sexo || 'M',
            nacionalidade || 'BRASILEIRO', naturalidade_estado, naturalidade_cidade,
            estado_civil, nome_conjuge, data_nasc_conjuge || null,
            pai, mae, email, telefone, whatsapp,
            escolaridade, cargo || 'PASTOR', nome_igreja,
            funcao_ministerial, tempo_ministerio, data_consagracao || null,
            data_batismo || null, data_ordenacao || null,
            igreja_ordenacao || null, cidade_ordenacao || null
        ]);

        const ministroId = result.rows[0].id;

        // Inserir endereço
        if (cep || endereco) {
            await client.query(`
                INSERT INTO ministro_endereco (ministro_id, cep, endereco, numero, complemento, bairro, cidade, uf)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `, [ministroId, cep, endereco, numero, complemento, bairro, cidade, uf]);
        }

        // Inserir filhos
        if (filhos && Array.isArray(filhos) && filhos.length > 0) {
            for (const filho of filhos) {
                if (filho.nome) {
                    await client.query(
                        'INSERT INTO ministro_filhos (ministro_id, nome, data_nascimento) VALUES ($1,$2,$3)',
                        [ministroId, filho.nome, filho.data_nascimento || null]
                    );
                }
            }
        }

        // Criar convenção
        await client.query(`
            INSERT INTO ministro_convencoes (ministro_id, sigla, status, condicao)
            VALUES ($1, 'CIEIB', 'ATIVO', 'ATIVO')
        `, [ministroId]);

        // Criar documentos (registro vazio)
        await client.query(`
            INSERT INTO ministro_documentos (ministro_id, observacoes)
            VALUES ($1, 'Cadastro via Primeiro Acesso')
        `, [ministroId]);

        // Notificação de boas-vindas
        await client.query(`
            INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
            VALUES
                ($1, 'Bem-vindo à CIEIB!', 'Seu cadastro foi realizado com sucesso. Agora você pode acessar todos os serviços da área do ministro. Complete seu perfil e envie seus documentos para aprovação.', 'info'),
                ($1, 'Envie seus documentos', 'Para concluir seu credenciamento, envie os documentos solicitados na seção "Documentos" do seu painel.', 'alerta')
        `, [ministroId]);

        await client.query('COMMIT');

        // Gerar JWT
        const token = jwt.sign(
            { id: ministroId, cpf: cpfLimpo },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Log de acesso
        await pool.query(
            'INSERT INTO logs_acesso (ministro_id, acao, ip) VALUES ($1, $2, $3)',
            [ministroId, 'REGISTRO', req.ip]
        );

        res.status(201).json({
            message: 'Cadastro realizado com sucesso!',
            token,
            ministro: { id: ministroId, nome: nome.toUpperCase(), cpf: cpfLimpo }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro no registro:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'CPF já cadastrado no sistema.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
});

// ========== POST /api/registro/documentos — Etapa 2: Upload de documentos ==========
router.post('/documentos', upload.array('documentos', 10), async (req, res) => {
    try {
        let { ministro_id, tipos } = req.body;

        // Verificar autenticação via token (OBRIGATÓRIO)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Autenticação necessária.' });
        }

        try {
            const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
            ministro_id = decoded.id;
        } catch (e) {
            return res.status(401).json({ error: 'Token inválido.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Ao menos um documento é obrigatório.' });
        }

        // tipos vem como JSON string: ["certidao_casamento","comprovante_endereco", ...]
        let tiposArray;
        try {
            tiposArray = JSON.parse(tipos);
        } catch {
            tiposArray = req.files.map((_, i) => `documento_${i + 1}`);
        }

        const uploaded = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const tipo = tiposArray[i] || `documento_${i + 1}`;
            const caminho = `/uploads/documentos/${file.filename}`;

            await pool.query(`
                INSERT INTO ministro_uploads (ministro_id, tipo_documento, nome_arquivo, caminho, tamanho)
                VALUES ($1, $2, $3, $4, $5)
            `, [ministro_id, tipo, file.originalname, caminho, file.size]);

            // Se for foto 3x4, também definir como foto de perfil do ministro
            if (tipo === 'foto_3x4') {
                await pool.query(
                    'UPDATE ministros SET foto_url = $1, updated_at = NOW() WHERE id = $2',
                    [caminho, ministro_id]
                );
            }

            uploaded.push({ tipo, nome: file.originalname, caminho });
        }

        res.status(201).json({
            message: `${uploaded.length} documento(s) enviado(s) com sucesso!`,
            documentos: uploaded
        });

    } catch (err) {
        console.error('Erro no upload:', err);
        res.status(500).json({ error: 'Erro ao enviar documentos.' });
    }
});

// ========== GET /api/registro/verificar-cpf/:cpf ==========
router.get('/verificar-cpf/:cpf', async (req, res) => {
    try {
        const cpfLimpo = req.params.cpf.replace(/\D/g, '');
        const result = await pool.query('SELECT id FROM ministros WHERE cpf = $1', [cpfLimpo]);
        res.json({ cadastrado: result.rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao verificar CPF.' });
    }
});

module.exports = router;
