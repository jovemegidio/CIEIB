/* ==============================================================
   PAINEL ADMINISTRATIVO — JavaScript
   ============================================================== */

// ---- API Helper ----
const AdminAPI = {
    baseUrl: '/api/admin',
    token: () => localStorage.getItem('admin_token'),
    isMock: () => localStorage.getItem('admin_token') === 'mock_token_dev',
    headers: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AdminAPI.token()}`
    }),

    // Mock data for dev/visualization mode (dados de demonstração)
    _mockData: {
        '/dashboard': {
            stats: { ministros: 128, eventos: 5, noticias: 24, cursos: 8, contatos_pendentes: 3, matriculas: 47 },
            recentMinistros: [
                { nome: 'Pr. João Carlos da Silva', cargo: 'Pastor Presidente', status: 'ATIVO' },
                { nome: 'Pra. Maria Aparecida Souza', cargo: 'Missionária', status: 'ATIVO' },
                { nome: 'Ev. Pedro Henrique Lima', cargo: 'Evangelista', status: 'PENDENTE' }
            ],
            recentContatos: [
                { nome: 'Carlos Eduardo Oliveira', assunto: 'Filiação de Igreja', lida: false },
                { nome: 'Ana Paula Santos', assunto: 'Credenciamento Ministerial', lida: true },
                { nome: 'Roberto da Silva', assunto: 'Eventos e Convenções', lida: false }
            ]
        },
        '/noticias': [
            { id: 1, titulo: 'CIEIB Realiza 15ª Convenção Nacional em Brasília', categoria: 'Institucional', destaque: true, data_publicacao: '2025-07-01', resumo: 'O evento reunirá líderes de todo o Brasil para discutir os rumos da convenção e eleger a nova diretoria.', conteudo: 'A Convenção de Igrejas Evangélicas Independentes do Brasil realizará sua 15ª edição na capital federal, reunindo pastores, missionários e líderes eclesiásticos de todos os estados.', imagem_url: '' },
            { id: 2, titulo: 'Programa de Capacitação Ministerial 2025 Abre Inscrições', categoria: 'Educação', destaque: false, data_publicacao: '2025-06-28', resumo: 'Nova turma do programa oferece cursos de teologia, liderança e aconselhamento bíblico com certificação.', conteudo: 'O programa de capacitação ministerial da CIEIB abre inscrições para o segundo semestre de 2025 com diversas modalidades de cursos.', imagem_url: '' },
            { id: 3, titulo: 'Campanha Nacional de Missões Urbanas é Lançada', categoria: 'Missões', destaque: true, data_publicacao: '2025-06-25', resumo: 'A CIEIB convoca igrejas afiliadas para a maior ação missionária do ano nas capitais brasileiras.', conteudo: 'A campanha visa alcançar comunidades em situação de vulnerabilidade social nas principais capitais do Brasil.', imagem_url: '' },
            { id: 4, titulo: 'Encontro Nacional de Jovens Reunirá 500 Participantes', categoria: 'Juventude', destaque: false, data_publicacao: '2025-06-20', resumo: 'O encontro acontecerá em agosto com palestras, oficinas e momentos de louvor e adoração.', conteudo: 'O Encontro Nacional de Jovens da CIEIB promete ser o maior já realizado, com palestrantes renomados e atividades para todas as idades.', imagem_url: '' },
            { id: 5, titulo: 'Nova Sede Regional Inaugurada em Minas Gerais', categoria: 'Expansão', destaque: false, data_publicacao: '2025-06-15', resumo: 'A nova sede fortalece a presença da CIEIB na região sudeste do país.', conteudo: 'Foi inaugurada nesta semana a nova sede regional da CIEIB em Belo Horizonte, que atenderá igrejas de Minas Gerais e Espírito Santo.', imagem_url: '' }
        ],
        '/eventos': [
            { id: 1, titulo: '15ª Convenção Nacional CIEIB', data_evento: '2025-09-15', data_termino: '2025-09-18', hora_inicio: '09:00', local: 'Centro de Convenções — Brasília/DF', status: 'ABERTO', valor: 250.00, descricao: 'Principal evento anual da convenção com assembleias, palestras e eleição da nova diretoria.' },
            { id: 2, titulo: 'Seminário de Liderança Pastoral', data_evento: '2025-08-20', data_termino: '2025-08-21', hora_inicio: '14:00', local: 'Igreja Sede — São Paulo/SP', status: 'ABERTO', valor: 80.00, descricao: 'Capacitação intensiva para líderes e pastores com foco em gestão eclesiástica.' },
            { id: 3, titulo: 'Retiro de Obreiros 2025', data_evento: '2025-07-25', data_termino: '2025-07-27', hora_inicio: '08:00', local: 'Sítio Betel — Campinas/SP', status: 'CONFIRMADO', valor: 180.00, descricao: 'Retiro espiritual para obreiros com momentos de oração, louvor e comunhão.' },
            { id: 4, titulo: 'Congresso de Missões', data_evento: '2025-10-10', data_termino: '2025-10-12', hora_inicio: '19:00', local: 'Auditório Central — Belo Horizonte/MG', status: 'EM BREVE', valor: 0, descricao: 'Congresso missionário com palestrantes nacionais e internacionais. Entrada gratuita.' }
        ],
        '/cursos': [
            { id: 1, titulo: 'Teologia Básica', categoria: 'Teologia', nivel: 'Básico', carga_horaria: 120, total_modulos: 12, total_matriculas: 35, certificado: true, imagem_url: '' },
            { id: 2, titulo: 'Liderança Pastoral Avançada', categoria: 'Liderança', nivel: 'Avançado', carga_horaria: 80, total_modulos: 8, total_matriculas: 22, certificado: true, imagem_url: '' },
            { id: 3, titulo: 'Aconselhamento Bíblico', categoria: 'Pastoral', nivel: 'Intermediário', carga_horaria: 60, total_modulos: 6, total_matriculas: 18, certificado: true, imagem_url: '' },
            { id: 4, titulo: 'Missões Transculturais', categoria: 'Missões', nivel: 'Intermediário', carga_horaria: 40, total_modulos: 4, total_matriculas: 12, certificado: false, imagem_url: '' }
        ],
        '/conteudos': [
            { id: 1, pagina: 'home', secao: 'hero', titulo: 'Bem-vindo à CIEIB', conteudo: 'Convenção de Igrejas Evangélicas Independentes do Brasil — Servindo ao Reino de Deus desde 1990.', imagem_url: '' },
            { id: 2, pagina: 'quem-somos', secao: 'introducao', titulo: 'Nossa História', conteudo: 'Fundada em 1990, a CIEIB nasceu do desejo de unir igrejas evangélicas independentes em torno de uma missão comum de edificação e expansão do evangelho.', imagem_url: '' },
            { id: 3, pagina: 'home', secao: 'sobre', titulo: 'Sobre a CIEIB', conteudo: 'Somos uma convenção que preza pela autonomia das igrejas locais, oferecendo suporte jurídico, educacional e ministerial aos nossos filiados.', imagem_url: '' },
            { id: 4, pagina: 'contato', secao: 'info', titulo: 'Fale Conosco', conteudo: 'Entre em contato com nossa equipe para tirar dúvidas sobre filiação, credenciamento e eventos da convenção.', imagem_url: '' }
        ],
        '/ministros': {
            ministros: [
                { id: 1, nome: 'Pr. João Carlos da Silva', cpf: '123.456.789-00', cargo: 'Pastor Presidente', registro: 'CIEIB-2020-001', status: 'ATIVO' },
                { id: 2, nome: 'Pra. Maria Aparecida Souza', cpf: '234.567.890-11', cargo: 'Missionária', registro: 'CIEIB-2019-015', status: 'ATIVO' },
                { id: 3, nome: 'Ev. Pedro Henrique Lima', cpf: '345.678.901-22', cargo: 'Evangelista', registro: 'CIEIB-2021-032', status: 'ATIVO' },
                { id: 4, nome: 'Dc. Ana Paula Santos', cpf: '456.789.012-33', cargo: 'Diaconisa', registro: 'CIEIB-2023-048', status: 'PENDENTE' },
                { id: 5, nome: 'Pb. Roberto Oliveira', cpf: '567.890.123-44', cargo: 'Presbítero', registro: 'CIEIB-2022-027', status: 'ATIVO' }
            ],
            total: 5, page: 1, totalPages: 1
        },
        '/diretoria': [
            { id: 1, nome: 'Pr. Nome do Presidente', cargo: 'Presidente', tipo: 'diretoria', email: 'presidente@cieib.org.br', descricao: 'Líder da convenção e responsável pela condução dos trabalhos e representação institucional.', foto_url: '', ordem: 1 },
            { id: 2, nome: 'Pr. Nome do Vice-Presidente', cargo: '1º Vice-Presidente', tipo: 'diretoria', email: 'vice@cieib.org.br', descricao: 'Auxiliar direto do presidente e responsável por substituí-lo em suas ausências.', foto_url: '', ordem: 2 },
            { id: 3, nome: 'Pr. Nome do 2º Vice', cargo: '2º Vice-Presidente', tipo: 'diretoria', email: '', descricao: 'Membro da diretoria executiva com atribuições de apoio à presidência.', foto_url: '', ordem: 3 },
            { id: 4, nome: 'Pr. Nome do Secretário', cargo: 'Secretário Geral', tipo: 'diretoria', email: 'secretaria@cieib.org.br', descricao: 'Responsável pela administração, documentação e comunicação oficial da convenção.', foto_url: '', ordem: 4 },
            { id: 5, nome: 'Pr. Nome do 1º Secretário', cargo: '1º Secretário', tipo: 'diretoria', email: '', descricao: 'Auxiliar do Secretário Geral nas funções administrativas e burocráticas.', foto_url: '', ordem: 5 },
            { id: 6, nome: 'Pr. Nome do Tesoureiro', cargo: 'Tesoureiro Geral', tipo: 'diretoria', email: 'tesouraria@cieib.org.br', descricao: 'Responsável pela gestão financeira e prestação de contas da convenção.', foto_url: '', ordem: 6 },
            { id: 7, nome: 'Pr. Nome do Conselheiro', cargo: 'Presidente do Conselho', tipo: 'conselho_fiscal', email: '', descricao: 'Presidente do Conselho Fiscal da convenção.', foto_url: '', ordem: 1 },
            { id: 8, nome: 'Pr. Nome do Conselheiro', cargo: 'Membro', tipo: 'conselho_fiscal', email: '', descricao: 'Membro do Conselho Fiscal.', foto_url: '', ordem: 2 },
            { id: 9, nome: 'Pr. Nome do Conselheiro', cargo: 'Membro', tipo: 'conselho_fiscal', email: '', descricao: 'Membro do Conselho Fiscal.', foto_url: '', ordem: 3 }
        ],
        '/contatos': [
            { id: 1, nome: 'Carlos Eduardo Oliveira', email: 'carlos@email.com', telefone: '(11) 99999-0001', assunto: 'Filiação de Igreja', mensagem: 'Gostaria de saber os requisitos para filiar nossa igreja à CIEIB. Somos uma igreja independente localizada em Guarulhos/SP com 150 membros.', lida: false, created_at: '2025-07-05T10:30:00' },
            { id: 2, nome: 'Ana Paula Santos', email: 'ana.santos@email.com', telefone: '(21) 98888-0002', assunto: 'Credenciamento Ministerial', mensagem: 'Sou pastora há 8 anos e gostaria de informações sobre o processo de credenciamento junto à convenção.', lida: true, created_at: '2025-07-03T14:15:00' },
            { id: 3, nome: 'Roberto da Silva', email: 'roberto.silva@email.com', telefone: '(31) 97777-0003', assunto: 'Eventos e Convenções', mensagem: 'Quando será a próxima convenção nacional? Gostaria de inscrever uma delegação de 20 pessoas da nossa igreja.', lida: false, created_at: '2025-07-01T09:00:00' }
        ],
        '/configuracoes': [
            { chave: 'nome_site', valor: 'CIEIB — Convenção de Igrejas Evangélicas Independentes do Brasil', descricao: 'Nome do Site' },
            { chave: 'email_contato', valor: 'contato@cieib.org.br', descricao: 'Email de Contato' },
            { chave: 'telefone', valor: '(11) 3000-0000', descricao: 'Telefone Principal' },
            { chave: 'endereco', valor: 'Rua da Convenção, 123 — Centro, São Paulo/SP', descricao: 'Endereço da Sede' },
            { chave: 'horario_funcionamento', valor: 'Seg a Sex — 9h às 18h', descricao: 'Horário de Funcionamento' },
            { chave: 'meta_description', valor: 'CIEIB é uma convenção que reúne igrejas evangélicas independentes em todo o Brasil.', descricao: 'Meta Description (SEO)' }
        ],
        '/redes-sociais': [
            { id: 1, nome: 'Facebook', url: 'https://facebook.com/cieib', icone: 'fab fa-facebook-f', ordem: 1, ativa: true },
            { id: 2, nome: 'Instagram', url: 'https://instagram.com/cieib', icone: 'fab fa-instagram', ordem: 2, ativa: true },
            { id: 3, nome: 'YouTube', url: 'https://youtube.com/@cieib', icone: 'fab fa-youtube', ordem: 3, ativa: true },
            { id: 4, nome: 'WhatsApp', url: 'https://wa.me/5511900000000', icone: 'fab fa-whatsapp', ordem: 4, ativa: true }
        ],
        '/midias': [
            { id: 1, titulo: 'Logo CIEIB', tipo: 'imagem', url: '/uploads/logo-cieib.png', tamanho: 45056 },
            { id: 2, titulo: 'Banner Convenção 2025', tipo: 'imagem', url: '/uploads/banner-convencao.jpg', tamanho: 256000 },
            { id: 3, titulo: 'Regimento Interno PDF', tipo: 'documento', url: '/uploads/regimento-interno.pdf', tamanho: 1024000 }
        ],
        '/notificacoes-site': [
            { id: 1, titulo: '15ª Convenção Nacional', mensagem: 'Inscrições abertas até 30 de agosto!', tipo: 'evento', link: '#eventos', ativa: true, data_inicio: '2026-01-01T00:00', data_fim: '2026-08-30T23:59' },
            { id: 2, titulo: 'Novo Curso de Teologia Básica', mensagem: 'Matrículas abertas para o segundo semestre.', tipo: 'curso', link: '#cursos', ativa: true, data_inicio: '2026-02-01T00:00', data_fim: null },
            { id: 3, titulo: 'Horário de Atendimento', mensagem: 'Secretaria funciona de segunda a sexta, das 9h às 18h.', tipo: 'info', link: '', ativa: false, data_inicio: '2026-01-01T00:00', data_fim: null }
        ],
    },

    _getMockResponse(method, endpoint) {
        if (method !== 'GET') return { success: true, message: 'Mock: operação simulada' };
        const base = endpoint.split('?')[0];
        return this._mockData[base] || [];
    },

    async request(method, endpoint, body) {
        // Mock mode — return fake data, no network calls
        if (AdminAPI.isMock()) {
            return AdminAPI._getMockResponse(method, endpoint);
        }

        const opts = { method, headers: AdminAPI.headers() };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${AdminAPI.baseUrl}${endpoint}`, opts);
        if (res.status === 401) { adminLogout(); throw new Error('Sessão expirada'); }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na requisição');
        return data;
    },
    get: (ep) => AdminAPI.request('GET', ep),
    post: (ep, b) => AdminAPI.request('POST', ep, b),
    put: (ep, b) => AdminAPI.request('PUT', ep, b),
    del: (ep) => AdminAPI.request('DELETE', ep),
};

