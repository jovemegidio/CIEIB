/* ==============================================================
   Seed — Dados iniciais para teste
   Rodar: npm run db:seed
   ============================================================== */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./connection');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Inserindo dados iniciais...');

        // --- Ministro de teste ---
        const senhaHash = await bcrypt.hash('nana2504', 10);
        const ministro = await pool.query(`
            INSERT INTO ministros (cpf, senha, nome, nome_social, cargo, conv_estadual, sexo, data_nascimento,
                pais_nascimento, estado_nascimento, cidade_nascimento, nacionalidade, estado_civil,
                nome_conjuge, pai, mae, rg, orgao_expedidor, email, data_registro, registro, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
            ON CONFLICT (cpf) DO NOTHING
            RETURNING id
        `, [
            '11368992862', senhaHash, 'OSNI EGIDIO', 'OSNI EGIDIO', 'PASTOR', 'CIEIB', 'M',
            '1972-11-20', 'BRASIL', 'ES', 'CONCEICAO DA BARRA', 'BRASILEIRO', 'casado',
            'ALESSANDRA DE OLIVEIRA EGIDIO', 'ANTONIO EGIDIO', 'MARIA DUARTE EGIDIO',
            '214692942', 'SSP SP', 'osniegidio@gmail.com', '2012-04-29', '5.131', 'ATIVO'
        ]);

        const ministroId = ministro.rows[0]?.id;
        if (!ministroId) {
            console.log('⚠️  Ministro já existe, buscando ID...');
            const existing = await pool.query('SELECT id FROM ministros WHERE cpf = $1', ['11368992862']);
            var mId = existing.rows[0].id;
        } else {
            var mId = ministroId;
        }

        // --- Convenção do ministro ---
        await pool.query(`
            INSERT INTO ministro_convencoes (ministro_id, sigla, registro, status, condicao)
            VALUES ($1, 'CIEIB', '5.131', 'ATIVO', 'ATIVO')
            ON CONFLICT DO NOTHING
        `, [mId]);

        // --- Contas a Receber ---
        const contas = [
            { conta: '12.026.337', nro: '1000938822019', data: '2019-01-01', venc: '2019-12-31', valor: 144, servico: 'ANUIDADE CONVENCIONAL' },
            { conta: '12.149.815', nro: '1000285589202', data: '2020-01-01', venc: '2020-12-31', valor: 144, servico: 'ANUIDADE CONVENCIONAL' },
            { conta: '12.516.151', nro: '1000624054202', data: '2021-11-05', venc: '2021-11-05', valor: 24, servico: 'CREDENCIAL / ENVIO' },
            { conta: '12.957.272', nro: '1000101439220', data: '2024-01-01', venc: '2024-12-31', valor: 216, servico: 'ANUIDADE CONVENCIONAL' },
            { conta: '13.194.905', nro: '1000122095620', data: '2025-01-01', venc: '2025-12-31', valor: 216, servico: 'ANUIDADE CONVENCIONAL' },
        ];

        for (const c of contas) {
            await pool.query(`
                INSERT INTO contas_receber (ministro_id, convencao, conta, nro_docto, data, registro, data_vencimento, valor, desconto, valor_pago, saldo, servico, status)
                VALUES ($1, 'CIEIB', $2, $3, $4, '5.131', $5, $6, 0, 0, $6, $7, 'ABERTO')
            `, [mId, c.conta, c.nro, c.data, c.venc, c.valor, c.servico]);
        }

        // --- Documentos ---
        await pool.query(`
            INSERT INTO ministro_documentos (ministro_id, passaporte, ctps, habilitacao, titulo_eleitor, observacoes)
            VALUES ($1, '', '', '', '', '')
            ON CONFLICT DO NOTHING
        `, [mId]);

        // --- Evento de teste ---
        const evento = await pool.query(`
            INSERT INTO eventos (convencao, titulo, data_evento, hora_inicio, data_termino, status, valor)
            VALUES ('CIEIB', 'ASSEMBLEIA GERAL', '2025-12-15', '08:00', '2025-12-31', 'Encerrado', 0.01)
            RETURNING id
        `);

        // --- Inscrição no evento ---
        if (evento.rows[0]) {
            await pool.query(`
                INSERT INTO evento_inscricoes (evento_id, ministro_id, numero_inscricao, data_inscricao, valor, valor_baixa, participou, status_inscricao)
                VALUES ($1, $2, '139.260', '2025-06-15', 0.01, 0.01, 'Não', 'Quitado')
            `, [evento.rows[0].id, mId]);
        }

        // --- Notícias ---
        const noticias = [
            { titulo: 'CIEIB realiza encontro nacional de pastores em Brasília', resumo: 'O evento reuniu líderes de todo o país para discutir os rumos da convenção e fortalecer os laços de comunhão...', cat: 'Institucional', destaque: true, data: '2026-02-10' },
            { titulo: 'Nova parceria fortalece ações sociais da convenção', resumo: 'A CIEIB firma parceria com instituições para ampliar o alcance de seus projetos sociais em comunidades carentes...', cat: 'Social', destaque: false, data: '2026-02-05' },
            { titulo: 'Programa de capacitação teológica abre novas turmas', resumo: 'As inscrições para o programa de formação ministerial já estão abertas, com cursos presenciais e online...', cat: 'Educação', destaque: false, data: '2026-01-28' },
            { titulo: 'Missões: CIEIB amplia presença internacional', resumo: 'A convenção expande seu trabalho missionário com a abertura de novos campos em países da América Latina...', cat: 'Missões', destaque: false, data: '2026-01-20' },
            { titulo: 'Congresso de Jovens reúne milhares em São Paulo', resumo: 'O evento anual da juventude da CIEIB contou com a participação de jovens de todo o Brasil em três dias de louvor...', cat: 'Juventude', destaque: false, data: '2026-01-15' },
            { titulo: 'Novas igrejas são filiadas à convenção no Norte do país', resumo: 'A CIEIB celebra a filiação de novas congregações nos estados do Pará, Amazonas e Roraima...', cat: 'Expansão', destaque: false, data: '2026-01-08' },
            { titulo: 'Campanha de Oração movimenta igrejas em todo o Brasil', resumo: 'A campanha "21 Dias de Oração" mobilizou milhares de fiéis em busca de avivamento e renovação espiritual...', cat: 'Devocional', destaque: false, data: '2025-12-28' },
            { titulo: 'Festival de Louvor marca encerramento do ano convencional', resumo: 'Músicos e cantores de diversas igrejas filiadas participaram do grande festival de encerramento...', cat: 'Cultura', destaque: false, data: '2025-12-20' },
            { titulo: 'CIEIB publica novas resoluções sobre ética ministerial', resumo: 'O documento aprovado em assembleia traz orientações atualizadas sobre conduta e disciplina ministerial...', cat: 'Resolução', destaque: false, data: '2025-12-10' },
        ];

        for (const n of noticias) {
            await pool.query(`
                INSERT INTO noticias (titulo, resumo, categoria, destaque, data_publicacao)
                VALUES ($1, $2, $3, $4, $5)
            `, [n.titulo, n.resumo, n.cat, n.destaque, n.data]);
        }

        // --- Configurações do site ---
        const configs = [
            { chave: 'site_telefone', valor: '(00) 0000-0000', desc: 'Telefone principal' },
            { chave: 'site_email', valor: 'contato@cieib.org.br', desc: 'Email principal' },
            { chave: 'site_whatsapp', valor: '5500000000000', desc: 'WhatsApp' },
            { chave: 'site_endereco', valor: 'Rua Exemplo, 1000 - Bairro Centro - CEP 00000-000 - Cidade/UF', desc: 'Endereço' },
            { chave: 'site_horario', valor: 'Seg a Sex: 09h às 17h', desc: 'Horário de funcionamento' },
            { chave: 'stat_igrejas', valor: '500', desc: 'Contador: Igrejas afiliadas' },
            { chave: 'stat_ministros', valor: '1200', desc: 'Contador: Ministros credenciados' },
            { chave: 'stat_estados', valor: '26', desc: 'Contador: Estados alcançados' },
            { chave: 'stat_convencoes', valor: '50', desc: 'Contador: Convenções regionais' },
        ];

        for (const c of configs) {
            await pool.query(`
                INSERT INTO configuracoes (chave, valor, descricao)
                VALUES ($1, $2, $3)
                ON CONFLICT (chave) DO UPDATE SET valor = $2
            `, [c.chave, c.valor, c.desc]);
        }

        console.log('✅ Dados iniciais inseridos com sucesso!');
    } catch (err) {
        console.error('❌ Erro no seed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
