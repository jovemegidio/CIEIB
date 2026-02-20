/* ==============================================================
   CIEIB — API Client
   Comunicação do frontend com o backend
   ============================================================== */

const API = {
    baseUrl: '/api',
    token: localStorage.getItem('cieib_token'),

    // ---- Fallback mock (quando backend indisponível / Live Server) ----
    _offline: null,
    _mockData: {
        '/dashboard/stats': { igrejas: 156, ministros: 1243, estados: 22, convencoes: 8 },
        '/dashboard/config': { nome_site: 'CIEIB', tema: 'default' },
        '/dashboard/eventos-proximos': [
            { titulo: '15ª Convenção Nacional CIEIB', data_evento: '2025-09-15T09:00:00', local: 'Brasília - DF', tipo: 'Convenção', hora_inicio: '09:00', hora_fim: '18:00' },
            { titulo: 'Seminário de Liderança Pastoral', data_evento: '2025-08-20T14:00:00', local: 'São Paulo - SP', tipo: 'Seminário', hora_inicio: '14:00', hora_fim: '21:00' },
            { titulo: 'Retiro de Obreiros 2025', data_evento: '2025-07-25T08:00:00', local: 'Campinas - SP', tipo: 'Retiro', hora_inicio: '08:00', hora_fim: '17:00' }
        ],
        '/noticias': {
            noticias: [
                { id: 1, titulo: 'CIEIB Realiza 15ª Convenção Nacional em Brasília', resumo: 'Evento reunirá líderes de todo o Brasil para discutir os rumos da convenção.', imagem_url: '', data_publicacao: '2025-07-01', categoria: 'Institucional', destaque: true },
                { id: 2, titulo: 'Programa de Capacitação Ministerial 2025', resumo: 'Nova turma oferece cursos de teologia e liderança com certificação.', imagem_url: '', data_publicacao: '2025-06-28', categoria: 'Educação', destaque: false },
                { id: 3, titulo: 'Campanha Nacional de Missões Urbanas', resumo: 'Igrejas afiliadas participam da maior ação missionária do ano.', imagem_url: '', data_publicacao: '2025-06-25', categoria: 'Missões', destaque: false },
                { id: 4, titulo: 'Encontro de Jovens Reunirá 500 Participantes', resumo: 'O encontro acontecerá em agosto com palestras e oficinas.', imagem_url: '', data_publicacao: '2025-06-20', categoria: 'Juventude', destaque: true }
            ],
            total: 4, page: 1, totalPages: 1
        },
        '/notificacoes/site': [
            { id: 1, titulo: '15ª Convenção Nacional', mensagem: 'Inscrições abertas até 30 de agosto!', tipo: 'evento', link: '#eventos', ativa: true },
            { id: 2, titulo: 'Novo Curso de Teologia', mensagem: 'Matrículas abertas para o segundo semestre.', tipo: 'curso', link: '#cursos', ativa: true }
        ],
    },
    _getMockResponse(endpoint) {
        const base = endpoint.split('?')[0];
        return this._mockData[base] !== undefined ? this._mockData[base] : null;
    },

    // ---- Headers padrão ----
    headers(extra = {}) {
        const h = { 'Content-Type': 'application/json', ...extra };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    // ---- Fetch genérico (com fallback mock) ----
    async request(method, endpoint, body = null) {
        if (this._offline === true) {
            const mock = this._getMockResponse(endpoint);
            if (mock !== null) return JSON.parse(JSON.stringify(mock));
            throw new Error('Backend indisponível');
        }

        const options = { method, headers: this.headers() };
        if (body) options.body = JSON.stringify(body);

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error('Resposta não-JSON');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro na requisição');
            this._offline = false;
            return data;
        } catch (err) {
            this._offline = true;
            const mock = this._getMockResponse(endpoint);
            if (mock !== null) return JSON.parse(JSON.stringify(mock));
            throw err;
        }
    },

    // ---- Upload de arquivo ----
    async upload(endpoint, formData) {
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro no upload');
        return data;
    },

    // ---- Métodos auxiliares ----
    get(endpoint) { return this.request('GET', endpoint); },
    post(endpoint, body) { return this.request('POST', endpoint, body); },
    put(endpoint, body) { return this.request('PUT', endpoint, body); },
    delete(endpoint) { return this.request('DELETE', endpoint); },

    // =============== AUTH ===============
    async login(cpf, senha) {
        // Mock login — CPF: 000.000.000-00 / Senha: 123456
        if (cpf.replace(/\D/g, '') === '00000000000' && senha === '123456') {
            const mock = { token: 'mock_token_ministro', ministro: { nome: 'Pr. João Silva (Demo)', cpf: '00000000000' } };
            this.token = mock.token;
            localStorage.setItem('cieib_token', mock.token);
            localStorage.setItem('cieib_usuario', mock.ministro.nome);
            localStorage.setItem('cieib_cpf', mock.ministro.cpf);
            localStorage.setItem('cieib_logado', 'true');
            return mock;
        }

        const data = await this.post('/auth/login', { cpf, senha });
        this.token = data.token;
        localStorage.setItem('cieib_token', data.token);
        localStorage.setItem('cieib_usuario', data.ministro.nome);
        localStorage.setItem('cieib_cpf', data.ministro.cpf);
        localStorage.setItem('cieib_logado', 'true');
        return data;
    },

    logout() {
        this.token = null;
        localStorage.removeItem('cieib_token');
        localStorage.removeItem('cieib_usuario');
        localStorage.removeItem('cieib_cpf');
        localStorage.removeItem('cieib_logado');
        window.location.href = 'area-do-ministro.html';
    },

    isLoggedIn() {
        return !!this.token && !!localStorage.getItem('cieib_logado');
    },

    async verifyToken() {
        try {
            if (!this.token) return false;
            if (this.token === 'mock_token_ministro') return true;
            await this.get('/auth/verify');
            return true;
        } catch {
            this.logout();
            return false;
        }
    },

    // =============== MINISTRO ===============
    getMinistro() { return this.get('/ministros/me'); },
    updateMinistro(dados) { return this.put('/ministros/me', dados); },

    async uploadFoto(file) {
        const formData = new FormData();
        formData.append('foto', file);
        return this.upload('/ministros/foto', formData);
    },

    // =============== CONVENÇÕES ===============
    getConvencoes() { return this.get('/convencoes'); },

    // =============== CONTAS A RECEBER ===============
    getContas(status = '') {
        const qs = status ? `?status=${status}` : '';
        return this.get(`/contas${qs}`);
    },
    getContasResumo() { return this.get('/contas/resumo'); },

    // =============== EVENTOS ===============
    getEventos(params = '') { return this.get(`/eventos${params}`); },
    getInscricoes() { return this.get('/eventos/inscricoes'); },
    inscrever(eventoId) { return this.post(`/eventos/${eventoId}/inscrever`); },

    // =============== MENSAGENS ===============
    getMensagens() { return this.get('/mensagens'); },
    enviarMensagem(assunto, conteudo) { return this.post('/mensagens', { assunto, conteudo }); },
    marcarLida(id) { return this.put(`/mensagens/${id}/lida`); },

    // =============== SITE PÚBLICO ===============
    getNoticias(page = 1, limit = 10, categoria = '') {
        let qs = `?page=${page}&limit=${limit}`;
        if (categoria) qs += `&categoria=${categoria}`;
        return this.get(`/noticias${qs}`);
    },

    getNoticia(id) { return this.get(`/noticias/${id}`); },

    enviarContato(dados) { return this.post('/contato', dados); },

    getStats() { return this.get('/dashboard/stats'); },
    getConfig() { return this.get('/dashboard/config'); },
    getEventosProximos() { return this.get('/dashboard/eventos-proximos'); },

    // =============== ALTERAR SENHA ===============
    alterarSenha(senhaAtual, novaSenha) {
        return this.post('/auth/change-password', { senhaAtual, novaSenha });
    },

    // =============== CURSOS / FACULDADES ===============
    getCursos(area = '') {
        const qs = area ? `?area=${area}` : '';
        return this.get(`/cursos${qs}`);
    },
    getCurso(id) { return this.get(`/cursos/${id}`); },
    getMinhasMatriculas() { return this.get('/cursos/minhas/matriculas'); },
    matricularCurso(cursoId) { return this.post(`/cursos/${cursoId}/matricular`); },
    getCursoAulas(cursoId) { return this.get(`/cursos/${cursoId}/aulas`); },
    concluirAula(aulaId) { return this.post(`/cursos/aulas/${aulaId}/concluir`); },
    responderAvaliacao(avaliacaoId, respostas) {
        return this.post(`/cursos/avaliacoes/${avaliacaoId}/responder`, { respostas });
    },
    getMeusCertificados() { return this.get('/cursos/meus/certificados'); },
    solicitarCertificado(cursoId) { return this.post(`/cursos/${cursoId}/certificado`); },
    verificarCertificado(codigo) { return this.get(`/cursos/certificado/verificar/${codigo}`); },

    // =============== CREDENCIAL DIGITAL ===============
    getCredencial() { return this.get('/credencial'); },
    verificarCredencial(codigo) { return this.get(`/credencial/verificar/${codigo}`); },
    renovarCredencial() { return this.post('/credencial/renovar'); },

    // =============== NOTIFICAÇÕES ===============
    getNotificacoes() { return this.get('/notificacoes'); },
    marcarNotificacaoLida(id) { return this.put(`/notificacoes/${id}/lida`); },
    marcarTodasNotificacoesLidas() { return this.put('/notificacoes/ler-todas'); },
    getNotificacoesNaoLidas() { return this.get('/notificacoes/nao-lidas'); },
    getNotificacoesSite() { return this.get('/notificacoes/site'); }
};
