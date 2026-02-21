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
                { id: 1, nome: 'Pr. João Carlos da Silva', cpf: '123.456.789-00', cargo: 'PASTOR', registro: 'CIEIB-2020-001', status: 'ATIVO', email: 'joao@igreja.com', telefone: '(11) 99999-0001', anuidade_status: 'paga', credencial_status: 'ativa', foto_url: '', cidade: 'São Paulo', uf: 'SP', nome_igreja: 'Igreja Evangélica Betel' },
                { id: 2, nome: 'Pra. Maria Aparecida Souza', cpf: '234.567.890-11', cargo: 'MISSIONÁRIO', registro: 'CIEIB-2019-015', status: 'ATIVO', email: 'maria@igreja.com', telefone: '(21) 98888-0002', anuidade_status: 'paga', credencial_status: 'ativa', foto_url: '', cidade: 'Rio de Janeiro', uf: 'RJ', nome_igreja: 'Igreja Evangélica Shalom' },
                { id: 3, nome: 'Ev. Pedro Henrique Lima', cpf: '345.678.901-22', cargo: 'EVANGELISTA', registro: 'CIEIB-2021-032', status: 'ATIVO', email: 'pedro@email.com', telefone: '(31) 97777-0003', anuidade_status: 'pendente', credencial_status: 'pendente', foto_url: '', cidade: 'Belo Horizonte', uf: 'MG', nome_igreja: '' },
                { id: 4, nome: 'Dc. Ana Paula Santos', cpf: '456.789.012-33', cargo: 'DIÁCONO', registro: 'CIEIB-2023-048', status: 'PENDENTE', email: 'ana@email.com', telefone: '', anuidade_status: 'pendente', credencial_status: 'pendente', foto_url: '', cidade: '', uf: '', nome_igreja: 'Igreja Restauração' },
                { id: 5, nome: 'Pb. Roberto Oliveira', cpf: '567.890.123-44', cargo: 'PRESBÍTERO', registro: 'CIEIB-2022-027', status: 'ATIVO', email: 'roberto@email.com', telefone: '(41) 96666-0005', anuidade_status: 'vencida', credencial_status: 'vencida', foto_url: '', cidade: 'Curitiba', uf: 'PR', nome_igreja: 'Igreja Evangélica Central' }
            ],
            total: 5, page: 1, pages: 1
        },
        '/relatorios/stats-membros': {
            total: 128, ativos: 95, inativos: 18, pendentes: 15,
            anuidade_paga: 72, anuidade_pendente: 56,
            credencial_ativa: 65, credencial_pendente: 63,
            por_cargo: [
                { cargo: 'PASTOR', total: 48 },
                { cargo: 'EVANGELISTA', total: 25 },
                { cargo: 'MISSIONÁRIO', total: 20 },
                { cargo: 'PRESBÍTERO', total: 18 },
                { cargo: 'DIÁCONO', total: 12 },
                { cargo: 'COOPERADOR', total: 5 }
            ]
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

        // Handle /ministros/:id detail
        if (/^\/ministros\/\d+$/.test(base)) {
            const id = parseInt(base.split('/')[2]);
            const mockMin = (this._mockData['/ministros']?.ministros || []).find(m => m.id === id);
            return {
                ...(mockMin || { id, nome: 'Membro Mock', cpf: '000.000.000-00', cargo: 'PASTOR', status: 'ATIVO' }),
                nome_social: '', rg: '12.345.678-9', orgao_expedidor: 'SSP/SP', sexo: 'M',
                data_nascimento: '1980-05-15', estado_civil: 'Casado(a)', nome_conjuge: 'Esposa Mock',
                escolaridade: 'Superior Completo', funcao_ministerial: 'Pastor Titular',
                tempo_ministerio: '15 anos', data_consagracao: '2010-03-20', data_registro: '2020-01-15',
                whatsapp: '(11) 99999-0001',
                endereco: { cep: '01001-000', endereco: 'Rua Exemplo', numero: '100', complemento: 'Apto 12', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP' },
                filhos: [{ nome: 'Filho 1', data_nascimento: '2005-08-10' }, { nome: 'Filho 2', data_nascimento: '2010-12-25' }],
                documentos: null, convencoes: [],
                boletos: [
                    { id: 1, tipo: 'anuidade', referencia: '2025', ano: 2025, valor: 350.00, data_vencimento: '2025-03-31', status: 'pago', data_pagamento: '2025-03-15', valor_pago: 350.00, arquivo_boleto_url: '' },
                    { id: 2, tipo: 'anuidade', referencia: '2024', ano: 2024, valor: 300.00, data_vencimento: '2024-03-31', status: 'pago', data_pagamento: '2024-02-28', valor_pago: 300.00, arquivo_boleto_url: '' },
                ],
                credenciais: [
                    { id: 1, numero_credencial: 'CIEIB-2025-0001', tipo: 'ministro', data_emissao: '2025-01-15', data_validade: '2025-12-31', status: 'ativa', arquivo_frente_url: '', arquivo_verso_url: '', arquivo_pdf_url: '' }
                ],
                historico: [
                    { acao: 'CADASTRO', descricao: 'Membro cadastrado no sistema', admin_nome: 'Sistema', created_at: '2020-01-15' },
                    { acao: 'CREDENCIAL EMITIDA', descricao: 'Credencial CIEIB-2025-0001 emitida', admin_nome: 'Administrador', created_at: '2025-01-15' },
                ],
                contas: [], observacoes_admin: ''
            };
        }

        // Handle /ministros/:id/boletos and /ministros/:id/credenciais
        if (/^\/ministros\/\d+\/boletos$/.test(base)) return [];
        if (/^\/ministros\/\d+\/credenciais$/.test(base)) return [];

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

// ================================================================
// UPLOAD DE IMAGEM — Componente reutilizável
// ================================================================
function adminUploadField(inputId, label, currentUrl) {
    const hasImage = currentUrl && currentUrl.trim();
    return `
        <div class="admin-form-group admin-upload-group">
            <label><i class="fas fa-image"></i> ${label}</label>
            <input type="hidden" id="${inputId}" value="${currentUrl || ''}">
            <div class="admin-upload-box" id="${inputId}_box">
                <div class="admin-upload-preview" id="${inputId}_preview" style="${hasImage ? '' : 'display:none;'}">
                    <img id="${inputId}_img" src="${hasImage ? currentUrl : ''}" alt="Preview">
                    <button type="button" class="admin-upload-remove" onclick="adminRemoveImage('${inputId}')" title="Remover"><i class="fas fa-times"></i></button>
                </div>
                <div class="admin-upload-area" id="${inputId}_area" style="${hasImage ? 'display:none;' : ''}">
                    <input type="file" id="${inputId}_file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="adminUploadFile('${inputId}')" style="display:none;">
                    <div class="admin-upload-placeholder" onclick="document.getElementById('${inputId}_file').click()">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Clique ou arraste uma imagem</span>
                        <small>JPG, PNG, WebP ou GIF (máx. 5MB)</small>
                    </div>
                </div>
                <div class="admin-upload-loading" id="${inputId}_loading" style="display:none;">
                    <i class="fas fa-spinner fa-spin"></i> Enviando...
                </div>
            </div>
        </div>
    `;
}

async function adminUploadFile(inputId) {
    const fileInput = document.getElementById(`${inputId}_file`);
    const file = fileInput?.files[0];
    if (!file) return;

    // Validação local
    if (file.size > 5 * 1024 * 1024) {
        showToast('Arquivo muito grande. Máximo 5MB.', 'error');
        fileInput.value = '';
        return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        showToast('Formato não suportado. Use JPG, PNG, WebP ou GIF.', 'error');
        fileInput.value = '';
        return;
    }

    // Show loading
    document.getElementById(`${inputId}_area`).style.display = 'none';
    document.getElementById(`${inputId}_loading`).style.display = 'flex';

    try {
        const formData = new FormData();
        formData.append('imagem', file);

        const res = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AdminAPI.token()}` },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro no upload');
        }

        const data = await res.json();

        // Set hidden input value
        document.getElementById(inputId).value = data.url;

        // Show preview
        const img = document.getElementById(`${inputId}_img`);
        img.src = data.url;
        document.getElementById(`${inputId}_preview`).style.display = 'flex';
        document.getElementById(`${inputId}_loading`).style.display = 'none';

        showToast('Imagem enviada com sucesso!', 'success');
    } catch (err) {
        console.error('Upload error:', err);
        showToast(err.message || 'Erro ao enviar imagem', 'error');
        document.getElementById(`${inputId}_area`).style.display = 'flex';
        document.getElementById(`${inputId}_loading`).style.display = 'none';
    }

    fileInput.value = '';
}

function adminRemoveImage(inputId) {
    document.getElementById(inputId).value = '';
    document.getElementById(`${inputId}_img`).src = '';
    document.getElementById(`${inputId}_preview`).style.display = 'none';
    document.getElementById(`${inputId}_area`).style.display = 'flex';
}

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
            ${adminUploadField('mNoticiaImg', 'Imagem', item?.imagem_url)}
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
            ${adminUploadField('mCursoImg', 'Imagem', item?.imagem_url)}
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
        ${adminUploadField('mCmsImg', 'Imagem', item?.imagem_url)}
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
// GESTÃO DE MEMBROS — Sistema Completo
// ================================================================
let ministrosPage = 1;
let ministrosTimer;
let currentMembro = null; // objeto completo do membro selecionado

function debounceMinistros() {
    clearTimeout(ministrosTimer);
    ministrosTimer = setTimeout(() => loadAdminMinistros(), 400);
}

function limparFiltrosMembros() {
    document.getElementById('ministrosSearch').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroAnuidade').value = '';
    document.getElementById('filtroCredencial').value = '';
    loadAdminMinistros(1);
}

async function loadAdminMinistros(page) {
    try {
        if (page) ministrosPage = page;
        const search = document.getElementById('ministrosSearch')?.value || '';
        const status = document.getElementById('filtroStatus')?.value || '';
        const anuidade = document.getElementById('filtroAnuidade')?.value || '';
        const credencial = document.getElementById('filtroCredencial')?.value || '';

        let qs = `?page=${ministrosPage}`;
        if (search) qs += `&search=${encodeURIComponent(search)}`;
        if (status) qs += `&status=${status}`;
        if (anuidade) qs += `&anuidade=${anuidade}`;
        if (credencial) qs += `&credencial=${credencial}`;

        const data = await AdminAPI.get(`/ministros${qs}`);
        renderMinistrosTable(data);
        loadMembrosStats();
    } catch (err) { showToast('Erro ao carregar membros', 'error'); }
}

async function loadMembrosStats() {
    try {
        const s = await AdminAPI.get('/relatorios/stats-membros');
        document.getElementById('membrosStats').innerHTML = `
            <div class="mstat-card"><div class="mstat-icon blue"><i class="fas fa-users"></i></div><div class="mstat-info"><h4>${s.total}</h4><p>Total</p></div></div>
            <div class="mstat-card"><div class="mstat-icon green"><i class="fas fa-user-check"></i></div><div class="mstat-info"><h4>${s.ativos}</h4><p>Ativos</p></div></div>
            <div class="mstat-card"><div class="mstat-icon red"><i class="fas fa-user-slash"></i></div><div class="mstat-info"><h4>${s.inativos}</h4><p>Inativos</p></div></div>
            <div class="mstat-card"><div class="mstat-icon orange"><i class="fas fa-user-clock"></i></div><div class="mstat-info"><h4>${s.pendentes}</h4><p>Pendentes</p></div></div>
            <div class="mstat-card"><div class="mstat-icon teal"><i class="fas fa-receipt"></i></div><div class="mstat-info"><h4>${s.anuidade_paga}</h4><p>Anuidade OK</p></div></div>
            <div class="mstat-card"><div class="mstat-icon gold"><i class="fas fa-exclamation-triangle"></i></div><div class="mstat-info"><h4>${s.anuidade_pendente}</h4><p>Anuid. Pendente</p></div></div>
            <div class="mstat-card"><div class="mstat-icon purple"><i class="fas fa-id-badge"></i></div><div class="mstat-info"><h4>${s.credencial_ativa}</h4><p>Credencial OK</p></div></div>
        `;
    } catch (err) {
        // Stats are optional, don't block
        document.getElementById('membrosStats').innerHTML = '';
    }
}

function renderMinistrosTable(data) {
    const el = document.getElementById('ministrosTable');
    if (!data.ministros || data.ministros.length === 0) {
        el.innerHTML = '<p style="text-align:center;color:#aaa;padding:40px;">Nenhum membro encontrado</p>';
        return;
    }

    const getInitials = (nome) => {
        const parts = (nome || '').split(' ');
        return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'M')[0];
    };

    const statusBadge = (s) => {
        const map = { ATIVO: 'badge-ativo', INATIVO: 'badge-inativo', PENDENTE: 'badge-pendente' };
        return `<span class="badge ${map[s] || 'badge-inativo'}">${s || 'N/A'}</span>`;
    };

    const anuidadeBadge = (s) => {
        const map = { paga: 'badge-paga', pendente: 'badge-pendente', vencida: 'badge-vencida' };
        return `<span class="badge ${map[s] || 'badge-pendente'}">${(s || 'pendente').charAt(0).toUpperCase() + (s || 'pendente').slice(1)}</span>`;
    };

    const credBadge = (s) => {
        const map = { ativa: 'badge-ativa', pendente: 'badge-pendente', vencida: 'badge-vencida' };
        return `<span class="badge ${map[s] || 'badge-pendente'}">${(s || 'pendente').charAt(0).toUpperCase() + (s || 'pendente').slice(1)}</span>`;
    };

    el.innerHTML = `<table class="admin-table"><thead><tr>
        <th style="width:48px;"></th><th>Nome</th><th>CPF</th><th>Cargo</th><th>Cidade/UF</th>
        <th>Status</th><th>Anuidade</th><th>Credencial</th><th>Ações</th>
    </tr></thead><tbody>
        ${data.ministros.map(m => `<tr class="membro-row" onclick="openMembroDetail(${m.id})" style="cursor:pointer;">
            <td>
                <div class="membros-avatar" style="width:34px;height:34px;font-size:0.72rem;">
                    ${m.foto_url ? `<img src="${m.foto_url}" alt="">` : getInitials(m.nome)}
                </div>
            </td>
            <td><strong style="font-size:0.82rem;">${m.nome}</strong><br><span style="font-size:0.68rem;color:#999;">${m.registro || 'Sem registro'}</span></td>
            <td style="font-size:0.8rem;">${m.cpf || '-'}</td>
            <td style="font-size:0.8rem;">${m.cargo || '-'}</td>
            <td style="font-size:0.8rem;">${m.cidade && m.uf ? `${m.cidade}/${m.uf}` : '-'}</td>
            <td>${statusBadge(m.status)}</td>
            <td>${anuidadeBadge(m.anuidade_status)}</td>
            <td>${credBadge(m.credencial_status)}</td>
            <td class="actions-cell" onclick="event.stopPropagation()">
                <button class="btn-table-action btn-table-view" onclick="openMembroDetail(${m.id})" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                <button class="btn-table-action btn-table-edit" onclick="toggleMinistroStatus(${m.id}, '${m.status}')" title="${m.status === 'ATIVO' ? 'Desativar' : 'Ativar'}">
                    <i class="fas ${m.status === 'ATIVO' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
                <button class="btn-table-action btn-table-delete" onclick="deleteMinistro(${m.id})" title="Excluir"><i class="fas fa-trash"></i></button>
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
    if (!confirm(`${newStatus === 'INATIVO' ? 'Desativar' : 'Ativar'} este membro?`)) return;
    try {
        await AdminAPI.put(`/ministros/${id}/status`, { status: newStatus });
        showToast('Status alterado!', 'success');
        loadAdminMinistros();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteMinistro(id) {
    if (!confirm('ATENÇÃO: Excluir este membro permanentemente? Todos os dados relacionados serão removidos.')) return;
    try {
        await AdminAPI.del(`/ministros/${id}`);
        showToast('Membro excluído', 'success');
        loadAdminMinistros();
    } catch (err) { showToast(err.message, 'error'); }
}

// ---- Relatório CSV ----
async function exportarRelatorio(formato) {
    try {
        const status = document.getElementById('filtroStatus')?.value || '';
        const anuidade = document.getElementById('filtroAnuidade')?.value || '';
        const credencial = document.getElementById('filtroCredencial')?.value || '';

        let qs = `?formato=${formato}`;
        if (status) qs += `&status=${status}`;
        if (anuidade) qs += `&anuidade=${anuidade}`;
        if (credencial) qs += `&credencial=${credencial}`;

        const response = await fetch(`/api/admin/relatorios/membros${qs}`, {
            headers: { 'Authorization': `Bearer ${AdminAPI.token()}` }
        });

        if (!response.ok) throw new Error('Erro ao gerar relatório');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_membros_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Relatório baixado com sucesso!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ================================================================
// DETALHE DO MEMBRO — Painel lateral
// ================================================================
async function openMembroDetail(id) {
    try {
        currentMembro = await AdminAPI.get(`/ministros/${id}`);
        const m = currentMembro;

        // Profile area
        const getInitials = (nome) => {
            const parts = (nome || '').split(' ');
            return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'M')[0];
        };

        document.getElementById('mdpProfileArea').innerHTML = `
            <div class="mdp-profile">
                <div class="mdp-profile-avatar">
                    ${m.foto_url ? `<img src="${m.foto_url}" alt="">` : getInitials(m.nome)}
                </div>
                <div class="mdp-profile-info">
                    <h4>${m.nome}</h4>
                    <p>${m.cargo || 'Sem cargo'} — ${m.nome_igreja || 'Sem igreja'}</p>
                    <p>CPF: ${m.cpf} ${m.registro ? `| Registro: ${m.registro}` : ''}</p>
                    <div class="mdp-profile-badges">
                        <span class="badge ${m.status === 'ATIVO' ? 'badge-ativo' : m.status === 'PENDENTE' ? 'badge-pendente' : 'badge-inativo'}">${m.status}</span>
                        <span class="badge ${m.anuidade_status === 'paga' ? 'badge-paga' : 'badge-pendente'}">Anuid. ${(m.anuidade_status || 'pendente')}</span>
                        <span class="badge ${m.credencial_status === 'ativa' ? 'badge-ativa' : 'badge-pendente'}">Cred. ${(m.credencial_status || 'pendente')}</span>
                    </div>
                </div>
            </div>
        `;

        // Render first tab
        switchMdpTab('dados');

        // Show panel
        document.getElementById('membroDetailOverlay').classList.add('active');
    } catch (err) {
        showToast('Erro ao carregar detalhes do membro', 'error');
    }
}

function closeMembroDetail() {
    document.getElementById('membroDetailOverlay').classList.remove('active');
    currentMembro = null;
}

function switchMdpTab(tab) {
    document.querySelectorAll('.mdp-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.mdp-tab[data-tab="${tab}"]`)?.classList.add('active');

    const content = document.getElementById('mdpContent');
    const m = currentMembro;
    if (!m) return;

    const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    if (tab === 'dados') {
        content.innerHTML = `
            <div class="mdp-section-title"><i class="fas fa-user"></i> Informações Pessoais</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Nome Completo</label><span>${m.nome || '—'}</span></div>
                <div class="mdp-info-item"><label>Nome Social</label><span>${m.nome_social || '—'}</span></div>
                <div class="mdp-info-item"><label>CPF</label><span>${m.cpf || '—'}</span></div>
                <div class="mdp-info-item"><label>RG</label><span>${m.rg || '—'} ${m.orgao_expedidor ? `(${m.orgao_expedidor})` : ''}</span></div>
                <div class="mdp-info-item"><label>Sexo</label><span>${m.sexo === 'M' ? 'Masculino' : m.sexo === 'F' ? 'Feminino' : '—'}</span></div>
                <div class="mdp-info-item"><label>Data Nascimento</label><span>${fmtDate(m.data_nascimento)}</span></div>
                <div class="mdp-info-item"><label>Estado Civil</label><span>${m.estado_civil || '—'}</span></div>
                <div class="mdp-info-item"><label>Cônjuge</label><span>${m.nome_conjuge || '—'}</span></div>
                <div class="mdp-info-item"><label>Escolaridade</label><span>${m.escolaridade || '—'}</span></div>
            </div>

            <div class="mdp-section-title"><i class="fas fa-phone"></i> Contato</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Email</label><span>${m.email || '—'}</span></div>
                <div class="mdp-info-item"><label>Telefone</label><span>${m.telefone || '—'}</span></div>
                <div class="mdp-info-item"><label>WhatsApp</label><span>${m.whatsapp || '—'}</span></div>
            </div>

            <div class="mdp-section-title"><i class="fas fa-map-marker-alt"></i> Endereço</div>
            ${m.endereco ? `
                <div class="mdp-info-grid">
                    <div class="mdp-info-item"><label>CEP</label><span>${m.endereco.cep || '—'}</span></div>
                    <div class="mdp-info-item"><label>Logradouro</label><span>${m.endereco.endereco || '—'}, ${m.endereco.numero || 'S/N'}</span></div>
                    <div class="mdp-info-item"><label>Complemento</label><span>${m.endereco.complemento || '—'}</span></div>
                    <div class="mdp-info-item"><label>Bairro</label><span>${m.endereco.bairro || '—'}</span></div>
                    <div class="mdp-info-item"><label>Cidade/UF</label><span>${m.endereco.cidade || '—'}/${m.endereco.uf || '—'}</span></div>
                </div>
            ` : '<p style="color:#aaa;font-size:0.82rem;">Endereço não cadastrado</p>'}

            <div class="mdp-section-title"><i class="fas fa-church"></i> Dados Ministeriais</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Cargo</label><span>${m.cargo || '—'}</span></div>
                <div class="mdp-info-item"><label>Função Ministerial</label><span>${m.funcao_ministerial || '—'}</span></div>
                <div class="mdp-info-item"><label>Igreja</label><span>${m.nome_igreja || '—'}</span></div>
                <div class="mdp-info-item"><label>Tempo de Ministério</label><span>${m.tempo_ministerio || '—'}</span></div>
                <div class="mdp-info-item"><label>Data Consagração</label><span>${fmtDate(m.data_consagracao)}</span></div>
                <div class="mdp-info-item"><label>Registro</label><span>${m.registro || '—'}</span></div>
                <div class="mdp-info-item"><label>Data Registro</label><span>${fmtDate(m.data_registro)}</span></div>
                <div class="mdp-info-item"><label>Cadastrado em</label><span>${fmtDate(m.created_at)}</span></div>
            </div>

            ${m.filhos && m.filhos.length > 0 ? `
                <div class="mdp-section-title"><i class="fas fa-child"></i> Filhos (${m.filhos.length})</div>
                ${m.filhos.map(f => `
                    <div class="mdp-list-item">
                        <div class="mdp-list-item-info">
                            <h5>${f.nome}</h5>
                            <p>Nascimento: ${fmtDate(f.data_nascimento)}</p>
                        </div>
                    </div>
                `).join('')}
            ` : ''}

            ${m.observacoes_admin ? `
                <div class="mdp-section-title"><i class="fas fa-sticky-note"></i> Observações do Admin</div>
                <p style="font-size:0.82rem;color:#555;background:#f8f9fc;padding:12px;border-radius:8px;">${m.observacoes_admin}</p>
            ` : ''}
        `;
    }

    else if (tab === 'financeiro') {
        const boletos = m.boletos || [];
        const contas = m.contas || [];

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="mdp-section-title" style="margin-top:0;"><i class="fas fa-barcode"></i> Boletos / Anuidades</div>
                <button class="btn-admin-primary" style="font-size:0.78rem;padding:6px 14px;" onclick="openBoletoModal(${m.id})"><i class="fas fa-plus"></i> Novo Boleto</button>
            </div>

            ${boletos.length === 0 ? `
                <div class="mdp-empty"><i class="fas fa-receipt"></i><p>Nenhum boleto registrado</p></div>
            ` : boletos.map(b => `
                <div class="mdp-list-item">
                    <div class="mdp-list-item-info">
                        <h5>${b.tipo === 'anuidade' ? '📄 Anuidade' : '📄 Mensalidade'} — ${b.referencia || ''} ${b.ano || ''}</h5>
                        <p>Vencimento: ${fmtDate(b.data_vencimento)} | Valor: R$ ${parseFloat(b.valor || 0).toFixed(2)} | <span class="badge ${b.status === 'pago' ? 'badge-paga' : b.status === 'vencido' ? 'badge-vencida' : 'badge-pendente'}">${(b.status || 'pendente').toUpperCase()}</span></p>
                        ${b.data_pagamento ? `<p style="color:#0f9d58;font-size:0.7rem;">Pago em ${fmtDate(b.data_pagamento)} — R$ ${parseFloat(b.valor_pago || 0).toFixed(2)}</p>` : ''}
                    </div>
                    <div class="mdp-list-item-actions">
                        ${b.arquivo_boleto_url ? `<a href="${b.arquivo_boleto_url}" target="_blank" class="mdp-btn-view" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;width:30px;height:30px;border-radius:6px;" title="Ver boleto"><i class="fas fa-file-pdf"></i></a>` : ''}
                        <button class="mdp-btn-edit" onclick="openBoletoEditModal(${b.id})" title="Editar/Baixar"><i class="fas fa-edit"></i></button>
                        <button class="mdp-btn-del" onclick="deleteBoleto(${b.id})" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}

            ${contas.length > 0 ? `
                <div class="mdp-section-title"><i class="fas fa-wallet"></i> Contas a Receber</div>
                ${contas.map(c => `
                    <div class="mdp-list-item">
                        <div class="mdp-list-item-info">
                            <h5>${c.servico || 'Conta'} — Doc. ${c.nro_docto || 'N/A'}</h5>
                            <p>Venc: ${fmtDate(c.data_vencimento)} | Valor: R$ ${parseFloat(c.valor || 0).toFixed(2)} | Saldo: R$ ${parseFloat(c.saldo || 0).toFixed(2)}</p>
                        </div>
                        <span class="badge ${c.status === 'PAGO' ? 'badge-paga' : 'badge-pendente'}">${c.status || 'ABERTO'}</span>
                    </div>
                `).join('')}
            ` : ''}
        `;
    }

    else if (tab === 'credencial') {
        const creds = m.credenciais || [];

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="mdp-section-title" style="margin-top:0;"><i class="fas fa-id-badge"></i> Credenciais Digitais</div>
                <button class="btn-admin-primary" style="font-size:0.78rem;padding:6px 14px;" onclick="openCredencialModal(${m.id})"><i class="fas fa-plus"></i> Nova Credencial</button>
            </div>

            ${creds.length === 0 ? `
                <div class="mdp-empty"><i class="fas fa-id-badge"></i><p>Nenhuma credencial emitida</p></div>
            ` : creds.map(c => `
                <div class="mdp-list-item" style="flex-direction:column;align-items:flex-start;gap:10px;">
                    <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
                        <div class="mdp-list-item-info">
                            <h5><i class="fas fa-id-card" style="color:var(--admin-secondary);"></i> ${c.numero_credencial}</h5>
                            <p>Tipo: ${c.tipo || 'ministro'} | Emissão: ${fmtDate(c.data_emissao)} | Validade: ${fmtDate(c.data_validade)}</p>
                            <p>Status: <span class="badge ${c.status === 'ativa' ? 'badge-ativa' : c.status === 'vencida' ? 'badge-vencida' : 'badge-pendente'}">${(c.status || 'pendente').toUpperCase()}</span></p>
                        </div>
                        <div class="mdp-list-item-actions">
                            ${c.arquivo_pdf_url ? `<a href="${c.arquivo_pdf_url}" target="_blank" class="mdp-btn-view" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;width:30px;height:30px;border-radius:6px;" title="Download PDF"><i class="fas fa-file-pdf"></i></a>` : ''}
                            <button class="mdp-btn-edit" onclick="openCredencialEditModal(${c.id})" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="mdp-btn-del" onclick="deleteCredencial(${c.id})" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${c.arquivo_frente_url || c.arquivo_verso_url ? `
                        <div style="display:flex;gap:10px;flex-wrap:wrap;">
                            ${c.arquivo_frente_url ? `<div style="text-align:center;"><img src="${c.arquivo_frente_url}" style="max-width:200px;border-radius:8px;border:1px solid #eee;"><p style="font-size:0.7rem;color:#999;margin-top:4px;">Frente</p></div>` : ''}
                            ${c.arquivo_verso_url ? `<div style="text-align:center;"><img src="${c.arquivo_verso_url}" style="max-width:200px;border-radius:8px;border:1px solid #eee;"><p style="font-size:0.7rem;color:#999;margin-top:4px;">Verso</p></div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        `;
    }

    else if (tab === 'historico') {
        const hist = m.historico || [];

        content.innerHTML = `
            <div class="mdp-section-title" style="margin-top:0;"><i class="fas fa-history"></i> Histórico de Ações</div>
            ${hist.length === 0 ? `
                <div class="mdp-empty"><i class="fas fa-history"></i><p>Nenhum registro no histórico</p></div>
            ` : `
                <div class="mdp-timeline">
                    ${hist.map(h => `
                        <div class="mdp-timeline-item">
                            <h5>${h.acao}</h5>
                            <p>${h.descricao || ''}</p>
                            <small>${fmtDate(h.created_at)} ${h.admin_nome ? `— ${h.admin_nome}` : ''}</small>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    }
}

// ---- Editar Membro (modal) ----
function editMembroModal() {
    const m = currentMembro;
    if (!m) return;

    document.getElementById('modalTitle').textContent = `Editar — ${m.nome}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Nome</label><input type="text" id="mEditNome" value="${m.nome || ''}"></div>
            <div class="admin-form-group"><label>Cargo</label>
                <select id="mEditCargo">
                    ${['PASTOR','MISSIONÁRIO','EVANGELISTA','PRESBÍTERO','DIÁCONO','COOPERADOR','OBREIRO'].map(c => `<option value="${c}" ${m.cargo === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Email</label><input type="email" id="mEditEmail" value="${m.email || ''}"></div>
            <div class="admin-form-group"><label>Telefone</label><input type="text" id="mEditTel" value="${m.telefone || ''}"></div>
            <div class="admin-form-group"><label>WhatsApp</label><input type="text" id="mEditWpp" value="${m.whatsapp || ''}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Igreja</label><input type="text" id="mEditIgreja" value="${m.nome_igreja || ''}"></div>
            <div class="admin-form-group"><label>Função Ministerial</label><input type="text" id="mEditFuncao" value="${m.funcao_ministerial || ''}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Registro</label><input type="text" id="mEditRegistro" value="${m.registro || ''}"></div>
            <div class="admin-form-group"><label>Escolaridade</label><input type="text" id="mEditEscol" value="${m.escolaridade || ''}"></div>
            <div class="admin-form-group"><label>Tempo Ministério</label><input type="text" id="mEditTempoMin" value="${m.tempo_ministerio || ''}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Status</label>
                <select id="mEditStatus">
                    <option value="ATIVO" ${m.status === 'ATIVO' ? 'selected' : ''}>ATIVO</option>
                    <option value="INATIVO" ${m.status === 'INATIVO' ? 'selected' : ''}>INATIVO</option>
                    <option value="PENDENTE" ${m.status === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Anuidade</label>
                <select id="mEditAnuidade">
                    <option value="pendente" ${m.anuidade_status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="paga" ${m.anuidade_status === 'paga' ? 'selected' : ''}>Paga</option>
                    <option value="vencida" ${m.anuidade_status === 'vencida' ? 'selected' : ''}>Vencida</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Credencial</label>
                <select id="mEditCredencial">
                    <option value="pendente" ${m.credencial_status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="ativa" ${m.credencial_status === 'ativa' ? 'selected' : ''}>Ativa</option>
                    <option value="vencida" ${m.credencial_status === 'vencida' ? 'selected' : ''}>Vencida</option>
                </select>
            </div>
        </div>
        <div class="admin-form-group"><label>Observações do Admin</label><textarea id="mEditObs" style="min-height:80px;">${m.observacoes_admin || ''}</textarea></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveMembroEdit(${m.id})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveMembroEdit(id) {
    const body = {
        nome: document.getElementById('mEditNome').value,
        cargo: document.getElementById('mEditCargo').value,
        email: document.getElementById('mEditEmail').value,
        telefone: document.getElementById('mEditTel').value,
        whatsapp: document.getElementById('mEditWpp').value,
        nome_igreja: document.getElementById('mEditIgreja').value,
        funcao_ministerial: document.getElementById('mEditFuncao').value,
        registro: document.getElementById('mEditRegistro').value,
        escolaridade: document.getElementById('mEditEscol').value,
        tempo_ministerio: document.getElementById('mEditTempoMin').value,
        status: document.getElementById('mEditStatus').value,
        anuidade_status: document.getElementById('mEditAnuidade').value,
        credencial_status: document.getElementById('mEditCredencial').value,
        observacoes_admin: document.getElementById('mEditObs').value,
    };
    try {
        await AdminAPI.put(`/ministros/${id}`, body);
        closeModal();
        showToast('Membro atualizado!', 'success');
        openMembroDetail(id); // Refresh detail
        loadAdminMinistros(); // Refresh table
    } catch (err) { showToast(err.message, 'error'); }
}

// ---- Boleto Modal ----
function openBoletoModal(ministroId) {
    document.getElementById('modalTitle').textContent = 'Novo Boleto / Anuidade';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Tipo</label>
                <select id="mBoletoTipo">
                    <option value="anuidade">Anuidade</option>
                    <option value="mensalidade">Mensalidade</option>
                    <option value="taxa">Taxa</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Referência</label><input type="text" id="mBoletoRef" placeholder="Ex: 2025, Jan/2025"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Ano</label><input type="number" id="mBoletoAno" value="${new Date().getFullYear()}"></div>
            <div class="admin-form-group"><label>Mês (opcional)</label><input type="number" id="mBoletoMes" min="1" max="12" placeholder="1-12"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Valor (R$)</label><input type="number" id="mBoletoValor" step="0.01" placeholder="0.00"></div>
            <div class="admin-form-group"><label>Vencimento</label><input type="date" id="mBoletoVenc"></div>
        </div>
        <div class="admin-form-group"><label>Observação</label><textarea id="mBoletoObs"></textarea></div>
        ${adminUploadField('mBoletoArquivo', 'Arquivo do Boleto (PDF/Imagem)', '')}
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveBoleto(${ministroId})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveBoleto(ministroId) {
    const body = {
        tipo: document.getElementById('mBoletoTipo').value,
        referencia: document.getElementById('mBoletoRef').value,
        ano: parseInt(document.getElementById('mBoletoAno').value) || new Date().getFullYear(),
        mes: parseInt(document.getElementById('mBoletoMes').value) || null,
        valor: parseFloat(document.getElementById('mBoletoValor').value) || 0,
        data_vencimento: document.getElementById('mBoletoVenc').value || null,
        observacao: document.getElementById('mBoletoObs').value,
        arquivo_boleto_url: document.getElementById('mBoletoArquivo').value || null,
        status: 'pendente',
    };
    try {
        await AdminAPI.post(`/ministros/${ministroId}/boletos`, body);
        closeModal();
        showToast('Boleto registrado!', 'success');
        openMembroDetail(ministroId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function openBoletoEditModal(boletoId) {
    const m = currentMembro;
    const b = (m?.boletos || []).find(x => x.id === boletoId);
    if (!b) return;

    document.getElementById('modalTitle').textContent = 'Editar Boleto';
    const fmtD = d => d ? new Date(d).toISOString().split('T')[0] : '';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Status</label>
                <select id="mBolEditStatus">
                    <option value="pendente" ${b.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="pago" ${b.status === 'pago' ? 'selected' : ''}>Pago</option>
                    <option value="vencido" ${b.status === 'vencido' ? 'selected' : ''}>Vencido</option>
                    <option value="cancelado" ${b.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Data Pagamento</label><input type="date" id="mBolEditPagDt" value="${fmtD(b.data_pagamento)}"></div>
            <div class="admin-form-group"><label>Valor Pago (R$)</label><input type="number" id="mBolEditPagVal" step="0.01" value="${b.valor_pago || ''}"></div>
        </div>
        <div class="admin-form-group"><label>Observação</label><textarea id="mBolEditObs">${b.observacao || ''}</textarea></div>
        ${adminUploadField('mBolEditComprov', 'Comprovante de Pagamento', b.arquivo_comprovante_url)}
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="updateBoleto(${boletoId}, ${m.id})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function updateBoleto(boletoId, ministroId) {
    try {
        await AdminAPI.put(`/boletos/${boletoId}`, {
            status: document.getElementById('mBolEditStatus').value,
            data_pagamento: document.getElementById('mBolEditPagDt').value || null,
            valor_pago: parseFloat(document.getElementById('mBolEditPagVal').value) || 0,
            observacao: document.getElementById('mBolEditObs').value,
            arquivo_comprovante_url: document.getElementById('mBolEditComprov').value || null,
        });
        closeModal();
        showToast('Boleto atualizado!', 'success');
        openMembroDetail(ministroId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteBoleto(boletoId) {
    if (!confirm('Excluir este boleto?')) return;
    try {
        await AdminAPI.del(`/boletos/${boletoId}`);
        showToast('Boleto excluído', 'success');
        if (currentMembro) openMembroDetail(currentMembro.id);
    } catch (err) { showToast(err.message, 'error'); }
}

// ---- Credencial Modal ----
function openCredencialModal(ministroId) {
    const m = currentMembro;
    const numSugestao = `CIEIB-${new Date().getFullYear()}-${String(ministroId).padStart(4, '0')}`;

    document.getElementById('modalTitle').textContent = 'Nova Credencial Digital';
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Nº Credencial</label><input type="text" id="mCredNum" value="${numSugestao}"></div>
            <div class="admin-form-group"><label>Tipo</label>
                <select id="mCredTipo">
                    <option value="ministro">Ministro</option>
                    <option value="obreiro">Obreiro</option>
                    <option value="missionario">Missionário</option>
                    <option value="temporaria">Temporária</option>
                </select>
            </div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Data Emissão</label><input type="date" id="mCredEmissao" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="admin-form-group"><label>Data Validade</label><input type="date" id="mCredValidade"></div>
        </div>
        ${adminUploadField('mCredFrente', 'Imagem Frente da Credencial', '')}
        ${adminUploadField('mCredVerso', 'Imagem Verso da Credencial', '')}
        ${adminUploadField('mCredPDF', 'Credencial em PDF', '')}
        <div class="admin-form-group"><label>Observação</label><textarea id="mCredObs"></textarea></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveCredencial(${ministroId})"><i class="fas fa-save"></i> Emitir Credencial</button>
    `;
    openModal();
}

async function saveCredencial(ministroId) {
    const body = {
        numero_credencial: document.getElementById('mCredNum').value,
        tipo: document.getElementById('mCredTipo').value,
        data_emissao: document.getElementById('mCredEmissao').value,
        data_validade: document.getElementById('mCredValidade').value || null,
        arquivo_frente_url: document.getElementById('mCredFrente').value || null,
        arquivo_verso_url: document.getElementById('mCredVerso').value || null,
        arquivo_pdf_url: document.getElementById('mCredPDF').value || null,
        observacao: document.getElementById('mCredObs').value,
        status: 'ativa',
    };
    try {
        await AdminAPI.post(`/ministros/${ministroId}/credenciais`, body);
        closeModal();
        showToast('Credencial emitida com sucesso!', 'success');
        openMembroDetail(ministroId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function openCredencialEditModal(credencialId) {
    const m = currentMembro;
    const c = (m?.credenciais || []).find(x => x.id === credencialId);
    if (!c) return;
    const fmtD = d => d ? new Date(d).toISOString().split('T')[0] : '';

    document.getElementById('modalTitle').textContent = `Editar Credencial — ${c.numero_credencial}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="form-grid">
            <div class="admin-form-group"><label>Status</label>
                <select id="mCredEditStatus">
                    <option value="ativa" ${c.status === 'ativa' ? 'selected' : ''}>Ativa</option>
                    <option value="suspensa" ${c.status === 'suspensa' ? 'selected' : ''}>Suspensa</option>
                    <option value="vencida" ${c.status === 'vencida' ? 'selected' : ''}>Vencida</option>
                    <option value="cancelada" ${c.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Data Validade</label><input type="date" id="mCredEditVal" value="${fmtD(c.data_validade)}"></div>
        </div>
        ${adminUploadField('mCredEditFrente', 'Frente', c.arquivo_frente_url)}
        ${adminUploadField('mCredEditVerso', 'Verso', c.arquivo_verso_url)}
        ${adminUploadField('mCredEditPDF', 'PDF', c.arquivo_pdf_url)}
        <div class="admin-form-group"><label>Observação</label><textarea id="mCredEditObs">${c.observacao || ''}</textarea></div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="updateCredencial(${credencialId}, ${m.id})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function updateCredencial(credencialId, ministroId) {
    try {
        await AdminAPI.put(`/credenciais/${credencialId}`, {
            status: document.getElementById('mCredEditStatus').value,
            data_validade: document.getElementById('mCredEditVal').value || null,
            arquivo_frente_url: document.getElementById('mCredEditFrente').value || null,
            arquivo_verso_url: document.getElementById('mCredEditVerso').value || null,
            arquivo_pdf_url: document.getElementById('mCredEditPDF').value || null,
            observacao: document.getElementById('mCredEditObs').value,
        });
        closeModal();
        showToast('Credencial atualizada!', 'success');
        openMembroDetail(ministroId);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteCredencial(credencialId) {
    if (!confirm('Excluir esta credencial?')) return;
    try {
        await AdminAPI.del(`/credenciais/${credencialId}`);
        showToast('Credencial excluída', 'success');
        if (currentMembro) openMembroDetail(currentMembro.id);
    } catch (err) { showToast(err.message, 'error'); }
}

// ---- Bulk Credencial (placeholder) ----
function openBulkCredencialModal() {
    document.getElementById('modalTitle').textContent = 'Gerar Credenciais em Lote';
    document.getElementById('modalBody').innerHTML = `
        <p style="font-size:0.85rem;color:#555;margin-bottom:16px;">Selecione os critérios para gerar credenciais automaticamente para múltiplos membros:</p>
        <div class="form-grid">
            <div class="admin-form-group"><label>Filtrar por Status</label>
                <select id="mBulkStatus">
                    <option value="ATIVO">Apenas Ativos</option>
                    <option value="">Todos</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Filtrar por Anuidade</label>
                <select id="mBulkAnuidade">
                    <option value="paga">Anuidade Paga</option>
                    <option value="">Qualquer</option>
                </select>
            </div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Validade da Credencial</label><input type="date" id="mBulkValidade" value="${new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0]}"></div>
        </div>
        <div style="background:#fff3e0;padding:12px;border-radius:8px;margin-top:12px;">
            <p style="font-size:0.8rem;color:#e65100;"><i class="fas fa-info-circle"></i> As credenciais serão geradas apenas para membros que ainda não possuem credencial ativa. Você poderá baixar o relatório CSV com os dados para produção das credenciais físicas.</p>
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="executarBulkCredencial()"><i class="fas fa-id-badge"></i> Gerar e Baixar Relatório</button>
    `;
    openModal();
}

async function executarBulkCredencial() {
    const status = document.getElementById('mBulkStatus').value;
    const anuidade = document.getElementById('mBulkAnuidade').value;

    try {
        // Download CSV with credential data
        let qs = '?formato=csv';
        if (status) qs += `&status=${status}`;
        if (anuidade) qs += `&anuidade=${anuidade}`;
        qs += '&credencial=pendente';

        const response = await fetch(`/api/admin/relatorios/membros${qs}`, {
            headers: { 'Authorization': `Bearer ${AdminAPI.token()}` }
        });

        if (!response.ok) throw new Error('Erro ao gerar relatório');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credenciais_pendentes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        closeModal();
        showToast('Relatório para credenciais baixado!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
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
        ${adminUploadField('mDirFoto', 'Foto', item?.foto_url)}
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
