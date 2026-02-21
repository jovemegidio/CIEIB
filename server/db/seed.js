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
            // Identidade
            { chave: 'nome_site', valor: 'CIEIB — Convenção de Igrejas Evangélicas Independentes do Brasil', desc: 'Nome do Site' },
            { chave: 'site_logo_url', valor: '', desc: 'Logo do Cabeçalho' },
            { chave: 'site_logo_footer_url', valor: '', desc: 'Logo do Rodapé' },
            { chave: 'site_favicon_url', valor: '/fav.jpg', desc: 'Favicon do Site' },
            // SEO
            { chave: 'meta_description', valor: 'CIEIB é uma convenção que reúne igrejas evangélicas independentes em todo o Brasil, promovendo unidade, comunhão e crescimento do Reino de Deus.', desc: 'Meta Description (SEO)' },
            { chave: 'meta_keywords', valor: 'CIEIB, convenção, igrejas evangélicas, interdenominacional, Brasil, ministros', desc: 'Meta Keywords (SEO)' },
            { chave: 'meta_og_image', valor: '', desc: 'Imagem para compartilhamento social (OG Image)' },
            // Header
            { chave: 'header_bg_color', valor: '#1a3a5c', desc: 'Cor de Fundo do Header' },
            { chave: 'header_text_color', valor: '#ffffff', desc: 'Cor do Texto do Header' },
            { chave: 'header_topbar_bg', valor: '#0f2440', desc: 'Cor da Top Bar' },
            { chave: 'header_topbar_text', valor: '#c8a951', desc: 'Cor do Texto da Top Bar' },
            { chave: 'header_topbar_info', valor: 'Seg a Sex: 09h às 17h | Atendimento Online', desc: 'Info na Top Bar' },
            { chave: 'header_cta_text', valor: 'Área do Ministro', desc: 'Texto do Botão CTA Header' },
            { chave: 'header_cta_url', valor: '/painel-ministro.html', desc: 'URL do Botão CTA Header' },
            // Contato
            { chave: 'site_telefone', valor: '(00) 0000-0000', desc: 'Telefone principal' },
            { chave: 'site_email', valor: 'contato@cieib.org.br', desc: 'Email principal' },
            { chave: 'site_whatsapp', valor: '5500000000000', desc: 'WhatsApp' },
            { chave: 'site_whatsapp_display', valor: '(00) 00000-0000', desc: 'WhatsApp para exibição' },
            { chave: 'site_email_atendimento', valor: 'atendimento@cieib.org.br', desc: 'Email de atendimento' },
            { chave: 'site_endereco', valor: 'Rua Exemplo, 1000<br>Bairro Centro<br>CEP 00000-000<br>Cidade - UF', desc: 'Endereço' },
            { chave: 'site_horario', valor: 'Seg a Sex: 09h às 17h', desc: 'Horário de funcionamento' },
            { chave: 'site_maps_embed', valor: '', desc: 'Código Embed do Google Maps (iframe)' },
            // Hero
            { chave: 'hero_badge', valor: 'Fundada com propósito e fé', desc: 'Badge do hero na home' },
            { chave: 'hero_titulo', valor: 'CONVENÇÃO DAS IGREJAS EVANGÉLICAS<br><span>INTERDENOMINACIONAL DO BRASIL</span>', desc: 'Título do hero na home' },
            { chave: 'hero_descricao', valor: 'Promovendo a unidade, comunhão e crescimento do Reino de Deus através da cooperação entre igrejas e ministros em todo o território nacional.', desc: 'Descrição do hero na home' },
            { chave: 'hero_bg_image', valor: '', desc: 'Imagem de Fundo do Hero' },
            { chave: 'hero_bg_overlay', valor: '', desc: 'Cor do Overlay do Hero' },
            // Footer
            { chave: 'footer_sobre', valor: 'Convenção das Igrejas Evangélicas Interdenominacional do Brasil — promovendo a unidade e o crescimento do evangelho em todo o território nacional.', desc: 'Texto sobre no footer' },
            { chave: 'footer_copyright', valor: 'Copyright © CIEIB 2026. Todos os direitos reservados.', desc: 'Copyright no rodapé' },
            { chave: 'footer_bg_color', valor: '#0f2440', desc: 'Cor de Fundo do Rodapé' },
            { chave: 'footer_text_color', valor: '#c8a951', desc: 'Cor do Texto do Rodapé' },
            { chave: 'footer_link1_text', valor: '', desc: 'Link Extra 1 — Texto' },
            { chave: 'footer_link1_url', valor: '', desc: 'Link Extra 1 — URL' },
            { chave: 'footer_link2_text', valor: '', desc: 'Link Extra 2 — Texto' },
            { chave: 'footer_link2_url', valor: '', desc: 'Link Extra 2 — URL' },
            // Estatísticas
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

        // --- Cursos / Faculdade Teológica ---
        const cursosData = [
            { titulo: 'Teologia Básica', desc: 'Fundamentos teológicos essenciais para o ministério pastoral, com estudo das doutrinas fundamentais da fé cristã.', cat: 'Teologia', nivel: 'Básico', carga: 120, cert: true, img: null },
            { titulo: 'Teologia Intermediária', desc: 'Aprofundamento nos estudos teológicos com exegese bíblica, hermenêutica e história da igreja.', cat: 'Teologia', nivel: 'Intermediário', carga: 240, cert: true, img: null },
            { titulo: 'Teologia Avançada', desc: 'Estudos avançados em teologia sistemática, apologética e liderança eclesiástica.', cat: 'Teologia', nivel: 'Avançado', carga: 360, cert: true, img: null },
            { titulo: 'Formação Ministerial', desc: 'Capacitação completa para o exercício do ministério pastoral, incluindo homilética, aconselhamento e administração eclesiástica.', cat: 'Ministério', nivel: 'Intermediário', carga: 200, cert: true, img: null },
            { titulo: 'Capelania Profissional', desc: 'Formação em capelania com foco em atendimento hospitalar, penitenciário e empresarial.', cat: 'Capelania', nivel: 'Avançado', carga: 180, cert: true, img: null },
            { titulo: 'Juiz de Paz', desc: 'Habilitação como Juiz de Paz eclesiástico para celebração de casamentos religiosos com efeito civil.', cat: 'Jurídico', nivel: 'Intermediário', carga: 80, cert: true, img: null },
            { titulo: 'Terapeuta Cristão', desc: 'Formação em terapia cristã integrando princípios bíblicos com técnicas de aconselhamento profissional.', cat: 'Aconselhamento', nivel: 'Avançado', carga: 300, cert: true, img: null },
            { titulo: 'Psicanalista Clínico', desc: 'Curso de formação em psicanálise clínica com abordagem cristã para atendimento em consultório.', cat: 'Aconselhamento', nivel: 'Avançado', carga: 400, cert: true, img: null },
            { titulo: 'Aconselhamento Pastoral', desc: 'Técnicas e fundamentos para aconselhamento pastoral eficaz, incluindo crises, luto e conflitos familiares.', cat: 'Ministério', nivel: 'Básico', carga: 100, cert: true, img: null },
            { titulo: 'Liderança Cristã', desc: 'Desenvolvimento de competências de liderança baseadas em princípios bíblicos para pastores e líderes de ministérios.', cat: 'Liderança', nivel: 'Intermediário', carga: 80, cert: true, img: null },
        ];

        for (const curso of cursosData) {
            const cursoRes = await pool.query(`
                INSERT INTO cursos (titulo, descricao, area, nivel, carga_horaria, certificado, imagem_url, ativo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                ON CONFLICT DO NOTHING
                RETURNING id
            `, [curso.titulo, curso.desc, curso.cat, curso.nivel, curso.carga, curso.cert, curso.img]);

            const cursoId = cursoRes.rows[0]?.id;
            if (!cursoId) continue;

            // Módulos por curso (3 módulos cada)
            const modulos = [
                { titulo: `Módulo 1 — Introdução`, desc: `Introdução ao curso de ${curso.titulo}`, ordem: 1 },
                { titulo: `Módulo 2 — Aprofundamento`, desc: `Conteúdo aprofundado de ${curso.titulo}`, ordem: 2 },
                { titulo: `Módulo 3 — Prática e Avaliação`, desc: `Prática e avaliação final de ${curso.titulo}`, ordem: 3 },
            ];

            for (const mod of modulos) {
                const modRes = await pool.query(`
                    INSERT INTO curso_modulos (curso_id, titulo, descricao, ordem)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [cursoId, mod.titulo, mod.desc, mod.ordem]);

                const modId = modRes.rows[0]?.id;
                if (!modId) continue;

                // 3 aulas por módulo
                const aulas = [
                    { titulo: `Aula ${mod.ordem}.1 — Fundamentos`, tipo: 'video', duracao: 45, conteudo: 'Conteúdo da aula com vídeo explicativo.', ordem: 1 },
                    { titulo: `Aula ${mod.ordem}.2 — Desenvolvimento`, tipo: 'texto', duracao: 30, conteudo: 'Material de leitura complementar.', ordem: 2 },
                    { titulo: `Aula ${mod.ordem}.3 — Revisão`, tipo: 'video', duracao: 60, conteudo: 'Revisão geral do módulo.', ordem: 3 },
                ];

                for (const aula of aulas) {
                    await pool.query(`
                        INSERT INTO curso_aulas (modulo_id, titulo, tipo, duracao_minutos, conteudo_url, ordem)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [modId, aula.titulo, aula.tipo, aula.duracao, aula.conteudo, aula.ordem]);
                }
            }

            // Avaliação por curso
            await pool.query(`
                INSERT INTO curso_avaliacoes (curso_id, titulo, descricao, nota_minima, perguntas)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                cursoId,
                `Avaliação Final — ${curso.titulo}`,
                `Avaliação de conhecimentos do curso ${curso.titulo}`,
                7.0,
                JSON.stringify([
                    { pergunta: `Qual é o objetivo principal do curso ${curso.titulo}?`, opcoes: ['Formação acadêmica', 'Capacitação ministerial', 'Entretenimento', 'Nenhuma das anteriores'], correta: 1 },
                    { pergunta: 'A formação cristã deve ser fundamentada em:', opcoes: ['Opiniões pessoais', 'Tradições culturais', 'Princípios bíblicos', 'Filosofia secular'], correta: 2 },
                    { pergunta: 'O líder cristão deve exercer seu ministério com:', opcoes: ['Autoritarismo', 'Humildade e serviço', 'Indiferença', 'Competitividade'], correta: 1 },
                    { pergunta: 'A ética ministerial envolve:', opcoes: ['Apenas pregação', 'Conduta íntegra em todas as áreas', 'Apenas questões financeiras', 'Nenhuma das anteriores'], correta: 1 },
                    { pergunta: 'Qual é a base da autoridade ministerial segundo a Bíblia?', opcoes: ['Poder político', 'Riqueza', 'Chamado divino e caráter', 'Popularidade'], correta: 2 },
                ])
            ]);
        }

        // --- Conteúdos de página: Quem Somos ---
        const conteudosQuemSomos = [
            { pagina: 'quem-somos', secao: 'intro', titulo: 'Sobre a CIEIB', conteudo: '<p>A <strong>Convenção das Igrejas Evangélicas Interdenominacional do Brasil (CIEIB)</strong> é uma entidade religiosa de âmbito nacional, constituída como pessoa jurídica de direito privado, sem fins lucrativos, que congrega igrejas evangélicas e ministros do evangelho em todo o território brasileiro.</p><p>Fundada com o propósito de promover a unidade, comunhão e cooperação entre as igrejas e ministros filiados, a CIEIB atua como instrumento de fortalecimento e expansão do Reino de Deus, respeitando a autonomia administrativa de cada congregação.</p>', ordem: 1 },
            { pagina: 'quem-somos', secao: 'missao', titulo: 'Missão', conteudo: 'Promover a comunhão, cooperação e edificação mútua entre as igrejas e ministros filiados, fortalecendo a pregação do evangelho e a expansão do Reino de Deus em todo o Brasil e no mundo.', ordem: 2 },
            { pagina: 'quem-somos', secao: 'visao', titulo: 'Visão', conteudo: 'Ser reconhecida como uma convenção referência em unidade ministerial, ética e compromisso com a Palavra de Deus, promovendo o crescimento saudável das igrejas e a formação de líderes capacitados para o ministério.', ordem: 3 },
            { pagina: 'quem-somos', secao: 'valores', titulo: 'Valores', conteudo: JSON.stringify([
                { icone: 'fa-bible', titulo: 'Fidelidade à Palavra', desc: 'Compromisso inabalável com as Escrituras Sagradas.' },
                { icone: 'fa-hands-helping', titulo: 'Cooperação', desc: 'Trabalho conjunto para o avanço do evangelho.' },
                { icone: 'fa-balance-scale', titulo: 'Ética Ministerial', desc: 'Conduta íntegra e transparente em todas as ações.' },
                { icone: 'fa-heart', titulo: 'Comunhão', desc: 'Relacionamento fraterno entre igrejas e ministros.' }
            ]), ordem: 4 },
            { pagina: 'quem-somos', secao: 'atividades', titulo: 'O que fazemos', conteudo: JSON.stringify([
                'Credenciamento e filiação de ministros e igrejas',
                'Promoção de congressos, seminários e eventos de capacitação',
                'Mediação e apoio jurídico às igrejas filiadas',
                'Formação teológica e ministerial',
                'Apoio a missões nacionais e internacionais'
            ]), ordem: 5 }
        ];

        for (const c of conteudosQuemSomos) {
            await pool.query(`
                INSERT INTO pagina_conteudos (pagina, secao, titulo, conteudo, ordem)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (pagina, secao) DO UPDATE SET titulo=$3, conteudo=$4, ordem=$5
            `, [c.pagina, c.secao, c.titulo, c.conteudo, c.ordem]);
        }

        // --- Notificações do site (públicas) ---
        await pool.query(`
            INSERT INTO notificacoes_site (titulo, mensagem, tipo, link, ativa)
            VALUES
                ('Matrículas Abertas!', 'Inscreva-se nos cursos de Teologia e Formação Ministerial.', 'curso', '/painel-ministro.html', true),
                ('Assembleia Geral 2025', 'Participe da assembleia geral da CIEIB em dezembro.', 'evento', '/painel-ministro.html', true)
            ON CONFLICT DO NOTHING
        `);

        // --- Notificações para o ministro teste ---
        if (mId) {
            await pool.query(`
                INSERT INTO notificacoes (ministro_id, titulo, mensagem, tipo)
                VALUES
                    ($1, 'Bem-vindo à nova área do ministro!', 'Agora você pode acessar cursos, sua credencial digital e muito mais.', 'info'),
                    ($1, 'Novos cursos disponíveis', 'Confira os cursos de Teologia, Capelania e Liderança.', 'curso'),
                    ($1, 'Renove sua credencial', 'Sua credencial digital já está disponível para download.', 'credencial')
            `, [mId]);
        }

        // --- Diretoria e Conselho Fiscal ---
        const diretoriaMembers = [
            { nome: 'Ap. Osni Egidio', cargo: 'Presidente', tipo: 'diretoria', descricao: 'Apóstolo presidente da CIEIB, liderando a convenção desde sua fundação com visão missionária e compromisso com a formação ministerial.', ordem: 1 },
            { nome: 'Pra. Alessandra Egidio', cargo: 'Vice-Presidente', tipo: 'diretoria', descricao: 'Pastora e vice-presidente, responsável pela coordenação dos projetos sociais e pelo fortalecimento das igrejas filiadas.', ordem: 2 },
            { nome: 'Pr. Jonathan Egidio', cargo: '1º Secretário', tipo: 'diretoria', descricao: 'Pastor e primeiro secretário da convenção, gerenciando a comunicação institucional e os registros oficiais.', ordem: 3 },
            { nome: 'Miss. Rafael Egidio', cargo: '2º Secretário', tipo: 'diretoria', descricao: 'Missionário e segundo secretário, auxiliando nas atividades administrativas e na organização de eventos.', ordem: 4 },
            { nome: 'Pr. Vitor Hugo', cargo: '1º Tesoureiro', tipo: 'diretoria', descricao: 'Pastor e primeiro tesoureiro, responsável pela gestão financeira e pela transparência das contas da convenção.', ordem: 5 },
            { nome: 'Pr. Willian Egidio', cargo: '2º Tesoureiro', tipo: 'diretoria', descricao: 'Pastor e segundo tesoureiro, auxiliando na administração financeira e no planejamento orçamentário.', ordem: 6 },
            { nome: 'Pr. Marcus Vinicius', cargo: 'Membro', tipo: 'conselho_fiscal', descricao: '', ordem: 1 },
            { nome: 'Pr. Marcos Egidio', cargo: 'Membro', tipo: 'conselho_fiscal', descricao: '', ordem: 2 },
            { nome: 'Pr. Lucas Egidio', cargo: 'Membro', tipo: 'conselho_fiscal', descricao: '', ordem: 3 },
        ];

        for (const d of diretoriaMembers) {
            await pool.query(`
                INSERT INTO diretoria (nome, cargo, tipo, descricao, ordem, ativo)
                VALUES ($1, $2, $3, $4, $5, true)
                ON CONFLICT DO NOTHING
            `, [d.nome, d.cargo, d.tipo, d.descricao, d.ordem]);
        }

        // --- Admin padrão ---
        const adminSenha = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO admins (nome, email, senha, role)
            VALUES ('Administrador CIEIB', 'admin@cieib.org.br', $1, 'superadmin')
            ON CONFLICT (email) DO NOTHING
        `, [adminSenha]);

        // --- Redes sociais ---
        const redes = [
            { nome: 'Facebook', url: 'https://facebook.com/cieib', icone: 'fab fa-facebook-f', ordem: 1 },
            { nome: 'Instagram', url: 'https://instagram.com/cieib', icone: 'fab fa-instagram', ordem: 2 },
            { nome: 'YouTube', url: 'https://youtube.com/cieib', icone: 'fab fa-youtube', ordem: 3 },
            { nome: 'WhatsApp', url: 'https://wa.me/5500000000000', icone: 'fab fa-whatsapp', ordem: 4 },
        ];
        for (const r of redes) {
            await pool.query(`
                INSERT INTO redes_sociais (nome, url, icone, ordem)
                SELECT $1, $2, $3, $4
                WHERE NOT EXISTS (SELECT 1 FROM redes_sociais WHERE nome = $1)
            `, [r.nome, r.url, r.icone, r.ordem]);
        }

        console.log('✅ Dados iniciais inseridos com sucesso!');
    } catch (err) {
        console.error('❌ Erro no seed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