// ---- State ----
let currentSection = 'dashboard';
let allNoticias = [], allEventos = [], allCursos = [], allContatos = [];
let allConteudos = [], allDiretoria = [], allRedes = [], allMidias = [], allNotifSite = [];

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        showPanel();
    } else {
        showLogin();
    }

    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const senha = document.getElementById('adminSenha').value;

        // ---- Mock login (visualização) ----
        if (email === 'admin@cieib.org.br' && senha === 'admin123') {
            localStorage.setItem('admin_token', 'mock_token_dev');
            localStorage.setItem('admin_data', JSON.stringify({ nome: 'Administrador', email }));
            showPanel();
            return;
        }

        try {
            const data = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            }).then(r => r.json());

            if (data.token) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_data', JSON.stringify(data.admin));
                showPanel();
            } else {
                showToast(data.error || 'Credenciais inválidas', 'error');
            }
        } catch (err) {
            showToast('Erro ao conectar', 'error');
        }
    });

    // Sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateTo(section);
        });
    });

    // Mobile sidebar
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.add('active');
        document.getElementById('sidebarOverlay').classList.add('active');
    });

    document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
});

function closeSidebar() {
    document.getElementById('adminSidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function showLogin() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    const admin = JSON.parse(localStorage.getItem('admin_data') || '{}');
    document.getElementById('adminNome').textContent = admin.nome || 'Admin';
    loadDashboard();
}

function adminLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    showLogin();
}

