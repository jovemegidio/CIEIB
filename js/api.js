/* ==============================================================
   CIEIB — API Client
   Comunicação do frontend com o backend
   ============================================================== */

const API = {
    baseUrl: '/api',
    token: localStorage.getItem('cieib_token'),

    // ---- Headers padrão ----
    headers(extra = {}) {
        const h = { 'Content-Type': 'application/json', ...extra };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    // ---- Fetch genérico ----
    async request(method, endpoint, body = null) {
        const options = { method, headers: this.headers() };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${this.baseUrl}${endpoint}`, options);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Resposta não-JSON');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na requisição');
        return data;
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

    // =============== ENDEREÇO ===============
    getEndereco() { return this.get('/ministros/endereco'); },
    updateEndereco(dados) { return this.put('/ministros/endereco', dados); },

    // =============== FILHOS ===============
    getFilhos() { return this.get('/ministros/filhos'); },
    addFilho(dados) { return this.post('/ministros/filhos', dados); },
    removeFilho(id) { return this.delete(`/ministros/filhos/${id}`); },

    // =============== DOCUMENTOS ===============
    getDocumentos() { return this.get('/ministros/documentos'); },

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
    getMensagem(id) { return this.get(`/mensagens/${id}`); },
    getMensagensNaoLidas() { return this.get('/mensagens/nao-lidas'); },
    enviarMensagem(destinatario, assunto, conteudo) { return this.post('/mensagens', { destinatario, assunto, conteudo }); },
    responderMensagem(id, conteudo) { return this.post(`/mensagens/${id}/responder`, { conteudo }); },
    marcarLida(id) { return this.put(`/mensagens/${id}/lida`); },
    excluirMensagem(id) { return this.delete(`/mensagens/${id}`); },

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
    getConfigAll() { return this.get('/dashboard/config-all'); },
    getRedesSociais() { return this.get('/dashboard/redes-sociais'); },
    getConteudos(pagina) { return this.get(`/dashboard/conteudos/${pagina}`); },
    getEventosProximos() { return this.get('/dashboard/eventos-proximos'); },
    getDiretoria() { return this.get('/dashboard/diretoria'); },

    // =============== SEGURANÇA ===============
    alterarSenha(senhaAtual, novaSenha) {
        return this.post('/auth/change-password', { senhaAtual, novaSenha });
    },
    atualizarDadosAcesso(dados) {
        return this.put('/ministros/me/acesso', dados);
    },

    // =============== SUPORTE ===============
    enviarSuporte(dados) { return this.post('/suporte', dados); },
    getMeusChamados() { return this.get('/suporte'); },

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

    // =============== PAGAMENTOS ===============
    solicitarBoleto(contaId) { return this.post(`/contas/${contaId}/solicitar-boleto`); },

    getBoletos() { return this.get('/contas/boletos'); },

    async enviarComprovantePix(contaId, file) {
        const formData = new FormData();
        formData.append('comprovante', file);
        return this.upload(`/contas/${contaId}/enviar-comprovante`, formData);
    },

    solicitarCarteirinhaFisica(dados) {
        return this.post('/contas/solicitar-carteirinha', dados);
    },

    getCarteirinhaStatus() {
        return this.get('/contas/carteirinha-status');
    },

    // =============== NOTIFICAÇÕES ===============
    getNotificacoes() { return this.get('/notificacoes'); },
    marcarNotificacaoLida(id, alertaKey) {
        return this.put(`/notificacoes/${id}/lida`, alertaKey ? { alertaKey } : {});
    },
    marcarTodasNotificacoesLidas() { return this.put('/notificacoes/ler-todas'); },
    getNotificacoesNaoLidas() { return this.get('/notificacoes/nao-lidas'); },
    getNotificacoesSite() { return this.get('/notificacoes/site'); }
};
