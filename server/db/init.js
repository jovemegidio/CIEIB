/* ==============================================================
   Inicialização do Banco de Dados — Criação de Tabelas
   Rodar: npm run db:init
   ============================================================== */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./connection');

const schema = `

-- ===== MINISTROS =====
CREATE TABLE IF NOT EXISTS ministros (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    nome_social VARCHAR(200),
    doc_estrangeiro VARCHAR(50),
    cargo VARCHAR(100) DEFAULT 'PASTOR',
    conv_estadual VARCHAR(50) DEFAULT 'CIEIB',
    sexo CHAR(1) DEFAULT 'M',
    data_nascimento DATE,
    pais_nascimento VARCHAR(100) DEFAULT 'BRASIL',
    estado_nascimento VARCHAR(2),
    cidade_nascimento VARCHAR(100),
    nacionalidade VARCHAR(100) DEFAULT 'BRASILEIRO',
    estado_civil VARCHAR(30),
    nome_conjuge VARCHAR(200),
    data_nasc_conjuge DATE,
    pai VARCHAR(200),
    mae VARCHAR(200),
    rg VARCHAR(30),
    orgao_expedidor VARCHAR(30),
    email VARCHAR(200),
    biometria VARCHAR(10) DEFAULT 'Não',
    data_registro DATE,
    registro VARCHAR(20),
    foto_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== CONVENÇÕES DO MINISTRO =====
CREATE TABLE IF NOT EXISTS ministro_convencoes (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    sigla VARCHAR(30) NOT NULL,
    registro VARCHAR(30),
    status VARCHAR(20) DEFAULT 'ATIVO',
    condicao VARCHAR(20) DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== CONTAS A RECEBER =====
CREATE TABLE IF NOT EXISTS contas_receber (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    convencao VARCHAR(30) DEFAULT 'CIEIB',
    conta VARCHAR(30),
    nro_docto VARCHAR(30),
    data DATE,
    registro VARCHAR(20),
    data_vencimento DATE,
    valor DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    data_pagamento DATE,
    saldo DECIMAL(10,2) DEFAULT 0,
    servico VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ABERTO',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== DOCUMENTOS DO MINISTRO =====
CREATE TABLE IF NOT EXISTS ministro_documentos (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    passaporte VARCHAR(50),
    ctps VARCHAR(50),
    habilitacao VARCHAR(50),
    titulo_eleitor VARCHAR(50),
    observacoes TEXT,
    foto_validacao_url VARCHAR(500),
    homologar_foto VARCHAR(10) DEFAULT 'Não',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== EVENTOS =====
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    convencao VARCHAR(30) DEFAULT 'CIEIB',
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    local VARCHAR(300),
    data_evento DATE,
    hora_inicio TIME,
    data_termino DATE,
    status VARCHAR(30) DEFAULT 'Aberto',
    categoria VARCHAR(50),
    valor DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== INSCRIÇÕES EM EVENTOS =====
CREATE TABLE IF NOT EXISTS evento_inscricoes (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    numero_inscricao VARCHAR(20),
    data_inscricao TIMESTAMP DEFAULT NOW(),
    valor DECIMAL(10,2) DEFAULT 0,
    valor_baixa DECIMAL(10,2) DEFAULT 0,
    participou VARCHAR(10) DEFAULT 'Não',
    status_inscricao VARCHAR(30) DEFAULT 'ABERTO',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== MENSAGENS DIRETAS =====
CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    remetente VARCHAR(200),
    assunto VARCHAR(300),
    conteudo TEXT,
    lida BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP DEFAULT NOW()
);

-- ===== NOTÍCIAS DO SITE =====
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    resumo TEXT,
    conteudo TEXT,
    imagem_url VARCHAR(500),
    categoria VARCHAR(50),
    destaque BOOLEAN DEFAULT FALSE,
    publicada BOOLEAN DEFAULT TRUE,
    data_publicacao TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== CONTATOS (Formulário do site) =====
CREATE TABLE IF NOT EXISTS contatos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    telefone VARCHAR(30),
    assunto VARCHAR(100),
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    respondida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== CONFIGURAÇÕES DO SITE =====
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao VARCHAR(300)
);

-- ===== LOGS DE ACESSO =====
CREATE TABLE IF NOT EXISTS logs_acesso (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE SET NULL,
    acao VARCHAR(100),
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== CURSOS / FACULDADES =====
CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    area VARCHAR(50) NOT NULL DEFAULT 'teologica',
    nivel VARCHAR(50),
    carga_horaria INTEGER DEFAULT 0,
    duracao VARCHAR(50),
    imagem_url VARCHAR(500),
    ementa TEXT,
    requisitos TEXT,
    certificado BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== MÓDULOS DO CURSO =====
CREATE TABLE IF NOT EXISTS curso_modulos (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== AULAS =====
CREATE TABLE IF NOT EXISTS curso_aulas (
    id SERIAL PRIMARY KEY,
    modulo_id INTEGER REFERENCES curso_modulos(id) ON DELETE CASCADE,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(30) DEFAULT 'video',
    conteudo_url VARCHAR(500),
    material_url VARCHAR(500),
    duracao_minutos INTEGER DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== MATRÍCULAS =====
CREATE TABLE IF NOT EXISTS curso_matriculas (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'ativo',
    progresso INTEGER DEFAULT 0,
    nota_final DECIMAL(5,2),
    data_matricula TIMESTAMP DEFAULT NOW(),
    data_conclusao TIMESTAMP,
    UNIQUE(curso_id, ministro_id)
);

-- ===== PROGRESSO DE AULAS =====
CREATE TABLE IF NOT EXISTS curso_progresso (
    id SERIAL PRIMARY KEY,
    matricula_id INTEGER REFERENCES curso_matriculas(id) ON DELETE CASCADE,
    aula_id INTEGER REFERENCES curso_aulas(id) ON DELETE CASCADE,
    concluida BOOLEAN DEFAULT FALSE,
    data_conclusao TIMESTAMP,
    UNIQUE(matricula_id, aula_id)
);

-- ===== AVALIAÇÕES =====
CREATE TABLE IF NOT EXISTS curso_avaliacoes (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    perguntas JSONB,
    nota_minima DECIMAL(5,2) DEFAULT 7.0,
    tentativas_max INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== RESPOSTAS DE AVALIAÇÕES =====
CREATE TABLE IF NOT EXISTS curso_avaliacao_respostas (
    id SERIAL PRIMARY KEY,
    avaliacao_id INTEGER REFERENCES curso_avaliacoes(id) ON DELETE CASCADE,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    respostas JSONB,
    nota DECIMAL(5,2),
    aprovado BOOLEAN DEFAULT FALSE,
    tentativa INTEGER DEFAULT 1,
    data_resposta TIMESTAMP DEFAULT NOW()
);

-- ===== CERTIFICADOS =====
CREATE TABLE IF NOT EXISTS curso_certificados (
    id SERIAL PRIMARY KEY,
    matricula_id INTEGER REFERENCES curso_matriculas(id) ON DELETE CASCADE,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
    codigo_validacao VARCHAR(50) UNIQUE NOT NULL,
    data_emissao TIMESTAMP DEFAULT NOW(),
    UNIQUE(ministro_id, curso_id)
);

-- ===== CREDENCIAL DIGITAL =====
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS data_validade DATE;
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS credencial_codigo VARCHAR(50);

-- ===== NOTIFICAÇÕES =====
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    titulo VARCHAR(300) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(30) DEFAULT 'info',
    link VARCHAR(500),
    lida BOOLEAN DEFAULT FALSE,
    global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== NOTIFICAÇÕES GLOBAIS (para o site público) =====
CREATE TABLE IF NOT EXISTS notificacoes_site (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(30) DEFAULT 'info',
    link VARCHAR(500),
    ativa BOOLEAN DEFAULT TRUE,
    data_inicio TIMESTAMP DEFAULT NOW(),
    data_fim TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== ADMINISTRADORES =====
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'admin',
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== CONTEÚDOS DE PÁGINAS (CMS) =====
CREATE TABLE IF NOT EXISTS pagina_conteudos (
    id SERIAL PRIMARY KEY,
    pagina VARCHAR(100) NOT NULL,
    secao VARCHAR(100) NOT NULL,
    titulo VARCHAR(300),
    conteudo TEXT,
    imagem_url VARCHAR(500),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pagina, secao)
);

-- ===== MÍDIAS =====
CREATE TABLE IF NOT EXISTS midias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300),
    descricao TEXT,
    tipo VARCHAR(30) DEFAULT 'imagem',
    url VARCHAR(500) NOT NULL,
    tamanho INTEGER DEFAULT 0,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== REDES SOCIAIS =====
CREATE TABLE IF NOT EXISTS redes_sociais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT TRUE
);

-- ===== DIRETORIA =====
CREATE TABLE IF NOT EXISTS diretoria (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) DEFAULT 'diretoria',
    descricao TEXT,
    foto_url VARCHAR(500),
    email VARCHAR(200),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar coluna tipo se tabela já existir
DO $$ BEGIN
    ALTER TABLE diretoria ADD COLUMN IF NOT EXISTS tipo VARCHAR(30) DEFAULT 'diretoria';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ===== ENDEREÇO DO MINISTRO =====
CREATE TABLE IF NOT EXISTS ministro_endereco (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    cep VARCHAR(10),
    endereco VARCHAR(300),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ministro_id)
);

-- ===== FILHOS DO MINISTRO =====
CREATE TABLE IF NOT EXISTS ministro_filhos (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    data_nascimento DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== DOCUMENTOS DE CADASTRO (uploads) =====
CREATE TABLE IF NOT EXISTS ministro_uploads (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL,
    nome_arquivo VARCHAR(300) NOT NULL,
    caminho VARCHAR(500) NOT NULL,
    tamanho INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== INFORMAÇÕES MINISTERIAIS (primeiro acesso) =====
-- ===== CHAMADOS DE SUPORTE =====
CREATE TABLE IF NOT EXISTS suporte_tickets (
    id SERIAL PRIMARY KEY,
    ministro_id INTEGER REFERENCES ministros(id) ON DELETE CASCADE,
    protocolo VARCHAR(20) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'aberto',
    resposta TEXT,
    respondido_por VARCHAR(200),
    respondido_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ministros ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS escolaridade VARCHAR(50);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS nome_igreja VARCHAR(200);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS funcao_ministerial VARCHAR(100);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS tempo_ministerio VARCHAR(50);
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS data_consagracao DATE;
ALTER TABLE ministros ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT FALSE;

`;

async function initDB() {
    try {
        console.log('🔄 Criando tabelas no banco de dados...');
        await pool.query(schema);
        console.log('✅ Todas as tabelas foram criadas com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao criar tabelas:', err.message);
    } finally {
        await pool.end();
    }
}

initDB();