function navigateTo(section) {
    currentSection = section;
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    const sec = document.getElementById(`sec-${section}`);
    if (sec) sec.classList.add('active');

    const link = document.querySelector(`.sidebar-link[data-section="${section}"]`);
    if (link) link.classList.add('active');

    closeSidebar();

    // Load data for section
    const loaders = {
        dashboard: loadDashboard,
        noticias: loadAdminNoticias,
        eventos: loadAdminEventos,
        cursos: loadAdminCursos,
        paginas: loadConteudos,
        ministros: loadAdminMinistros,
        diretoria: loadAdminDiretoria,
        contatos: loadAdminContatos,
        configuracoes: loadConfiguracoes,
        redes: loadRedes,
        midias: loadMidias,
        notificacoes: loadNotifSite,
    };
    if (loaders[section]) loaders[section]();
}

// ================================================================
// DASHBOARD
// ================================================================
async function loadDashboard() {
    try {
        document.getElementById('dashDate').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const data = await AdminAPI.get('/dashboard');
        const s = data.stats;

        document.getElementById('dashStats').innerHTML = `
            <div class="stat-card"><div class="stat-card-icon blue"><i class="fas fa-users"></i></div><div class="stat-card-info"><h4>${s.ministros}</h4><p>Ministros</p></div></div>
            <div class="stat-card"><div class="stat-card-icon gold"><i class="fas fa-calendar-alt"></i></div><div class="stat-card-info"><h4>${s.eventos}</h4><p>Eventos</p></div></div>
            <div class="stat-card"><div class="stat-card-icon green"><i class="fas fa-newspaper"></i></div><div class="stat-card-info"><h4>${s.noticias}</h4><p>Notícias</p></div></div>
            <div class="stat-card"><div class="stat-card-icon teal"><i class="fas fa-graduation-cap"></i></div><div class="stat-card-info"><h4>${s.cursos}</h4><p>Cursos</p></div></div>
            <div class="stat-card"><div class="stat-card-icon red"><i class="fas fa-envelope"></i></div><div class="stat-card-info"><h4>${s.contatos_pendentes}</h4><p>Contatos Pendentes</p></div></div>
            <div class="stat-card"><div class="stat-card-icon purple"><i class="fas fa-user-graduate"></i></div><div class="stat-card-info"><h4>${s.matriculas}</h4><p>Matrículas</p></div></div>
        `;

        if (s.contatos_pendentes > 0) {
            const badge = document.getElementById('contatosBadge');
            badge.textContent = s.contatos_pendentes;
            badge.style.display = 'inline';
        }

        // Recent ministros
        document.getElementById('dashMinistros').innerHTML = data.recentMinistros.length === 0
            ? '<p style="color:#aaa;text-align:center;">Nenhum ministro recente</p>'
            : data.recentMinistros.map(m => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <div><strong style="font-size:0.82rem;">${m.nome}</strong><br><span style="font-size:0.72rem;color:#999;">${m.cargo}</span></div>
                    <span class="badge ${m.status === 'ATIVO' ? 'badge-ativo' : 'badge-inativo'}">${m.status}</span>
                </div>
            `).join('');

        // Recent contacts
        document.getElementById('dashContatos').innerHTML = data.recentContatos.length === 0
            ? '<p style="color:#aaa;text-align:center;">Nenhum contato recente</p>'
            : data.recentContatos.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <div><strong style="font-size:0.82rem;">${c.nome}</strong><br><span style="font-size:0.72rem;color:#999;">${c.assunto || 'Sem assunto'}</span></div>
                    <span class="badge ${c.lida ? 'badge-ativo' : 'badge-aberto'}">${c.lida ? 'Lida' : 'Nova'}</span>
                </div>
            `).join('');

    } catch (err) {
        showToast('Erro ao carregar dashboard', 'error');
    }
}

