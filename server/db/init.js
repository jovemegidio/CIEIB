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