// ================================================================
// NOTÍCIAS
// ================================================================
async function loadAdminNoticias() {
    try {
        allNoticias = await AdminAPI.get('/noticias');
        renderNoticiasTable();
    } catch (err) { showToast('Erro ao carregar notícias', 'error'); }
}

function renderNoticiasTable() {
    const el = document.getElementById('noticiasTable');
    if (allNoticias.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhuma notícia cadastrada</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Categoria</th><th>Destaque</th><th>Data</th><th>Ações</th></tr></thead><tbody>
        ${allNoticias.map(n => `<tr>
            <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.titulo}</td>
            <td>${n.categoria || '-'}</td>
            <td>${n.destaque ? '<span class="badge badge-destaque">Destaque</span>' : '-'}</td>
            <td>${formatDate(n.data_publicacao)}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openNoticiaModal(${n.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('noticias', ${n.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openNoticiaModal(id) {
    const item = id ? allNoticias.find(n => n.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Notícia' : 'Nova Notícia';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título</label><input type="text" id="mNoticiaTitle" value="${item?.titulo || ''}"></div>
        <div class="admin-form-group"><label>Resumo</label><textarea id="mNoticiaResumo">${item?.resumo || ''}</textarea></div>
        <div class="admin-form-group"><label>Conteúdo</label><textarea id="mNoticiaConteudo" style="min-height:120px;">${item?.conteudo || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Categoria</label><input type="text" id="mNoticiaCat" value="${item?.categoria || ''}"></div>
            <div class="admin-form-group"><label>Imagem URL</label><input type="text" id="mNoticiaImg" value="${item?.imagem_url || ''}"></div>
        </div>
        <div class="admin-form-group"><label><input type="checkbox" id="mNoticiaDest" ${item?.destaque ? 'checked' : ''}> Destaque</label></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveNoticia(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveNoticia(id) {
    const body = {
        titulo: document.getElementById('mNoticiaTitle').value,
        resumo: document.getElementById('mNoticiaResumo').value,
        conteudo: document.getElementById('mNoticiaConteudo').value,
        categoria: document.getElementById('mNoticiaCat').value,
        imagem_url: document.getElementById('mNoticiaImg').value,
        destaque: document.getElementById('mNoticiaDest').checked,
        publicada: true
    };
    try {
        if (id) await AdminAPI.put(`/noticias/${id}`, body);
        else await AdminAPI.post('/noticias', body);
        closeModal();
        showToast('Notícia salva!', 'success');
        loadAdminNoticias();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// EVENTOS
// ================================================================
async function loadAdminEventos() {
    try {
        allEventos = await AdminAPI.get('/eventos');
        renderEventosTable();
    } catch (err) { showToast('Erro ao carregar eventos', 'error'); }
}

function renderEventosTable() {
    const el = document.getElementById('eventosTable');
    if (allEventos.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum evento cadastrado</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Data</th><th>Local</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead><tbody>
        ${allEventos.map(e => `<tr>
            <td>${e.titulo}</td>
            <td>${formatDate(e.data_evento)}</td>
            <td>${e.local || '-'}</td>
            <td><span class="badge ${e.status === 'Aberto' ? 'badge-ativo' : 'badge-inativo'}">${e.status}</span></td>
            <td>R$ ${parseFloat(e.valor || 0).toFixed(2)}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openEventoModal(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('eventos', ${e.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openEventoModal(id) {
    const item = id ? allEventos.find(e => e.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Evento' : 'Novo Evento';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título</label><input type="text" id="mEventoTitle" value="${item?.titulo || ''}"></div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mEventoDesc">${item?.descricao || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Data Início</label><input type="date" id="mEventoData" value="${item?.data_evento?.split('T')[0] || ''}"></div>
            <div class="admin-form-group"><label>Data Término</label><input type="date" id="mEventoFim" value="${item?.data_termino?.split('T')[0] || ''}"></div>
            <div class="admin-form-group"><label>Hora Início</label><input type="time" id="mEventoHora" value="${item?.hora_inicio || ''}"></div>
            <div class="admin-form-group"><label>Valor (R$)</label><input type="number" id="mEventoValor" step="0.01" value="${item?.valor || '0'}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Local</label><input type="text" id="mEventoLocal" value="${item?.local || ''}"></div>
            <div class="admin-form-group"><label>Status</label>
                <select id="mEventoStatus">
                    <option value="Aberto" ${item?.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Encerrado" ${item?.status === 'Encerrado' ? 'selected' : ''}>Encerrado</option>
                    <option value="Cancelado" ${item?.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveEvento(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveEvento(id) {
    const body = {
        titulo: document.getElementById('mEventoTitle').value,
        descricao: document.getElementById('mEventoDesc').value,
        data_evento: document.getElementById('mEventoData').value,
        data_termino: document.getElementById('mEventoFim').value,
        hora_inicio: document.getElementById('mEventoHora').value,
        valor: parseFloat(document.getElementById('mEventoValor').value) || 0,
        local: document.getElementById('mEventoLocal').value,
        status: document.getElementById('mEventoStatus').value,
    };
    try {
        if (id) await AdminAPI.put(`/eventos/${id}`, body);
        else await AdminAPI.post('/eventos', body);
        closeModal(); showToast('Evento salvo!', 'success'); loadAdminEventos();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// CURSOS
// ================================================================
async function loadAdminCursos() {
    try {
        allCursos = await AdminAPI.get('/cursos');
        renderCursosTable();
    } catch (err) { showToast('Erro ao carregar cursos', 'error'); }
}

function renderCursosTable() {
    const el = document.getElementById('cursosTable');
    if (allCursos.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum curso cadastrado</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Categoria</th><th>Nível</th><th>Carga H.</th><th>Módulos</th><th>Matrículas</th><th>Ações</th></tr></thead><tbody>
        ${allCursos.map(c => `<tr>
            <td>${c.titulo}</td>
            <td>${c.categoria || '-'}</td>
            <td>${c.nivel || '-'}</td>
            <td>${c.carga_horaria || 0}h</td>
            <td>${c.total_modulos || 0}</td>
            <td>${c.total_matriculas || 0}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-view" onclick="openCursoModulos(${c.id})" title="Módulos"><i class="fas fa-folder-open"></i></button>
                <button class="btn-table-action btn-table-edit" onclick="openCursoModal(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('cursos', ${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openCursoModal(id) {
    const item = id ? allCursos.find(c => c.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Curso' : 'Novo Curso';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título</label><input type="text" id="mCursoTitle" value="${item?.titulo || ''}"></div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mCursoDesc">${item?.descricao || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Categoria</label><input type="text" id="mCursoCat" value="${item?.categoria || ''}"></div>
            <div class="admin-form-group"><label>Nível</label>
                <select id="mCursoNivel">
                    <option value="Básico" ${item?.nivel === 'Básico' ? 'selected' : ''}>Básico</option>
                    <option value="Intermediário" ${item?.nivel === 'Intermediário' ? 'selected' : ''}>Intermediário</option>
                    <option value="Avançado" ${item?.nivel === 'Avançado' ? 'selected' : ''}>Avançado</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Carga Horária (h)</label><input type="number" id="mCursoCH" value="${item?.carga_horaria || 0}"></div>
            <div class="admin-form-group"><label>Imagem URL</label><input type="text" id="mCursoImg" value="${item?.imagem_url || ''}"></div>
        </div>
        <div class="admin-form-group"><label><input type="checkbox" id="mCursoCert" ${item?.certificado !== false ? 'checked' : ''}> Emite Certificado</label></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveCurso(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveCurso(id) {
    const body = {
        titulo: document.getElementById('mCursoTitle').value,
        descricao: document.getElementById('mCursoDesc').value,
        categoria: document.getElementById('mCursoCat').value,
        nivel: document.getElementById('mCursoNivel').value,
        carga_horaria: parseInt(document.getElementById('mCursoCH').value) || 0,
        imagem_url: document.getElementById('mCursoImg').value,
        certificado: document.getElementById('mCursoCert').checked,
        status: 'ativo'
    };
    try {
        if (id) await AdminAPI.put(`/cursos/${id}`, body);
        else await AdminAPI.post('/cursos', body);
        closeModal(); showToast('Curso salvo!', 'success'); loadAdminCursos();
    } catch (err) { showToast(err.message, 'error'); }
}

async function openCursoModulos(cursoId) {
    try {
        const modulos = await AdminAPI.get(`/cursos/${cursoId}/modulos`);
        const curso = allCursos.find(c => c.id === cursoId);
        document.getElementById('modalTitle').textContent = `Módulos — ${curso?.titulo || ''}`;
        document.getElementById('modalBody').innerHTML = `
            <button class="btn-admin-primary" onclick="openModuloForm(${cursoId})" style="margin-bottom:16px;"><i class="fas fa-plus"></i> Novo Módulo</button>
            <div id="modulosList">${modulos.length === 0 ? '<p style="color:#aaa;text-align:center;">Nenhum módulo</p>' : modulos.map(m => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;">
                    <div>
                        <strong style="font-size:0.85rem;">${m.titulo}</strong>
                        <span style="font-size:0.72rem;color:#999;margin-left:8px;">${m.total_aulas || 0} aulas</span>
                    </div>
                    <div class="actions-cell">
                        <button class="btn-table-action btn-table-view" onclick="openModuloAulas(${m.id}, '${m.titulo.replace(/'/g, "\\'")}')"><i class="fas fa-list"></i></button>
                        <button class="btn-table-action btn-table-delete" onclick="deleteModulo(${m.id}, ${cursoId})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}</div>
        `;
        document.getElementById('modalFooter').innerHTML = `<button class="btn-admin-secondary" onclick="closeModal()">Fechar</button>`;
        openModal();
    } catch (err) { showToast(err.message, 'error'); }
}

function openModuloForm(cursoId) {
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <div class="admin-form-group"><label>Título do Módulo</label><input type="text" id="mModTitle"></div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mModDesc"></textarea></div>
        <div class="admin-form-group"><label>Ordem</label><input type="number" id="mModOrdem" value="0"></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
            <button class="btn-admin-secondary" onclick="openCursoModulos(${cursoId})">Voltar</button>
            <button class="btn-admin-primary" onclick="saveModulo(${cursoId})"><i class="fas fa-save"></i> Salvar</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
}

async function saveModulo(cursoId) {
    try {
        await AdminAPI.post(`/cursos/${cursoId}/modulos`, {
            titulo: document.getElementById('mModTitle').value,
            descricao: document.getElementById('mModDesc').value,
            ordem: parseInt(document.getElementById('mModOrdem').value) || 0
        });
        showToast('Módulo criado!', 'success');
        openCursoModulos(cursoId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteModulo(moduloId, cursoId) {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
    try {
        await AdminAPI.del(`/modulos/${moduloId}`);
        showToast('Módulo excluído', 'success');
        openCursoModulos(cursoId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function openModuloAulas(moduloId, moduloTitulo) {
    try {
        const aulas = await AdminAPI.get(`/modulos/${moduloId}/aulas`);
        document.getElementById('modalTitle').textContent = `Aulas — ${moduloTitulo}`;
        document.getElementById('modalBody').innerHTML = `
            <button class="btn-admin-primary" onclick="openAulaForm(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')" style="margin-bottom:16px;"><i class="fas fa-plus"></i> Nova Aula</button>
            ${aulas.length === 0 ? '<p style="color:#aaa;text-align:center;">Nenhuma aula</p>' : aulas.map(a => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;">
                    <div>
                        <strong style="font-size:0.85rem;">${a.titulo}</strong>
                        <span style="font-size:0.72rem;color:#999;margin-left:8px;">${a.tipo} — ${a.duracao_minutos || 0}min</span>
                    </div>
                    <button class="btn-table-action btn-table-delete" onclick="deleteAula(${a.id}, ${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                </div>
            `).join('')}
        `;
        document.getElementById('modalFooter').innerHTML = `<button class="btn-admin-secondary" onclick="closeModal()">Fechar</button>`;
    } catch (err) { showToast(err.message, 'error'); }
}

function openAulaForm(moduloId, moduloTitulo) {
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título</label><input type="text" id="mAulaTitle"></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Tipo</label>
                <select id="mAulaTipo"><option value="video">Vídeo</option><option value="texto">Texto</option><option value="pdf">PDF</option></select>
            </div>
            <div class="admin-form-group"><label>Duração (min)</label><input type="number" id="mAulaDuracao" value="0"></div>
        </div>
        <div class="admin-form-group"><label>Conteúdo</label><textarea id="mAulaConteudo" style="min-height:100px;"></textarea></div>
        <div style="display:flex;gap:10px;margin-top:16px;">
            <button class="btn-admin-secondary" onclick="openModuloAulas(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')">Voltar</button>
            <button class="btn-admin-primary" onclick="saveAula(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')"><i class="fas fa-save"></i> Salvar</button>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = '';
}

async function saveAula(moduloId, moduloTitulo) {
    try {
        await AdminAPI.post(`/modulos/${moduloId}/aulas`, {
            titulo: document.getElementById('mAulaTitle').value,
            tipo: document.getElementById('mAulaTipo').value,
            duracao_minutos: parseInt(document.getElementById('mAulaDuracao').value) || 0,
            conteudo: document.getElementById('mAulaConteudo').value,
        });
        showToast('Aula criada!', 'success');
        openModuloAulas(moduloId, moduloTitulo);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteAula(aulaId, moduloId, moduloTitulo) {
    if (!confirm('Excluir esta aula?')) return;
    try {
        await AdminAPI.del(`/aulas/${aulaId}`);
        showToast('Aula excluída', 'success');
        openModuloAulas(moduloId, moduloTitulo);
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// CONTEÚDOS / CMS
// ================================================================
async function loadConteudos() {
    try {
        allConteudos = await AdminAPI.get('/conteudos');
        renderConteudosTable();
    } catch (err) { showToast('Erro ao carregar conteúdos', 'error'); }
}

function filterCMS(pagina) {
    document.querySelectorAll('.cms-filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderConteudosTable(pagina === 'todos' ? null : pagina);
}

function renderConteudosTable(filterPagina) {
    const el = document.getElementById('conteudosTable');
    const items = filterPagina ? allConteudos.filter(c => c.pagina === filterPagina) : allConteudos;
    if (items.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum conteúdo cadastrado</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Página</th><th>Seção</th><th>Título</th><th>Ações</th></tr></thead><tbody>
        ${items.map(c => `<tr>
            <td><span class="badge badge-ativo">${c.pagina}</span></td>
            <td>${c.secao}</td>
            <td>${c.titulo || '-'}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openConteudoModal(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('conteudos', ${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openConteudoModal(id) {
    const item = id ? allConteudos.find(c => c.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Conteúdo' : 'Novo Conteúdo';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Página</label><input type="text" id="mCmsPagina" value="${item?.pagina || ''}" placeholder="ex: quem-somos, home"></div>
            <div class="admin-form-group"><label>Seção</label><input type="text" id="mCmsSecao" value="${item?.secao || ''}" placeholder="ex: missao, visao, historia"></div>
        </div>
        <div class="admin-form-group"><label>Título</label><input type="text" id="mCmsTitulo" value="${item?.titulo || ''}"></div>
        <div class="admin-form-group"><label>Conteúdo</label><textarea id="mCmsConteudo" style="min-height:160px;">${item?.conteudo || ''}</textarea></div>
        <div class="admin-form-group"><label>Imagem URL</label><input type="text" id="mCmsImg" value="${item?.imagem_url || ''}"></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveConteudo(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveConteudo(id) {
    const body = {
        pagina: document.getElementById('mCmsPagina').value,
        secao: document.getElementById('mCmsSecao').value,
        titulo: document.getElementById('mCmsTitulo').value,
        conteudo: document.getElementById('mCmsConteudo').value,
        imagem_url: document.getElementById('mCmsImg').value,
    };
    try {
        if (id) await AdminAPI.put(`/conteudos/${id}`, body);
        else await AdminAPI.post('/conteudos', body);
        closeModal(); showToast('Conteúdo salvo!', 'success'); loadConteudos();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// MINISTROS
// ================================================================
let ministrosPage = 1;
let ministrosTimer;

function debounceMinistros() {
    clearTimeout(ministrosTimer);
    ministrosTimer = setTimeout(() => loadAdminMinistros(), 400);
}

async function loadAdminMinistros(page) {
    try {
        if (page) ministrosPage = page;
        const search = document.getElementById('ministrosSearch')?.value || '';
        const data = await AdminAPI.get(`/ministros?page=${ministrosPage}&search=${encodeURIComponent(search)}`);
        renderMinistrosTable(data);
    } catch (err) { showToast('Erro ao carregar ministros', 'error'); }
}

function renderMinistrosTable(data) {
    const el = document.getElementById('ministrosTable');
    if (data.ministros.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum ministro encontrado</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Nome</th><th>CPF</th><th>Cargo</th><th>Registro</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        ${data.ministros.map(m => `<tr>
            <td>${m.nome}</td>
            <td>${m.cpf}</td>
            <td>${m.cargo || '-'}</td>
            <td>${m.registro || '-'}</td>
            <td><span class="badge ${m.status === 'ATIVO' ? 'badge-ativo' : 'badge-inativo'}">${m.status}</span></td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="toggleMinistroStatus(${m.id}, '${m.status}')" title="${m.status === 'ATIVO' ? 'Desativar' : 'Ativar'}">
                    <i class="fas ${m.status === 'ATIVO' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;

    // Pagination
    const pagEl = document.getElementById('ministrosPagination');
    if (data.pages > 1) {
        pagEl.innerHTML = Array.from({ length: data.pages }, (_, i) => i + 1)
            .map(p => `<button class="${p === data.page ? 'active' : ''}" onclick="loadAdminMinistros(${p})">${p}</button>`)
            .join('');
    } else { pagEl.innerHTML = ''; }
}

async function toggleMinistroStatus(id, currentStatus) {
    const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    if (!confirm(`${newStatus === 'INATIVO' ? 'Desativar' : 'Ativar'} este ministro?`)) return;
    try {
        await AdminAPI.put(`/ministros/${id}/status`, { status: newStatus });
        showToast('Status alterado!', 'success');
        loadAdminMinistros();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// DIRETORIA
// ================================================================
async function loadAdminDiretoria() {
    try {
        allDiretoria = await AdminAPI.get('/diretoria');
        renderDiretoriaTable();
    } catch (err) { showToast('Erro ao carregar diretoria', 'error'); }
}

function renderDiretoriaTable() {
    const el = document.getElementById('diretoriaTable');
    if (allDiretoria.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum membro cadastrado</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Nome</th><th>Cargo</th><th>Grupo</th><th>Email</th><th>Ações</th></tr></thead><tbody>
        ${allDiretoria.map(d => `<tr>
            <td>${d.nome}</td>
            <td>${d.cargo}</td>
            <td><span class="badge ${d.tipo === 'conselho_fiscal' ? 'badge-aberto' : 'badge-ativo'}">${d.tipo === 'conselho_fiscal' ? 'Conselho Fiscal' : 'Diretoria'}</span></td>
            <td>${d.email || '-'}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openDiretoriaModal(${d.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('diretoria', ${d.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openDiretoriaModal(id) {
    const item = id ? allDiretoria.find(d => d.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Membro' : 'Novo Membro';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Nome</label><input type="text" id="mDirNome" value="${item?.nome || ''}"></div>
            <div class="admin-form-group"><label>Cargo</label><input type="text" id="mDirCargo" value="${item?.cargo || ''}"></div>
            <div class="admin-form-group"><label>Grupo</label>
                <select id="mDirTipo">
                    <option value="diretoria" ${(!item || item?.tipo === 'diretoria') ? 'selected' : ''}>Diretoria</option>
                    <option value="conselho_fiscal" ${item?.tipo === 'conselho_fiscal' ? 'selected' : ''}>Conselho Fiscal</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Email</label><input type="email" id="mDirEmail" value="${item?.email || ''}"></div>
            <div class="admin-form-group"><label>Ordem</label><input type="number" id="mDirOrdem" value="${item?.ordem || 0}"></div>
        </div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mDirDesc">${item?.descricao || ''}</textarea></div>
        <div class="admin-form-group"><label>Foto URL</label><input type="text" id="mDirFoto" value="${item?.foto_url || ''}"></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveDiretoria(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveDiretoria(id) {
    const body = {
        nome: document.getElementById('mDirNome').value,
        cargo: document.getElementById('mDirCargo').value,
        tipo: document.getElementById('mDirTipo').value,
        email: document.getElementById('mDirEmail').value,
        ordem: parseInt(document.getElementById('mDirOrdem').value) || 0,
        descricao: document.getElementById('mDirDesc').value,
        foto_url: document.getElementById('mDirFoto').value,
        ativo: true
    };
    try {
        if (id) await AdminAPI.put(`/diretoria/${id}`, body);
        else await AdminAPI.post('/diretoria', body);
        closeModal(); showToast('Membro salvo!', 'success'); loadAdminDiretoria();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// CONTATOS
// ================================================================
async function loadAdminContatos() {
    try {
        allContatos = await AdminAPI.get('/contatos');
        renderContatosTable();
    } catch (err) { showToast('Erro ao carregar contatos', 'error'); }
}

function renderContatosTable() {
    const el = document.getElementById('contatosTable');
    if (allContatos.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum contato recebido</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Nome</th><th>Email</th><th>Assunto</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        ${allContatos.map(c => `<tr>
            <td>${c.nome}</td>
            <td>${c.email}</td>
            <td>${c.assunto || '-'}</td>
            <td>${formatDate(c.created_at)}</td>
            <td><span class="badge ${c.lida ? 'badge-ativo' : 'badge-aberto'}">${c.lida ? 'Lida' : 'Nova'}</span></td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-view" onclick="viewContato(${c.id})"><i class="fas fa-eye"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('contatos', ${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

async function viewContato(id) {
    const c = allContatos.find(x => x.id === id);
    if (!c) return;
    document.getElementById('modalTitle').textContent = `Contato — ${c.nome}`;
    document.getElementById('modalBody').innerHTML = `
        <p><strong>Nome:</strong> ${c.nome}</p>
        <p><strong>Email:</strong> ${c.email}</p>
        <p><strong>Telefone:</strong> ${c.telefone || '-'}</p>
        <p><strong>Assunto:</strong> ${c.assunto || '-'}</p>
        <p><strong>Data:</strong> ${formatDate(c.created_at)}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #eee;">
        <p>${c.mensagem}</p>
    `;
    document.getElementById('modalFooter').innerHTML = `<button class="btn-admin-secondary" onclick="closeModal()">Fechar</button>`;
    openModal();
    if (!c.lida) {
        await AdminAPI.put(`/contatos/${id}/lida`);
        c.lida = true;
        renderContatosTable();
    }
}

// ================================================================
// CONFIGURAÇÕES
// ================================================================
async function loadConfiguracoes() {
    try {
        const configs = await AdminAPI.get('/configuracoes');
        const el = document.getElementById('configForm');
        el.innerHTML = configs.map(c => `
            <div class="admin-form-group">
                <label>${c.descricao || c.chave} <span style="font-size:0.65rem;color:#bbb;">(${c.chave})</span></label>
                <input type="text" class="config-input" data-chave="${c.chave}" value="${c.valor || ''}">
            </div>
        `).join('');
    } catch (err) { showToast('Erro ao carregar configurações', 'error'); }
}

async function saveConfiguracoes() {
    const inputs = document.querySelectorAll('.config-input');
    const configs = Array.from(inputs).map(i => ({ chave: i.dataset.chave, valor: i.value }));
    try {
        await AdminAPI.put('/configuracoes', { configs });
        showToast('Configurações salvas!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// REDES SOCIAIS
// ================================================================
async function loadRedes() {
    try {
        allRedes = await AdminAPI.get('/redes-sociais');
        renderRedesTable();
    } catch (err) { showToast('Erro ao carregar redes sociais', 'error'); }
}

function renderRedesTable() {
    const el = document.getElementById('redesTable');
    if (allRedes.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhuma rede social cadastrada</p>'; return; }
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Nome</th><th>URL</th><th>Ícone</th><th>Ações</th></tr></thead><tbody>
        ${allRedes.map(r => `<tr>
            <td><i class="${r.icone}" style="margin-right:6px;"></i>${r.nome}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;"><a href="${r.url}" target="_blank">${r.url}</a></td>
            <td><code>${r.icone}</code></td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openRedeModal(${r.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('redes-sociais', ${r.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openRedeModal(id) {
    const item = id ? allRedes.find(r => r.id === id) : null;
    document.getElementById('modalTitle').textContent = item ? 'Editar Rede Social' : 'Nova Rede Social';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Nome</label><input type="text" id="mRedeNome" value="${item?.nome || ''}" placeholder="Ex: Facebook"></div>
            <div class="admin-form-group"><label>Ícone (Font Awesome)</label><input type="text" id="mRedeIcone" value="${item?.icone || ''}" placeholder="Ex: fab fa-facebook-f"></div>
        </div>
        <div class="admin-form-group"><label>URL</label><input type="url" id="mRedeUrl" value="${item?.url || ''}"></div>
        <div class="admin-form-group"><label>Ordem</label><input type="number" id="mRedeOrdem" value="${item?.ordem || 0}"></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveRede(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveRede(id) {
    const body = {
        nome: document.getElementById('mRedeNome').value,
        icone: document.getElementById('mRedeIcone').value,
        url: document.getElementById('mRedeUrl').value,
        ordem: parseInt(document.getElementById('mRedeOrdem').value) || 0,
        ativa: true
    };
    try {
        if (id) await AdminAPI.put(`/redes-sociais/${id}`, body);
        else await AdminAPI.post('/redes-sociais', body);
        closeModal(); showToast('Rede social salva!', 'success'); loadRedes();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// MÍDIAS
// ================================================================
async function loadMidias() {
    try {
        allMidias = await AdminAPI.get('/midias');
        renderMidiasGrid();
    } catch (err) { showToast('Erro ao carregar mídias', 'error'); }
}

function renderMidiasGrid() {
    const el = document.getElementById('midiasGrid');
    if (allMidias.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;grid-column:1/-1;">Nenhuma mídia enviada</p>'; return; }
    el.innerHTML = allMidias.map(m => `
        <div class="midia-item">
            <div class="midia-thumb">${m.tipo === 'imagem'
                ? `<img src="${m.url}" alt="${m.titulo}" loading="lazy">`
                : `<i class="fas fa-file-alt"></i>`}</div>
            <div class="midia-info">
                <h5>${m.titulo}</h5>
                <p>${(m.tamanho / 1024).toFixed(1)} KB</p>
            </div>
            <div class="midia-actions">
                <button class="btn-table-action btn-table-view" onclick="copyToClipboard('${m.url}')" title="Copiar URL"><i class="fas fa-copy"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteMidia(${m.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function openUploadModal() {
    document.getElementById('modalTitle').textContent = 'Upload de Mídia';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título</label><input type="text" id="mMidiaTitulo" placeholder="Nome do arquivo"></div>
        <div class="admin-form-group"><label>Arquivo</label><input type="file" id="mMidiaArquivo" accept="image/*,.pdf,.doc,.docx"></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="uploadMidia()"><i class="fas fa-cloud-upload-alt"></i> Enviar</button>
    `;
    openModal();
}

async function uploadMidia() {
    const file = document.getElementById('mMidiaArquivo').files[0];
    if (!file) { showToast('Selecione um arquivo', 'error'); return; }
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('titulo', document.getElementById('mMidiaTitulo').value || file.name);
    try {
        const res = await fetch('/api/admin/midias/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AdminAPI.token()}` },
            body: formData
        });
        if (!res.ok) throw new Error('Erro no upload');
        closeModal(); showToast('Mídia enviada!', 'success'); loadMidias();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteMidia(id) {
    if (!confirm('Excluir esta mídia?')) return;
    try {
        await AdminAPI.del(`/midias/${id}`);
        showToast('Mídia excluída', 'success'); loadMidias();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// NOTIFICAÇÕES SITE
// ================================================================
async function loadNotifSite() {
    try {
        allNotifSite = await AdminAPI.get('/notificacoes-site');
        renderNotifSiteTable();
    } catch (err) { showToast('Erro ao carregar notificações', 'error'); }
}

function renderNotifSiteTable() {
    const el = document.getElementById('notifSiteTable');
    if (allNotifSite.length === 0) { el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhuma notificação cadastrada</p>'; return; }
    const tipoLabels = { info:'ℹ️ Info', success:'✅ Sucesso', warning:'⚠️ Aviso', error:'🔴 Urgente', evento:'📅 Evento', curso:'🎓 Curso', destaque:'⭐ Destaque' };
    const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Mensagem</th><th>Tipo</th><th>Início</th><th>Fim</th><th>Ativa</th><th>Ações</th></tr></thead><tbody>
        ${allNotifSite.map(n => `<tr>
            <td><strong>${n.titulo}</strong></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n.mensagem || ''}</td>
            <td><span class="badge badge-ativo">${tipoLabels[n.tipo] || n.tipo}</span></td>
            <td style="font-size:0.8rem;">${fmtDt(n.data_inicio)}</td>
            <td style="font-size:0.8rem;">${fmtDt(n.data_fim)}</td>
            <td>${n.ativa ? '<span class="badge badge-ativo">Sim</span>' : '<span class="badge badge-inativo">Não</span>'}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openNotifSiteModal(${n.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('notificacoes-site', ${n.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function openNotifSiteModal(id) {
    const item = id ? allNotifSite.find(n => n.id === id) : null;
    const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
    document.getElementById('modalTitle').textContent = item ? 'Editar Notificação do Site' : 'Nova Notificação do Site';
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título *</label><input type="text" id="mNotifTitle" value="${item?.titulo || ''}" placeholder="Ex: 15ª Convenção Nacional"></div>
        <div class="admin-form-group"><label>Mensagem</label><textarea id="mNotifMsg" placeholder="Ex: Inscrições abertas até 30 de agosto!">${item?.mensagem || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Tipo / Cor</label>
                <select id="mNotifTipo">
                    <option value="info" ${item?.tipo === 'info' ? 'selected' : ''}>ℹ️ Informação (Azul)</option>
                    <option value="success" ${item?.tipo === 'success' ? 'selected' : ''}>✅ Sucesso (Verde)</option>
                    <option value="warning" ${item?.tipo === 'warning' ? 'selected' : ''}>⚠️ Aviso (Amarelo)</option>
                    <option value="error" ${item?.tipo === 'error' ? 'selected' : ''}>🔴 Urgente (Vermelho)</option>
                    <option value="evento" ${item?.tipo === 'evento' ? 'selected' : ''}>📅 Evento (Roxo)</option>
                    <option value="curso" ${item?.tipo === 'curso' ? 'selected' : ''}>🎓 Curso (Ciano)</option>
                    <option value="destaque" ${item?.tipo === 'destaque' ? 'selected' : ''}>⭐ Destaque (Dourado)</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Link (URL ou âncora)</label><input type="text" id="mNotifLink" value="${item?.link || ''}" placeholder="Ex: #eventos ou /noticias.html"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Data Início</label><input type="datetime-local" id="mNotifInicio" value="${fmtDate(item?.data_inicio)}"><small style="color:#999;">Quando a notificação começa a aparecer</small></div>
            <div class="admin-form-group"><label>Data Fim (opcional)</label><input type="datetime-local" id="mNotifFim" value="${fmtDate(item?.data_fim)}"><small style="color:#999;">Quando deixa de aparecer (vazio = sempre)</small></div>
        </div>
        <div class="admin-form-group" style="margin-top:8px;"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="mNotifAtiva" ${item?.ativa !== false ? 'checked' : ''} style="width:18px;height:18px;"> Ativa (visível no site)</label></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveNotifSite(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveNotifSite(id) {
    const titulo = document.getElementById('mNotifTitle').value.trim();
    if (!titulo) { showToast('Título é obrigatório', 'error'); return; }
    const body = {
        titulo,
        mensagem: document.getElementById('mNotifMsg').value,
        tipo: document.getElementById('mNotifTipo').value,
        link: document.getElementById('mNotifLink').value,
        ativa: document.getElementById('mNotifAtiva').checked,
        data_inicio: document.getElementById('mNotifInicio').value || null,
        data_fim: document.getElementById('mNotifFim').value || null,
    };
    try {
        if (id) await AdminAPI.put(`/notificacoes-site/${id}`, body);
        else await AdminAPI.post('/notificacoes-site', body);
        closeModal(); showToast('Notificação salva!', 'success'); loadNotifSite();
    } catch (err) { showToast(err.message, 'error'); }
}

// ================================================================
// GENERIC HELPERS
// ================================================================
async function deleteItem(resource, id) {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
        await AdminAPI.del(`/${resource}/${id}`);
        showToast('Item excluído!', 'success');
        // Reload current section
        navigateTo(currentSection);
    } catch (err) { showToast(err.message, 'error'); }
}

function openModal() { document.getElementById('adminModal').style.display = 'flex'; }
function closeModal() { document.getElementById('adminModal').style.display = 'none'; }

function showToast(msg, type = 'info') {
    const toast = document.getElementById('adminToast');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(window.location.origin + text).then(() => {
        showToast('URL copiada!', 'success');
    });
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.id === 'adminModal') closeModal();
});

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
