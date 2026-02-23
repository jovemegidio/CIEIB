/* ==============================================================
   PAINEL DO MINISTRO — JAVASCRIPT (com integração API)
   ============================================================== */

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initDragDrop();
    initDateTime();
    initMobileNav();
    checkAuth();
});

// ---- Verificação de Login via API ----
async function checkAuth() {
    if (!API.isLoggedIn()) {
        window.location.href = 'area-do-ministro.html';
        return;
    }

    try {
        const valid = await API.verifyToken();
        if (!valid) return; // verifyToken já redireciona

        // Carregar dados do ministro
        await loadMinistroData();
    } catch (err) {
        console.error('Erro na autenticação:', err);
        API.logout();
    }
}

// ---- Carregar todos os dados do painel ----
async function loadMinistroData() {
    try {
        // Carregar em paralelo
        const [ministro, convencoes, contasData, inscricoes, mensagens] = await Promise.all([
            API.getMinistro(),
            API.getConvencoes().catch(() => []),
            API.getContas().catch(() => ({ contas: [], totais: {} })),
            API.getInscricoes().catch(() => []),
            API.getMensagens().catch(() => [])
        ]);

        // Preencher nome do usuário
        displayUserName(ministro.nome);

        // Preencher cabeçalho com CPF do usuário logado
        const headerUsuario = document.getElementById('headerUsuario');
        if (headerUsuario) headerUsuario.textContent = 'Usuário: ' + (ministro.cpf || '');

        // Preencher label de convenção
        const convLabel = document.getElementById('convLabel');
        if (convLabel) convLabel.textContent = 'Convenção => ' + (ministro.conv_estadual || 'CIEIB');

        // Preencher dados pessoais
        fillDadosPessoais(ministro);

        // Preencher foto
        if (ministro.foto_url) {
            const fotoEl = document.getElementById('fotoMinistro');
            if (fotoEl) {
                fotoEl.innerHTML = `<img src="${ministro.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
            }
        }

        // Preencher convenções
        fillConvencoes(convencoes);

        // Preencher contas a receber (resumo na lateral)
        fillContasResumo(contasData);

        // Preencher histórico completo
        fillHistorico(contasData);

        // Carregar boletos do ministro
        loadBoletos();

        // Preencher inscrições em eventos
        fillEventos(inscricoes);

        // Preencher mensagens
        fillMensagens(mensagens);

        // Carregar cursos e credencial (lazy - quando clicar na aba)
        initLazyTabs();

        // Carregar notificações
        loadNotificacoes();

    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        showToast('Erro ao carregar dados do painel', 'error');
    }
}

// ---- Exibir nome do usuário ----
function displayUserName(nome) {
    const el = document.getElementById('painelUserName');
    if (!el) return;
    const span = el.querySelector('span');
    if (!span) return;
    const primeiro = (nome || '').split(' ')[0];
    span.textContent = primeiro || 'Ministro';
}

// ---- Preencher formulário de dados pessoais ----
function fillDadosPessoais(m) {
    const campos = {
        'campo-cpf': formatCPF(m.cpf),
        'campo-nome': m.nome,
        'campo-nomesocial': m.nome_social,
        'campo-docestrangeiro': m.doc_estrangeiro,
        'campo-cargo': m.cargo,
        'campo-conv': m.conv_estadual,
        'campo-pais': m.pais_nascimento,
        'campo-cidade': m.cidade_nascimento,
        'campo-nacionalidade': m.nacionalidade,
        'campo-conjuge': m.nome_conjuge,
        'campo-pai': m.pai,
        'campo-mae': m.mae,
        'campo-rg': m.rg,
        'campo-orgao': m.orgao_expedidor,
        'campo-email': m.email,
        'campo-biometria': m.biometria,
        'campo-registro': m.registro || '',
        'campo-igrejaordenacao': m.igreja_ordenacao,
        'campo-cidadeordenacao': m.cidade_ordenacao
    };

    for (const [id, valor] of Object.entries(campos)) {
        const el = document.getElementById(id);
        if (el) el.value = valor || '';
    }

    // Selects
    const sexoEl = document.getElementById('campo-sexo');
    if (sexoEl && m.sexo) sexoEl.value = m.sexo;

    const estadoEl = document.getElementById('campo-estado');
    if (estadoEl && m.estado_nascimento) estadoEl.value = m.estado_nascimento;

    const ecEl = document.getElementById('campo-estadocivil');
    if (ecEl && m.estado_civil) ecEl.value = m.estado_civil;

    const escolaridadeEl = document.getElementById('campo-escolaridade');
    if (escolaridadeEl && m.escolaridade) escolaridadeEl.value = m.escolaridade;

    // Datas
    const nascEl = document.getElementById('campo-nascimento');
    if (nascEl && m.data_nascimento) nascEl.value = m.data_nascimento.split('T')[0];

    const nascConjEl = document.getElementById('campo-nascconjuge');
    if (nascConjEl && m.data_nasc_conjuge) nascConjEl.value = m.data_nasc_conjuge.split('T')[0];

    const batismoEl = document.getElementById('campo-databatismo');
    if (batismoEl && m.data_batismo) batismoEl.value = m.data_batismo.split('T')[0];

    const ordenacaoEl = document.getElementById('campo-dataordenacao');
    if (ordenacaoEl && m.data_ordenacao) ordenacaoEl.value = m.data_ordenacao.split('T')[0];
}

function formatCPF(cpf) {
    if (!cpf) return '';
    const c = cpf.replace(/\D/g, '');
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ---- Preencher tabela de convenções ----
function fillConvencoes(convencoes) {
    const tbody = document.querySelector('#tab-cadastro .cadastro-left .panel-card:nth-child(2) tbody');
    if (!tbody || !convencoes.length) return;

    tbody.innerHTML = convencoes.map(c => `
        <tr>
            <td><strong>${c.sigla}</strong></td>
            <td>${c.registro || '-'}</td>
            <td><span class="status-badge status-${c.status === 'ATIVO' ? 'ativo' : 'inativo'}">${c.status}</span></td>
            <td><span class="status-badge status-${c.condicao === 'ATIVO' ? 'ativo' : 'inativo'}">${c.condicao}</span></td>
        </tr>
    `).join('');
}

// ---- Preencher resumo de contas (lateral) ----
function fillContasResumo(data) {
    const tbody = document.querySelector('#tab-cadastro .cadastro-left .panel-card:nth-child(3) tbody');
    if (!tbody) return;

    // Agrupar por serviço
    const grouped = {};
    data.contas.forEach(c => {
        if (!grouped[c.servico]) {
            grouped[c.servico] = { total: 0, desc: 0, pago: 0, aberto: 0 };
        }
        grouped[c.servico].total += parseFloat(c.valor) || 0;
        grouped[c.servico].desc += parseFloat(c.desconto) || 0;
        grouped[c.servico].pago += parseFloat(c.valor_pago) || 0;
        grouped[c.servico].aberto += parseFloat(c.saldo) || 0;
    });

    tbody.innerHTML = Object.entries(grouped).map(([servico, v]) => `
        <tr>
            <td>${servico}</td>
            <td>R$${v.total.toFixed(2)}</td>
            <td>R$${v.desc.toFixed(2)}</td>
            <td>R$${v.pago.toFixed(2)}</td>
        </tr>
    `).join('');
}

// ---- Preencher histórico completo (aba 3) ----
function fillHistorico(data) {
    const tbody = document.querySelector('#tab-historico .painel-table tbody');
    if (!tbody) return;

    const abertos = data.contas.filter(c => c.status === 'ABERTO');
    const quitados = data.contas.filter(c => c.status === 'QUITADO');

    let html = '';

    abertos.forEach(c => {
        const pgtoCol = c.status === 'ABERTO' ? `
            <td>
                <button class="btn-pagar-conta" onclick="abrirModalPagamento(${c.id}, '${(c.servico||'').replace(/'/g,"\\'")}', ${parseFloat(c.saldo).toFixed(2)}, '${c.data_vencimento}')">
                    <i class="fas fa-money-bill-wave"></i> Pagar
                </button>
                ${c.forma_pagamento === 'pix' && c.comprovante_pix_url ? '<span class="pgto-badge pgto-badge-pix"><i class="fas fa-check"></i> PIX enviado</span>' : ''}
                ${c.boleto_solicitado ? '<span class="pgto-badge pgto-badge-boleto"><i class="fas fa-barcode"></i> Boleto solic.</span>' : ''}
            </td>` : '<td>-</td>';

        html += `<tr>
            <td>${c.convencao}</td>
            <td>${c.conta}</td>
            <td>${c.nro_docto}</td>
            <td>${formatDate(c.data)}</td>
            <td>${c.registro}</td>
            <td>${formatDate(c.data_vencimento)}</td>
            <td>${parseFloat(c.valor).toFixed(2)}</td>
            <td>${parseFloat(c.desconto).toFixed(2)}</td>
            <td>${parseFloat(c.valor_pago).toFixed(2)}</td>
            <td>${c.data_pagamento ? formatDate(c.data_pagamento) : ''}</td>
            <td class="valor-aberto">R$${parseFloat(c.saldo).toFixed(2)}</td>
            <td>${c.servico}</td>
            <td><span class="status-badge status-aberto-badge">${c.status}</span></td>
            ${pgtoCol}
        </tr>`;
    });

    // Linha total
    if (abertos.length > 0) {
        const totals = abertos.reduce((acc, c) => ({
            valor: acc.valor + parseFloat(c.valor),
            desc: acc.desc + parseFloat(c.desconto),
            pago: acc.pago + parseFloat(c.valor_pago),
            saldo: acc.saldo + parseFloat(c.saldo)
        }), { valor: 0, desc: 0, pago: 0, saldo: 0 });

        html += `<tr class="row-total">
            <td colspan="6"><strong>Soma</strong></td>
            <td><strong>${totals.valor.toFixed(2)}</strong></td>
            <td><strong>${totals.desc.toFixed(2)}</strong></td>
            <td><strong>${totals.pago.toFixed(2)}</strong></td>
            <td></td>
            <td class="valor-aberto"><strong>R$${totals.saldo.toFixed(2)}</strong></td>
            <td colspan="3"></td>
        </tr>`;
    }

    tbody.innerHTML = html;
}

// ---- Carregar e exibir boletos do ministro ----
async function loadBoletos() {
    try {
        const boletos = await API.getBoletos();
        fillBoletos(boletos);
    } catch (err) {
        console.error('Erro ao carregar boletos:', err);
    }
}

function fillBoletos(boletos) {
    const section = document.getElementById('meus-boletos-section');
    const tbody = document.getElementById('boletos-ministro-tbody');
    if (!section || !tbody) return;

    if (!boletos || boletos.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    tbody.innerHTML = boletos.map(b => {
        const statusClass = b.status === 'pago' ? 'status-quitado-badge'
            : b.status === 'vencido' ? 'status-encerrado'
            : 'status-aberto-badge';
        const statusLabel = b.status === 'pago' ? 'PAGO'
            : b.status === 'vencido' ? 'VENCIDO'
            : 'PENDENTE';

        const downloadBtn = b.arquivo_boleto_url
            ? `<a href="${b.arquivo_boleto_url}" target="_blank" class="btn-pagar-conta" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                   <i class="fas fa-download"></i> Baixar Boleto
               </a>`
            : '<span style="color:#999;">Aguardando</span>';

        return `<tr>
            <td style="text-transform:capitalize;">${b.tipo || '-'}</td>
            <td>${b.referencia || '-'}</td>
            <td>R$ ${parseFloat(b.valor || 0).toFixed(2)}</td>
            <td>${b.data_vencimento ? formatDate(b.data_vencimento) : '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${b.observacao || '-'}</td>
            <td>${downloadBtn}</td>
        </tr>`;
    }).join('');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}

// ---- Preencher eventos/inscrições (aba 4) ----
function fillEventos(inscricoes) {
    const tbody = document.querySelector('#tab-eventos .painel-table tbody');
    if (!tbody) return;

    if (inscricoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;color:#aaa;padding:30px;">Nenhuma inscrição encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = inscricoes.map(i => `
        <tr>
            <td><button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button></td>
            <td>${i.evento_id}</td>
            <td>${i.convencao || 'CIEIB'}</td>
            <td>${i.titulo}</td>
            <td><span class="status-badge status-encerrado">${i.evento_status}</span></td>
            <td>${i.numero_inscricao}</td>
            <td>${formatDate(i.data_inscricao)}</td>
            <td>R$${parseFloat(i.valor).toFixed(2)}</td>
            <td>R$${parseFloat(i.valor_baixa).toFixed(2)}</td>
            <td>${i.participou}</td>
            <td><span class="status-badge status-${(i.status_inscricao || '').toUpperCase() === 'QUITADO' ? 'quitado-badge' : 'aberto-badge'}">${i.status_inscricao}</span></td>
            <td>${formatDate(i.data_evento)}</td>
            <td>${i.hora_inicio || ''}</td>
            <td>${formatDate(i.data_termino)}</td>
        </tr>
    `).join('');

    // Pagination
    const pagination = document.querySelector('#tab-eventos .table-pagination');
    if (pagination) pagination.textContent = `[1 a ${inscricoes.length} de ${inscricoes.length}]`;
}

// ================================================================
//  MENSAGENS DIRETAS — Sistema Completo
// ================================================================
let allMensagens = [];
let currentMsgFilter = 'todas';
let currentMsgSearch = '';
let currentMsgDetail = null;

function fillMensagens(mensagens) {
    allMensagens = mensagens || [];
    renderMsgStats();
    renderMsgList();
    initMsgEvents();
}

function renderMsgStats() {
    const total = allMensagens.length;
    const naoLidas = allMensagens.filter(m => !m.lida && m.tipo === 'recebida').length;
    const recebidas = allMensagens.filter(m => m.tipo === 'recebida').length;
    const enviadas = allMensagens.filter(m => m.tipo === 'enviada').length;

    const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    el('msgTotal', total);
    el('msgNaoLidas', naoLidas);
    el('msgRecebidas', recebidas);
    el('msgEnviadas', enviadas);
}

function getFilteredMensagens() {
    let filtered = [...allMensagens];
    if (currentMsgFilter === 'recebidas') filtered = filtered.filter(m => m.tipo === 'recebida');
    else if (currentMsgFilter === 'enviadas') filtered = filtered.filter(m => m.tipo === 'enviada');
    if (currentMsgSearch) {
        const q = currentMsgSearch.toLowerCase();
        filtered = filtered.filter(m =>
            (m.assunto || '').toLowerCase().includes(q) ||
            (m.conteudo || '').toLowerCase().includes(q) ||
            (m.remetente || '').toLowerCase().includes(q) ||
            (m.destinatario || '').toLowerCase().includes(q)
        );
    }
    return filtered;
}

function renderMsgList() {
    const listEl = document.getElementById('msgList');
    const emptyEl = document.getElementById('msgEmpty');
    if (!listEl) return;

    const filtered = getFilteredMensagens();

    if (filtered.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) {
            emptyEl.style.display = 'block';
            if (allMensagens.length > 0 && filtered.length === 0) {
                emptyEl.querySelector('h4').textContent = 'Nenhum resultado';
                emptyEl.querySelector('p').textContent = 'Nenhuma mensagem corresponde ao filtro atual.';
            } else {
                emptyEl.querySelector('h4').textContent = 'Nenhuma mensagem';
                emptyEl.querySelector('p').textContent = 'Sua caixa de mensagens está vazia.';
            }
        }
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listEl.innerHTML = filtered.map(m => {
        const isEnviada = m.tipo === 'enviada';
        const nome = isEnviada ? (m.destinatario || 'Secretaria CIEIB') : (m.remetente || 'CIEIB');
        const inicial = nome.charAt(0).toUpperCase();
        const avClass = isEnviada ? 'msg-av-enviada' : 'msg-av-recebida';
        const naoLida = !m.lida && !isEnviada ? 'msg-nao-lida' : '';
        const dataFormatada = formatDateMsg(m.data_envio);
        const preview = (m.conteudo || '').substring(0, 120);

        let badges = '';
        if (isEnviada) badges += '<span class="msg-badge msg-badge-enviada"><i class="fas fa-paper-plane"></i> Enviada</span>';
        else badges += '<span class="msg-badge msg-badge-recebida"><i class="fas fa-inbox"></i> Recebida</span>';
        if (!m.lida && !isEnviada) badges += '<span class="msg-badge msg-badge-nao-lida">Nova</span>';
        if (m.respondida) badges += '<span class="msg-badge msg-badge-respondida"><i class="fas fa-reply"></i> Respondida</span>';

        return `
            <div class="msg-item ${naoLida}" data-msg-id="${m.id}">
                <div class="msg-item-avatar ${avClass}">${inicial}</div>
                <div class="msg-item-content">
                    <div class="msg-item-top">
                        <span class="msg-item-sender">${isEnviada ? 'Para: ' : ''}${nome}</span>
                        <span class="msg-item-date">${dataFormatada}</span>
                    </div>
                    <div class="msg-item-subject">${m.assunto || '(sem assunto)'}</div>
                    <div class="msg-item-preview">${preview}</div>
                    <div class="msg-item-badges">${badges}</div>
                </div>
            </div>
        `;
    }).join('');

    // Click handlers
    listEl.querySelectorAll('.msg-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.msgId);
            openMsgDetail(id);
        });
    });
}

function formatDateMsg(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffH < 24) return `${diffH}h atrás`;

    const isThisYear = d.getFullYear() === now.getFullYear();
    if (isThisYear) {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    return d.toLocaleDateString('pt-BR');
}

function formatDateTimeFull(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ---- Init messaging events ----
let msgEventsInitialized = false;
function initMsgEvents() {
    if (msgEventsInitialized) return;
    msgEventsInitialized = true;

    // Filter tabs
    document.querySelectorAll('.msg-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.msg-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMsgFilter = btn.dataset.filter;
            renderMsgList();
        });
    });

    // Search
    const searchInput = document.getElementById('msgSearchInput');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                currentMsgSearch = searchInput.value.trim();
                renderMsgList();
            }, 300);
        });
    }

    // Nova Mensagem button
    document.getElementById('btnNovaMensagem')?.addEventListener('click', openMsgModal);

    // Char counter
    document.getElementById('msgConteudo')?.addEventListener('input', (e) => {
        const count = document.getElementById('msgCharCount');
        if (count) count.textContent = e.target.value.length;
    });

    // Send message
    document.getElementById('btnEnviarMsg')?.addEventListener('click', enviarMensagemHandler);

    // Reply
    document.getElementById('btnResponderMsg')?.addEventListener('click', showReplyBox);
    document.getElementById('btnEnviarReply')?.addEventListener('click', enviarRespostaHandler);

    // Delete
    document.getElementById('btnExcluirMsg')?.addEventListener('click', excluirMensagemHandler);
}

// ---- Compose Modal ----
function openMsgModal() {
    const overlay = document.getElementById('msgModalOverlay');
    if (!overlay) return;
    document.getElementById('msgStepCompose').style.display = 'block';
    document.getElementById('msgStepSuccess').style.display = 'none';
    document.getElementById('msgDestinatario').value = 'Secretaria CIEIB';
    document.getElementById('msgAssunto').value = '';
    document.getElementById('msgConteudo').value = '';
    document.getElementById('msgCharCount').textContent = '0';
    document.getElementById('btnEnviarMsg').disabled = false;
    overlay.classList.add('active');
}

function closeMsgModal() {
    document.getElementById('msgModalOverlay')?.classList.remove('active');
}

async function enviarMensagemHandler() {
    const destinatario = document.getElementById('msgDestinatario').value;
    const assunto = document.getElementById('msgAssunto').value.trim();
    const conteudo = document.getElementById('msgConteudo').value.trim();

    if (!assunto || !conteudo) {
        showToast('Preencha o assunto e a mensagem', 'error');
        return;
    }

    const btn = document.getElementById('btnEnviarMsg');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const nova = await API.enviarMensagem(destinatario, assunto, conteudo);
        allMensagens.unshift(nova);
        renderMsgStats();
        renderMsgList();

        // Show success
        document.getElementById('msgStepCompose').style.display = 'none';
        document.getElementById('msgStepSuccess').style.display = 'block';
        document.getElementById('msgSuccessDest').textContent = destinatario;

        showToast('Mensagem enviada com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao enviar:', err);
        showToast('Erro ao enviar mensagem', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
    }
}

// ---- Detail View ----
async function openMsgDetail(id) {
    const overlay = document.getElementById('msgDetailOverlay');
    const body = document.getElementById('msgDetailBody');
    if (!overlay || !body) return;

    body.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#aaa;"></i><p style="margin-top:12px;color:#aaa;">Carregando...</p></div>';
    document.getElementById('msgReplyBox').style.display = 'none';
    overlay.classList.add('active');

    try {
        const msg = await API.getMensagem(id);
        currentMsgDetail = msg;

        // Update local array (mark as read)
        const idx = allMensagens.findIndex(m => m.id === id);
        if (idx >= 0) {
            allMensagens[idx].lida = true;
            renderMsgStats();
            renderMsgList();
        }

        const isEnviada = msg.tipo === 'enviada';
        const nome = isEnviada ? (msg.destinatario || 'Secretaria CIEIB') : (msg.remetente || 'CIEIB');
        const inicial = nome.charAt(0).toUpperCase();
        const avBg = isEnviada ? 'background:linear-gradient(135deg,#0f9d58,#0b7d45);' : 'background:linear-gradient(135deg,var(--primary),#2a5a8c);';
        const badgeClass = isEnviada ? 'msg-badge-enviada' : 'msg-badge-recebida';
        const badgeText = isEnviada ? 'Enviada' : 'Recebida';

        let responseHtml = '';
        if (msg.resposta) {
            responseHtml = `
                <div class="msg-det-response">
                    <h4><i class="fas fa-reply"></i> Resposta</h4>
                    <p>${msg.resposta}</p>
                    ${msg.respondido_em ? `<div class="msg-det-response-date">${formatDateTimeFull(msg.respondido_em)}</div>` : ''}
                </div>
            `;
        }

        // Check for reply thread
        const replies = allMensagens.filter(m => m.mensagem_pai_id === msg.id);
        let repliesHtml = '';
        if (replies.length > 0) {
            repliesHtml = replies.map(r => `
                <div class="msg-det-response">
                    <h4><i class="fas fa-reply"></i> ${r.tipo === 'enviada' ? 'Sua resposta' : 'Resposta recebida'}</h4>
                    <p>${r.conteudo}</p>
                    <div class="msg-det-response-date">${formatDateTimeFull(r.data_envio)}</div>
                </div>
            `).join('');
        }

        body.innerHTML = `
            <h2 class="msg-det-subject">${msg.assunto || '(sem assunto)'}</h2>
            <div class="msg-det-meta">
                <div class="msg-det-avatar" style="${avBg}">${inicial}</div>
                <div class="msg-det-info">
                    <div class="msg-det-sender">${isEnviada ? 'Para: ' : 'De: '}${nome}</div>
                    <div class="msg-det-date">${formatDateTimeFull(msg.data_envio)}</div>
                </div>
                <span class="msg-det-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="msg-det-content">${msg.conteudo || ''}</div>
            ${responseHtml}
            ${repliesHtml}
        `;
    } catch (err) {
        console.error('Erro ao carregar mensagem:', err);
        body.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;"><i class="fas fa-exclamation-circle" style="font-size:2rem;"></i><p style="margin-top:12px;">Erro ao carregar mensagem.</p></div>';
    }
}

function closeMsgDetail() {
    document.getElementById('msgDetailOverlay')?.classList.remove('active');
    currentMsgDetail = null;
}

// ---- Reply ----
function showReplyBox() {
    const box = document.getElementById('msgReplyBox');
    if (!box) return;
    box.style.display = 'block';
    document.getElementById('msgReplyContent').value = '';
    document.getElementById('msgReplyContent').focus();
}

function cancelReply() {
    document.getElementById('msgReplyBox').style.display = 'none';
}

async function enviarRespostaHandler() {
    if (!currentMsgDetail) return;
    const conteudo = document.getElementById('msgReplyContent').value.trim();
    if (!conteudo) {
        showToast('Escreva uma resposta', 'error');
        return;
    }

    const btn = document.getElementById('btnEnviarReply');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        const reply = await API.responderMensagem(currentMsgDetail.id, conteudo);
        allMensagens.unshift(reply);

        // Mark original as responded
        const idx = allMensagens.findIndex(m => m.id === currentMsgDetail.id);
        if (idx >= 0) allMensagens[idx].respondida = true;

        renderMsgStats();
        renderMsgList();

        showToast('Resposta enviada com sucesso!', 'success');
        closeMsgDetail();
    } catch (err) {
        console.error('Erro ao responder:', err);
        showToast('Erro ao enviar resposta', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Resposta';
    }
}

// ---- Delete ----
async function excluirMensagemHandler() {
    if (!currentMsgDetail) return;
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
        await API.excluirMensagem(currentMsgDetail.id);
        allMensagens = allMensagens.filter(m => m.id !== currentMsgDetail.id);
        renderMsgStats();
        renderMsgList();
        closeMsgDetail();
        showToast('Mensagem excluída', 'success');
    } catch (err) {
        console.error('Erro ao excluir:', err);
        showToast('Erro ao excluir mensagem', 'error');
    }
}

// ---- Mobile Nav Toggle ----
function initMobileNav() {
    const toggle = document.getElementById('painelMobileToggle');
    const nav = document.getElementById('painelNav');
    if (!toggle || !nav) return;

    let overlay = document.querySelector('.painel-nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'painel-nav-overlay';
        document.body.appendChild(overlay);
    }

    function openNav() {
        nav.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        toggle.innerHTML = '<i class="fas fa-times"></i>';
    }

    function closeNav() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }

    toggle.addEventListener('click', function() {
        nav.classList.contains('active') ? closeNav() : openNav();
    });

    overlay.addEventListener('click', closeNav);

    const dropdowns = nav.querySelectorAll('.pnav-dropdown');
    dropdowns.forEach(function(dropdown) {
        const link = dropdown.querySelector(':scope > .pnav-link');
        if (link) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeNav();
            dropdowns.forEach(function(d) { d.classList.remove('active'); });
        }
    });
}

// ---- Tabs ----
function initTabs() {
    const tabs = document.querySelectorAll('.ptab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('role', 'tabpanel');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            const panel = document.getElementById('tab-' + target);
            if (panel) {
                panel.classList.add('active');
                panel.setAttribute('aria-labelledby', this.id || '');
            }
        });
    });
}

// ---- Drag & Drop (com upload real via API) ----
function initDragDrop() {
    const dropArea = document.getElementById('dragDropArea');
    if (!dropArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('drag-over'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('drag-over'));
    });

    dropArea.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileUpload(files[0]);
    });

    const fileInput = document.getElementById('fotoUpload');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) handleFileUpload(this.files[0]);
        });
    }
}

async function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida.', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('A imagem deve ter no máximo 5MB.', 'error');
        return;
    }

    const dropArea = document.getElementById('dragDropArea');
    dropArea.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i><p>Enviando foto...</p>';

    try {
        const result = await API.uploadFoto(file);
        dropArea.innerHTML = `
            <img src="${result.foto_url}" style="max-width:100%;max-height:200px;border-radius:8px;">
            <p style="margin-top:10px;font-size:0.82rem;color:var(--primary);">${file.name}</p>
        `;

        // Atualizar foto no card lateral
        const fotoEl = document.getElementById('fotoMinistro');
        if (fotoEl) {
            fotoEl.innerHTML = `<img src="${result.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
        }

        showToast('Foto enviada com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao enviar foto:', err);
        dropArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt" style="font-size:2.2rem;color:var(--primary);"></i>
            <p>Arraste a foto ou clique para selecionar</p>
        `;
        showToast('Erro ao enviar foto. Tente novamente.', 'error');
    }
}

// ---- Date/Time ----
function initDateTime() {
    const el = document.getElementById('dataAtual');
    if (!el) return;

    function update() {
        const now = new Date();
        const options = { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        el.textContent = now.toLocaleDateString('pt-BR', options);
    }

    update();
    setInterval(update, 1000);
}

// ---- Salvar Dados (via API) ----
async function salvarDados() {
    const btn = document.querySelector('.phb-btn-save');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;

    try {
        const dados = {
            nome: getVal('campo-nome'),
            nome_social: getVal('campo-nomesocial'),
            doc_estrangeiro: getVal('campo-docestrangeiro'),
            cargo: getVal('campo-cargo'),
            conv_estadual: getVal('campo-conv'),
            sexo: getVal('campo-sexo'),
            data_nascimento: getVal('campo-nascimento'),
            pais_nascimento: getVal('campo-pais'),
            estado_nascimento: getVal('campo-estado'),
            cidade_nascimento: getVal('campo-cidade'),
            nacionalidade: getVal('campo-nacionalidade'),
            estado_civil: getVal('campo-estadocivil'),
            nome_conjuge: getVal('campo-conjuge'),
            data_nasc_conjuge: getVal('campo-nascconjuge'),
            pai: getVal('campo-pai'),
            mae: getVal('campo-mae'),
            rg: getVal('campo-rg'),
            orgao_expedidor: getVal('campo-orgao'),
            email: getVal('campo-email'),
            escolaridade: getVal('campo-escolaridade'),
            data_batismo: getVal('campo-databatismo'),
            data_ordenacao: getVal('campo-dataordenacao'),
            igreja_ordenacao: getVal('campo-igrejaordenacao'),
            cidade_ordenacao: getVal('campo-cidadeordenacao')
        };

        await API.updateMinistro(dados);
        showToast('Dados salvos com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao salvar:', err);
        showToast('Erro ao salvar dados. Tente novamente.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// ---- Toast Notification ----
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ================================================================
//  LAZY TABS — Cursos e Credencial
// ================================================================
let cursosLoaded = false;
let credencialLoaded = false;

function initLazyTabs() {
    const tabs = document.querySelectorAll('.ptab');
    tabs.forEach(tab => {
        tab.addEventListener('click', async function() {
            const target = this.getAttribute('data-tab');
            if (target === 'cursos' && !cursosLoaded) {
                try { await loadCursos(); cursosLoaded = true; }
                catch { cursosLoaded = false; }
            }
            if (target === 'credencial' && !credencialLoaded) {
                try { await loadCredencial(); await loadCarteirinhaStatus(); credencialLoaded = true; }
                catch { credencialLoaded = false; }
            }
        });
    });

    // Filtros de área de cursos
    document.querySelectorAll('.curso-filtro-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.curso-filtro-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const area = this.getAttribute('data-area');
            filterCursos(area);
        });
    });
}

// ================================================================
//  CURSOS / FACULDADES
// ================================================================
/* Mapa global de categorias → gradiente, ícone e cor do tag */
const catConfig = {
    'Teologia':        { bg: 'linear-gradient(135deg, #1a3a5c 0%, #2c5282 50%, #3b6cb5 100%)', icon: 'fa-book-bible',       tag: '#a3c4f3' },
    'Ministério':      { bg: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)', icon: 'fa-church',           tag: '#86efac' },
    'Capelania':       { bg: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a78bfa 100%)', icon: 'fa-hand-holding-heart', tag: '#ddd6fe' },
    'Jurídico':        { bg: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)', icon: 'fa-gavel',            tag: '#fde68a' },
    'Aconselhamento':  { bg: 'linear-gradient(135deg, #9d174d 0%, #be185d 50%, #ec4899 100%)', icon: 'fa-comments',         tag: '#fbcfe8' },
    'Liderança':       { bg: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #22d3ee 100%)', icon: 'fa-users-cog',        tag: '#a5f3fc' }
};
const defaultCat = { bg: 'linear-gradient(135deg, #374151, #6b7280)', icon: 'fa-graduation-cap', tag: '#d1d5db' };

let allCursos = [];

async function loadCursos() {
    try {
        const [cursos, matriculas, certificados] = await Promise.all([
            API.getCursos(),
            API.getMinhasMatriculas().catch(() => []),
            API.getMeusCertificados().catch(() => [])
        ]);

        allCursos = cursos;
        renderCursosCatalogo(cursos, matriculas);
        renderMeusCoarsos(matriculas);
        renderMeusCertificados(certificados);

    } catch (err) {
        console.error('Erro ao carregar cursos:', err);
        document.getElementById('cursosCatalogoGrid').innerHTML =
            '<p style="text-align:center;color:#999;padding:30px;">Erro ao carregar cursos. Tente novamente.</p>';
    }
}

function filterCursos(area) {
    const teologicas = ['Teologia'];
    const ministeriais = ['Ministério', 'Capelania', 'Jurídico', 'Aconselhamento', 'Liderança'];

    const cards = document.querySelectorAll('.curso-catalogo-card');
    cards.forEach(card => {
        const cat = card.getAttribute('data-area');
        if (area === 'todos') {
            card.style.display = '';
        } else if (area === 'teologica' && teologicas.includes(cat)) {
            card.style.display = '';
        } else if (area === 'ministerial' && ministeriais.includes(cat)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function renderCursosCatalogo(cursos, matriculas) {
    const grid = document.getElementById('cursosCatalogoGrid');
    if (!grid) return;

    if (cursos.length === 0) {
        grid.innerHTML = `<div style="text-align:center;padding:40px;color:#999;">
            <i class="fas fa-graduation-cap" style="font-size:2rem;"></i>
            <p style="margin-top:12px;">Nenhum curso disponível no momento.</p>
        </div>`;
        return;
    }

    const matriculaIds = matriculas.map(m => m.curso_id);

    grid.innerHTML = cursos.map(c => {
        const isMatriculado = matriculaIds.includes(c.id);
        const matricula = matriculas.find(m => m.curso_id === c.id);
        const cfg = catConfig[c.area] || defaultCat;

        return `
        <div class="curso-catalogo-card" data-area="${c.area}">
            <div class="curso-card-header" style="background: ${cfg.bg};">
                <i class="fas ${cfg.icon}"></i>
                <span class="curso-area-tag" style="background:${cfg.tag};color:#1a1a2e;"><i class="fas ${cfg.icon}"></i> ${c.area}</span>
            </div>
            <div class="curso-card-body">
                <h4>${c.titulo}</h4>
                <p class="curso-desc">${c.descricao || ''}</p>
                <div class="curso-meta">
                    ${c.nivel ? `<span><i class="fas fa-signal"></i> ${c.nivel}</span>` : ''}
                    ${c.carga_horaria ? `<span><i class="fas fa-clock"></i> ${c.carga_horaria}h</span>` : ''}
                    ${c.duracao ? `<span><i class="fas fa-calendar"></i> ${c.duracao}</span>` : ''}
                </div>
                ${c.certificado ? '<div class="curso-badge-cert"><i class="fas fa-certificate"></i> Com certificação</div>' : ''}
                ${isMatriculado
                    ? `<div class="curso-progresso-bar">
                        <div class="curso-progresso-fill" style="width:${matricula.progresso}%"></div>
                       </div>
                       <span class="curso-progresso-text">${matricula.progresso}% concluído</span>
                       <button class="btn-curso btn-curso-acessar" onclick="acessarCurso(${c.id})">
                           <i class="fas fa-play"></i> Continuar
                       </button>`
                    : `<button class="btn-curso btn-curso-matricular" onclick="matricularCurso(${c.id})">
                           <i class="fas fa-plus-circle"></i> Matricular-se
                       </button>`
                }
            </div>
        </div>`;
    }).join('');
}

function renderMeusCoarsos(matriculas) {
    const card = document.getElementById('meusCoursosCard');
    const grid = document.getElementById('meusCoursosGrid');
    if (!card || !grid) return;

    const ativos = matriculas.filter(m => m.status === 'ativo');
    if (ativos.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    grid.innerHTML = ativos.map(m => `
        <div class="meu-curso-item">
            <div class="meu-curso-info">
                <h5>${m.titulo}</h5>
                <span class="meu-curso-nivel">${['Teologia'].includes(m.area) ? '📖' : '🏥'} ${m.nivel || ''} · ${m.carga_horaria || 0}h</span>
            </div>
            <div class="meu-curso-progress">
                <div class="curso-progresso-bar">
                    <div class="curso-progresso-fill" style="width:${m.progresso}%"></div>
                </div>
                <span>${m.progresso}%</span>
            </div>
            <button class="btn-icon" onclick="acessarCurso(${m.curso_id})" title="Acessar">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `).join('');
}

function renderMeusCertificados(certificados) {
    const card = document.getElementById('meusCertificadosCard');
    const grid = document.getElementById('meusCertificadosGrid');
    if (!card || !grid) return;

    if (certificados.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    grid.innerHTML = certificados.map(c => `
        <div class="certificado-item">
            <div class="certificado-icon"><i class="fas fa-award"></i></div>
            <div class="certificado-info">
                <h5>${c.titulo}</h5>
                <span>${c.nivel || ''} · ${c.carga_horaria || 0}h · Emitido em ${formatDate(c.data_emissao)}</span>
            </div>
            <div class="certificado-code">${c.codigo_validacao}</div>
        </div>
    `).join('');
}

// ==================== MODAL MATRÍCULA ====================
let matCurrentCursoId = null;

function openMatModal() {
    document.getElementById('matOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMatModal() {
    document.getElementById('matOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function showMatStep(step) {
    ['matStepConfirm', 'matStepLoading', 'matStepSuccess', 'matStepError'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(step).style.display = '';
}

function matricularCurso(cursoId) {
    const curso = allCursos.find(c => c.id === cursoId);
    if (!curso) return;

    matCurrentCursoId = cursoId;
    const cfg = catConfig[curso.area] || defaultCat;

    // Populate modal header
    const header = document.getElementById('matHeader');
    header.style.background = cfg.bg;

    const headerIcon = document.getElementById('matHeaderIcon');
    headerIcon.innerHTML = `<i class="fas ${cfg.icon}"></i>`;

    const headerTag = document.getElementById('matHeaderTag');
    headerTag.style.background = cfg.tag;
    headerTag.style.color = '#1a1a2e';
    headerTag.innerHTML = `<i class="fas ${cfg.icon}"></i> ${curso.area}`;

    // Populate body
    document.getElementById('matTitulo').textContent = curso.titulo;
    document.getElementById('matDesc').textContent = curso.descricao || '';

    const nivelEl = document.getElementById('matNivel');
    if (curso.nivel) {
        nivelEl.style.display = '';
        nivelEl.querySelector('span').textContent = curso.nivel;
    } else {
        nivelEl.style.display = 'none';
    }

    const cargaEl = document.getElementById('matCarga');
    if (curso.carga_horaria) {
        cargaEl.style.display = '';
        cargaEl.querySelector('span').textContent = curso.carga_horaria + 'h de carga horária';
    } else {
        cargaEl.style.display = 'none';
    }

    document.getElementById('matCert').style.display = curso.certificado ? '' : 'none';

    // Show confirm step
    showMatStep('matStepConfirm');
    openMatModal();
}

async function confirmarMatricula() {
    if (!matCurrentCursoId) return;

    showMatStep('matStepLoading');

    try {
        await API.matricularCurso(matCurrentCursoId);

        const curso = allCursos.find(c => c.id === matCurrentCursoId);
        document.getElementById('matSuccessMsg').textContent =
            `Você foi matriculado no curso "${curso ? curso.titulo : ''}" com sucesso. Bons estudos!`;

        showMatStep('matStepSuccess');

        // Refresh cursos list in background
        cursosLoaded = false;

    } catch (err) {
        document.getElementById('matErrorMsg').textContent =
            err.message || 'Ocorreu um erro ao processar sua matrícula. Tente novamente.';
        showMatStep('matStepError');
    }
}

// Wire modal events after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Close
    document.getElementById('matClose')?.addEventListener('click', closeMatModal);
    document.getElementById('matBtnCancel')?.addEventListener('click', closeMatModal);
    document.getElementById('matBtnClose')?.addEventListener('click', () => {
        closeMatModal();
        loadCursos();
    });

    // Confirm
    document.getElementById('matBtnConfirm')?.addEventListener('click', confirmarMatricula);

    // Access course after success
    document.getElementById('matBtnAccess')?.addEventListener('click', () => {
        closeMatModal();
        loadCursos().then(() => {
            if (matCurrentCursoId) acessarCurso(matCurrentCursoId);
        });
    });

    // Error retry
    document.getElementById('matBtnRetry')?.addEventListener('click', confirmarMatricula);
    document.getElementById('matBtnErrorClose')?.addEventListener('click', closeMatModal);

    // Overlay click to close
    document.getElementById('matOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeMatModal();
    });
});

async function acessarCurso(cursoId) {
    try {
        const data = await API.getCursoAulas(cursoId);
        renderAulasCurso(cursoId, data);
    } catch (err) {
        showToast(err.message || 'Erro ao acessar curso', 'error');
    }
}

function renderAulasCurso(cursoId, data) {
    const grid = document.getElementById('cursosCatalogoGrid');
    if (!grid) return;

    const { modulos, matricula_id } = data;

    let html = `
        <div class="curso-aulas-voltar">
            <button class="phb-btn phb-btn-secondary" onclick="loadCursos();cursosLoaded=true;">
                <i class="fas fa-arrow-left"></i> Voltar ao catálogo
            </button>
        </div>
        <div class="curso-modulos-grid">
    `;

    modulos.forEach((mod, idx) => {
        const totalAulas = (mod.aulas || []).length;
        const concluidas = (mod.aulas || []).filter(a => a.concluida).length;
        const modIcons = ['fa-book-open', 'fa-lightbulb', 'fa-clipboard-check', 'fa-award', 'fa-flask', 'fa-star'];
        const modIcon = modIcons[idx % modIcons.length];

        html += `<div class="modulo-section">
            <div class="modulo-header">
                <div class="modulo-icon"><i class="fas ${modIcon}"></i></div>
                <div class="modulo-header-text">
                    <h4>${mod.titulo}</h4>
                    ${mod.descricao ? `<div class="modulo-desc">${mod.descricao}</div>` : ''}
                </div>
            </div>
            <div class="modulo-aulas">`;

        (mod.aulas || []).forEach(aula => {
            const tipoIcon = aula.tipo === 'video' ? 'fa-play-circle' : aula.tipo === 'pdf' ? 'fa-file-pdf' : 'fa-file-alt';
            const tipoLabel = aula.tipo === 'video' ? 'Vídeo' : aula.tipo === 'pdf' ? 'PDF' : 'Texto';
            html += `
                <div class="aula-item ${aula.concluida ? 'aula-concluida' : ''}">
                    <div class="aula-check">
                        ${aula.concluida
                            ? '<i class="fas fa-check"></i>'
                            : '<i class="far fa-circle" style="color:#ccc;"></i>'
                        }
                    </div>
                    <div class="aula-info">
                        <span class="aula-tipo"><i class="fas ${tipoIcon}"></i> ${tipoLabel}</span>
                        <span class="aula-titulo">${aula.titulo}</span>
                        ${aula.duracao_minutos ? `<span class="aula-duracao"><i class="far fa-clock"></i> ${aula.duracao_minutos} min</span>` : ''}
                    </div>
                    ${!aula.concluida
                        ? `<button class="btn-aula-concluir" onclick="concluirAula(${aula.id}, ${cursoId})">
                               <i class="fas fa-check"></i> Concluir
                           </button>`
                        : '<span class="aula-status-ok"><i class="fas fa-check-circle"></i> Concluído</span>'
                    }
                </div>`;
        });

        html += `</div></div>`;
    });

    html += '</div>';

    // Esconder filtros e benefícios temporariamente
    const filtros = document.querySelector('.cursos-filtros');
    const beneficios = document.querySelector('.cursos-beneficios');
    if (filtros) filtros.style.display = 'none';
    if (beneficios) beneficios.style.display = 'none';

    grid.innerHTML = html;
}

async function concluirAula(aulaId, cursoId) {
    try {
        const result = await API.concluirAula(aulaId);
        showToast(`Aula concluída! Progresso: ${result.progresso}%`, 'success');
        acessarCurso(cursoId);
    } catch (err) {
        showToast(err.message || 'Erro ao concluir aula', 'error');
    }
}

// ================================================================
//  CREDENCIAL DIGITAL
// ================================================================
async function loadCredencial() {
    try {
        const cred = await API.getCredencial();
        fillCredencial(cred);
    } catch (err) {
        console.error('Erro ao carregar credencial:', err);
        showToast('Erro ao carregar credencial', 'error');
    }
}

function fillCredencial(cred) {
    // Nome
    const nome = document.getElementById('credNome');
    if (nome) nome.textContent = cred.nome || '---';

    // Cargo
    const cargo = document.getElementById('credCargo');
    if (cargo) cargo.textContent = cred.cargo || '---';

    // Registro
    const registro = document.getElementById('credRegistro');
    if (registro) registro.textContent = cred.registro || '---';

    // Convenção
    const conv = document.getElementById('credConvencao');
    if (conv) conv.textContent = cred.convencao || '---';

    // Filiação
    const filiacao = document.getElementById('credFiliacao');
    if (filiacao) filiacao.textContent = cred.data_registro
        ? new Date(cred.data_registro).toLocaleDateString('pt-BR') : '---';

    // Validade
    const validade = document.getElementById('credValidade');
    if (validade) {
        const dataVal = cred.data_validade ? new Date(cred.data_validade) : null;
        validade.textContent = dataVal ? dataVal.toLocaleDateString('pt-BR') : '---';

        if (dataVal && dataVal < new Date()) {
            validade.style.color = '#dc2626';
            validade.textContent += ' (EXPIRADA)';
        } else {
            validade.style.color = '#059669';
        }
    }

    // Código
    const codigoEl = document.getElementById('credencialCodigo');
    if (codigoEl) codigoEl.textContent = cred.codigo || '---';

    // Foto
    const foto = document.getElementById('credencialFoto');
    if (foto && cred.foto_url) {
        foto.innerHTML = `<img src="${cred.foto_url}" alt="${cred.nome}" style="width:100%;height:100%;object-fit:cover;">`;
    }

    // Status
    const statusEl = document.getElementById('credencialStatus');
    if (statusEl) {
        const ativo = cred.status === 'ATIVO' && cred.data_validade && new Date(cred.data_validade) >= new Date();
        statusEl.innerHTML = ativo
            ? '<i class="fas fa-check-circle"></i><span>ATIVA</span>'
            : '<i class="fas fa-times-circle"></i><span>INATIVA</span>';
        statusEl.style.color = ativo ? '#059669' : '#dc2626';
    }

    // QR Code
    const qrEl = document.getElementById('credencialQR');
    if (qrEl && cred.codigo && typeof QRCode !== 'undefined') {
        const verificarUrl = window.location.origin + '/verificar-credencial.html?code=' + encodeURIComponent(cred.codigo);
        qrEl.innerHTML = '';
        QRCode.toCanvas(document.createElement('canvas'), verificarUrl, {
            width: 120,
            margin: 1,
            color: { dark: '#1a3a5c', light: '#ffffff' }
        }, function(error, canvas) {
            if (!error) {
                canvas.style.borderRadius = '8px';
                qrEl.appendChild(canvas);
            }
        });
    }

    // Link de verificação (preferir domínio oficial)
    const urlInput = document.getElementById('credVerificarUrl');
    if (urlInput && cred.codigo) {
        const origin = window.location.hostname === '147.93.69.162'
            ? 'https://cieib.ong.br'
            : window.location.origin;
        urlInput.value = origin + '/verificar-credencial.html?code=' + cred.codigo;
    }
}

function copiarLinkVerificacao() {
    const input = document.getElementById('credVerificarUrl');
    if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
            showToast('Link copiado!', 'success');
        }).catch(() => {
            document.execCommand('copy');
            showToast('Link copiado!', 'success');
        });
    }
}

async function renovarCredencial() {
    if (!confirm('Deseja solicitar a renovação da sua credencial ministerial?')) return;

    try {
        await API.renovarCredencial();
        showToast('Credencial renovada com sucesso!', 'success');
        credencialLoaded = false;
        loadCredencial();
        credencialLoaded = true;
    } catch (err) {
        showToast(err.message || 'Erro ao renovar credencial', 'error');
    }
}

function baixarCredencial() {
    const card = document.getElementById('credencialCard');
    if (!card) return;

    // Usar html2canvas se disponível, senão captura simples
    showToast('Preparando download da credencial...', 'info');

    // Fallback: screenshot via window.print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Credencial CIEIB</title>
        <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; font-family: 'Open Sans', Arial, sans-serif; }
            @media print { body { background: white; } }
        </style>
        </head><body>${card.outerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
}

function compartilharCredencial() {
    const url = document.getElementById('credVerificarUrl')?.value;
    if (navigator.share && url) {
        navigator.share({
            title: 'Credencial Ministerial CIEIB',
            text: 'Verifique minha credencial ministerial na CIEIB',
            url: url
        }).catch(() => {});
    } else {
        copiarLinkVerificacao();
    }
}

// ================================================================
//  PAGAMENTO — Modal e lógica
// ================================================================
let pgtoContaAtual = null;

function abrirModalPagamento(contaId, servico, valor, vencimento) {
    pgtoContaAtual = { id: contaId, servico, valor, vencimento };

    document.getElementById('pgtoServico').textContent = servico || '---';
    document.getElementById('pgtoValor').textContent = `R$ ${parseFloat(valor).toFixed(2)}`;
    document.getElementById('pgtoVencimento').textContent = vencimento ? formatDate(vencimento) : '---';
    document.getElementById('pgtoModalTitle').textContent = `Pagamento — ${servico}`;

    // Reset state
    document.getElementById('pgtoEscolha').style.display = '';
    document.getElementById('pgtoBoletoStep').style.display = 'none';
    document.getElementById('pgtoPixStep').style.display = 'none';
    document.getElementById('pgtoSucessoStep').style.display = 'none';
    document.getElementById('pgtoContaInfo').style.display = '';
    removerComprovante();

    document.getElementById('pgtoModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModalPagamento() {
    document.getElementById('pgtoModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
    pgtoContaAtual = null;
}

function escolherFormaPagamento(forma) {
    document.getElementById('pgtoEscolha').style.display = 'none';

    if (forma === 'boleto') {
        document.getElementById('pgtoBoletoStep').style.display = '';
    } else {
        document.getElementById('pgtoPixStep').style.display = '';
    }
}

function voltarEscolhaPagamento() {
    document.getElementById('pgtoBoletoStep').style.display = 'none';
    document.getElementById('pgtoPixStep').style.display = 'none';
    document.getElementById('pgtoEscolha').style.display = '';
}

async function solicitarBoleto() {
    if (!pgtoContaAtual) return;

    try {
        const result = await API.solicitarBoleto(pgtoContaAtual.id);

        // Abrir link do Asaas
        window.open('https://www.asaas.com/c/opw88e6g4dn9xckp', '_blank');

        // Mostrar sucesso
        document.getElementById('pgtoBoletoStep').style.display = 'none';
        document.getElementById('pgtoContaInfo').style.display = 'none';
        document.getElementById('pgtoSucessoStep').style.display = '';
        document.getElementById('pgtoSucessoTitle').textContent = 'Boleto Solicitado!';
        document.getElementById('pgtoSucessoMsg').textContent = 'Você foi redirecionado para a página de pagamento. Após pagar, o status será atualizado automaticamente.';

        showToast('Boleto solicitado! Página de pagamento aberta.', 'success');

        // Reload historico
        reloadHistorico();
    } catch (err) {
        showToast(err.message || 'Erro ao solicitar boleto', 'error');
    }
}

function previewComprovante(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById('pgtoPixPreview');
    const content = document.getElementById('pgtoPixPreviewContent');
    const dropArea = document.getElementById('pgtoPixDrop');
    const btnEnviar = document.getElementById('pgtoEnviarPix');

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            content.innerHTML = `<img src="${e.target.result}" alt="Comprovante" style="max-width:100%;max-height:200px;border-radius:8px;">
                <p class="pgto-pix-filename"><i class="fas fa-file-image"></i> ${file.name}</p>`;
        };
        reader.readAsDataURL(file);
    } else {
        content.innerHTML = `<div class="pgto-pix-file-icon"><i class="fas fa-file-pdf"></i></div>
            <p class="pgto-pix-filename">${file.name}</p>`;
    }

    dropArea.style.display = 'none';
    preview.style.display = '';
    btnEnviar.disabled = false;
}

function removerComprovante() {
    const input = document.getElementById('pgtoPixFile');
    if (input) input.value = '';

    document.getElementById('pgtoPixDrop').style.display = '';
    document.getElementById('pgtoPixPreview').style.display = 'none';
    document.getElementById('pgtoPixPreviewContent').innerHTML = '';
    document.getElementById('pgtoEnviarPix').disabled = true;
}

async function enviarComprovantePix() {
    if (!pgtoContaAtual) return;
    const file = document.getElementById('pgtoPixFile').files[0];
    if (!file) return showToast('Selecione o comprovante', 'error');

    const btn = document.getElementById('pgtoEnviarPix');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    try {
        await API.enviarComprovantePix(pgtoContaAtual.id, file);

        // Mostrar sucesso
        document.getElementById('pgtoPixStep').style.display = 'none';
        document.getElementById('pgtoContaInfo').style.display = 'none';
        document.getElementById('pgtoSucessoStep').style.display = '';
        document.getElementById('pgtoSucessoTitle').textContent = 'Comprovante Enviado!';
        document.getElementById('pgtoSucessoMsg').textContent = 'Seu comprovante PIX foi recebido. A confirmação do pagamento será feita pela administração.';

        showToast('Comprovante PIX enviado com sucesso!', 'success');

        // Reload historico
        reloadHistorico();
    } catch (err) {
        showToast(err.message || 'Erro ao enviar comprovante', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Comprovante';
    }
}

async function reloadHistorico() {
    try {
        const contasData = await API.getContas().catch(() => ({ contas: [], totais: {} }));
        fillHistorico(contasData);
        fillContasResumo(contasData);
    } catch (e) { /* silently fail */ }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.id === 'pgtoModalOverlay') fecharModalPagamento();
});

// ================================================================
//  CARTEIRINHA FÍSICA
// ================================================================
async function loadCarteirinhaStatus() {
    try {
        const data = await API.getCarteirinhaStatus();
        const statusBox = document.getElementById('carteirinhaStatusBox');
        const form = document.getElementById('carteirinhaForm');

        if (data.tem_solicitacao) {
            const s = data.solicitacao;
            statusBox.style.display = '';

            const statusColors = {
                'PENDENTE': '#f59e0b',
                'PAGO': '#3b82f6',
                'PRODUZINDO': '#8b5cf6',
                'ENVIADO': '#10b981',
                'ENTREGUE': '#059669'
            };

            document.getElementById('carteirinhaStatusDetail').innerHTML = `
                <div class="carteirinha-status-item">
                    <span>Status:</span>
                    <strong style="color:${statusColors[s.status] || '#6b7280'}">${s.status}</strong>
                </div>
                <div class="carteirinha-status-item">
                    <span>Solicitado em:</span>
                    <strong>${new Date(s.created_at).toLocaleDateString('pt-BR')}</strong>
                </div>
                <div class="carteirinha-status-item">
                    <span>Endereço:</span>
                    <strong>${s.endereco_entrega}</strong>
                </div>
                ${s.status === 'PENDENTE' ? '<p class="carteirinha-pendente-aviso"><i class="fas fa-exclamation-triangle"></i> Pagamento pendente. <a href="https://www.asaas.com/c/rgza79nqnp1os846" target="_blank">Clique aqui para pagar</a></p>' : ''}
            `;

            // Se PENDENTE, ainda mostra o form mas com aviso
            if (s.status !== 'PENDENTE') {
                form.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Erro ao carregar status carteirinha:', err);
    }
}

async function solicitarCarteirinhaFisica() {
    const endereco = document.getElementById('carteirinha-endereco')?.value?.trim();
    const telefone = document.getElementById('carteirinha-telefone')?.value?.trim();
    const obs = document.getElementById('carteirinha-obs')?.value?.trim();

    if (!endereco) {
        showToast('Preencha o endereço de entrega', 'error');
        return;
    }

    if (!confirm('Confirma a solicitação da carteirinha física por R$ 25,00?\nVocê será redirecionado para a página de pagamento.')) return;

    try {
        const result = await API.solicitarCarteirinhaFisica({
            endereco_entrega: endereco,
            telefone: telefone || null,
            observacao: obs || null
        });

        showToast('Solicitação registrada! Redirecionando para pagamento...', 'success');

        // Abrir link de pagamento
        window.open('https://www.asaas.com/c/rgza79nqnp1os846', '_blank');

        // Reload status
        loadCarteirinhaStatus();
    } catch (err) {
        showToast(err.message || 'Erro ao solicitar carteirinha', 'error');
    }
}

// ================================================================
//  NOTIFICAÇÕES — Sistema Completo (dados reais)
// ================================================================
let _notifCache = [];
let _notifInterval = null;

async function loadNotificacoes() {
    try {
        const notifs = await API.getNotificacoes().catch(() => []);
        // Alertas dinâmicos já vêm com lida = true/false do servidor
        _notifCache = notifs;
        const naoLidas = notifs.filter(n => !n.lida).length;

        // Atualizar badge
        const badge = document.querySelector('.notif-badge');
        if (badge) {
            badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
            badge.style.display = naoLidas === 0 ? 'none' : 'flex';
        }

        // Setup click handler (apenas 1x)
        const notifBtn = document.querySelector('.painel-notif');
        if (notifBtn && !notifBtn._notifBound) {
            notifBtn._notifBound = true;
            notifBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNotifPanel();
            });
        }

        // Atualizar painel se estiver aberto
        const panel = document.getElementById('notifPanel');
        if (panel && panel.classList.contains('active')) {
            renderNotifPanelContent(panel);
        }

        // Auto-polling a cada 60s
        if (!_notifInterval) {
            _notifInterval = setInterval(loadNotificacoes, 60000);
        }
    } catch (err) {
        console.error('Erro ao carregar notificações:', err);
    }
}

function notifTimeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getNotifIcon(tipo) {
    const map = {
        success: 'fa-check-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle',
        alerta: 'fa-exclamation-circle', error: 'fa-times-circle', curso: 'fa-graduation-cap',
        credencial: 'fa-id-badge', evento: 'fa-calendar-check', boleto: 'fa-barcode',
        financeiro: 'fa-money-bill-wave', suporte: 'fa-headset', mensagem: 'fa-envelope'
    };
    return map[tipo] || 'fa-bell';
}

function cleanNotifTitle(titulo) {
    // Remove emojis do título (ícones já são via FontAwesome)
    return (titulo || 'Notificação').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}]|[⚠️🔴📅💰💳🪪💬📋]/gu, '').trim();
}

function renderNotifPanelContent(panel) {
    const notifs = _notifCache;
    const naoLidas = notifs.filter(n => !n.lida).length;

    let html = `<div class="notif-panel-header">
        <h4><i class="fas fa-bell"></i> Notificações${naoLidas > 0 ? ` <span style="background:#ef4444;color:#fff;font-size:0.65rem;padding:2px 7px;border-radius:10px;margin-left:6px;">${naoLidas}</span>` : ''}</h4>
        ${naoLidas > 0 ? '<button onclick="marcarTodasLidas()">Marcar todas como lidas</button>' : ''}
    </div><div class="notif-panel-body">`;

    if (notifs.length === 0) {
        html += `<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Nenhuma notificação</p></div>`;
    } else {
        notifs.slice(0, 20).forEach(n => {
            const icon = getNotifIcon(n.tipo);
            const tipoClass = n.tipo || 'info';
            const titulo = cleanNotifTitle(n.titulo);
            const keyAttr = n._key ? ` data-key="${n._key}"` : '';
            html += `
            <div class="notif-item${n.lida ? '' : ' nao-lida'}" onclick="marcarNotifLida(${n.id}, this)"${keyAttr}>
                <div class="notif-icon tipo-${tipoClass}"><i class="fas ${icon}"></i></div>
                <div class="notif-content">
                    <h5>${titulo}</h5>
                    <p>${n.mensagem || ''}</p>
                </div>
                <span class="notif-time">${notifTimeAgo(n.created_at)}</span>
            </div>`;
        });
    }

    html += '</div>';
    panel.innerHTML = html;
}

function toggleNotifPanel() {
    let panel = document.getElementById('notifPanel');

    // Se já existe e está aberto, fechar
    if (panel && panel.classList.contains('active')) {
        panel.classList.remove('active');
        setTimeout(() => panel.remove(), 200);
        return;
    }

    // Se existe mas não está ativo, remover
    if (panel) panel.remove();

    // Criar painel
    panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.className = 'notif-panel';
    renderNotifPanelContent(panel);

    // Posicionar relativo ao botão
    const notifBtn = document.querySelector('.painel-notif');
    if (notifBtn) {
        notifBtn.parentElement.style.position = 'relative';
        notifBtn.parentElement.appendChild(panel);
    } else {
        document.querySelector('.painel-topnav').appendChild(panel);
    }

    // Ativar com pequeno delay para animação
    requestAnimationFrame(() => {
        panel.classList.add('active');
    });

    // Fechar ao clicar fora
    setTimeout(() => {
        const handler = (e) => {
            if (!panel.contains(e.target) && !e.target.closest('.painel-notif')) {
                panel.classList.remove('active');
                setTimeout(() => { if (panel.parentElement) panel.remove(); }, 200);
                document.removeEventListener('click', handler);
            }
        };
        document.addEventListener('click', handler);
    }, 50);
}

async function marcarNotifLida(id, el) {
    try {
        const n = _notifCache.find(x => x.id === id);
        const alertaKey = el ? el.getAttribute('data-key') : (n ? n._key : null);

        if (id < 0) {
            // Alerta dinâmico — persistir dispensação no servidor
            await API.marcarNotificacaoLida(id, alertaKey);
            if (n) n.lida = true;
        } else {
            await API.marcarNotificacaoLida(id);
            if (n) n.lida = true;
        }

        // Navegar ao link se existir
        if (n && n.link) {
            if (n.link.startsWith('#')) {
                const tabName = n.link.replace('#', '');
                const tabBtn = document.querySelector(`.ptab[data-tab="${tabName}"]`);
                if (tabBtn) tabBtn.click();
            } else {
                window.location.href = n.link;
            }
        }

        // Atualizar badge
        const naoLidas = _notifCache.filter(x => !x.lida).length;
        const badge = document.querySelector('.notif-badge');
        if (badge) {
            badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
            badge.style.display = naoLidas === 0 ? 'none' : 'flex';
        }
        // Atualizar painel
        const panel = document.getElementById('notifPanel');
        if (panel) renderNotifPanelContent(panel);
    } catch (err) {
        console.error('Erro ao marcar notificação:', err);
    }
}

async function marcarTodasLidas() {
    try {
        await API.marcarTodasNotificacoesLidas();
        // Marcar todas no cache local
        _notifCache.forEach(n => { n.lida = true; });
        const badge = document.querySelector('.notif-badge');
        if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
        const panel = document.getElementById('notifPanel');
        if (panel) renderNotifPanelContent(panel);
        showToast('Todas as notificações marcadas como lidas', 'success');
    } catch (err) {
        console.error('Erro ao marcar todas:', err);
    }
}

// ================================================================
//  SEGURANÇA — Alterar Senha / Dados de Acesso
// ================================================================

// ---- Helpers ----
function openSecModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSecModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}

function formatPhone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function formatCpfDisplay(cpf) {
    const d = (cpf || '').replace(/\D/g, '');
    if (d.length !== 11) return cpf || '---';
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

// ---- Password Strength ----
function checkPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { cls: 'weak', text: 'Fraca' };
    if (score === 2) return { cls: 'fair', text: 'Razoável' };
    if (score === 3) return { cls: 'good', text: 'Boa' };
    return { cls: 'strong', text: 'Forte' };
}

// ---- Init Security Events ----
document.addEventListener('DOMContentLoaded', () => {
    // Open modals
    document.getElementById('btnAlterarSenha')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('formAlterarSenha')?.reset();
        document.getElementById('senhaStrengthFill').className = 'sec-strength-fill';
        document.getElementById('senhaStrengthText').textContent = 'Força da senha';
        document.getElementById('senhaMatchMsg').textContent = '';
        document.getElementById('senhaMatchMsg').className = 'sec-match-msg';
        openSecModal('senhaOverlay');
    });

    document.getElementById('btnDadosAcesso')?.addEventListener('click', (e) => {
        e.preventDefault();
        loadDadosAcesso();
        openSecModal('acessoOverlay');
    });

    // Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeSecModal(btn.getAttribute('data-close')));
    });

    // Overlay click to close
    document.querySelectorAll('.sec-overlay').forEach(ov => {
        ov.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeSecModal(ov.id);
        });
    });

    // Toggle password visibility
    document.querySelectorAll('.sec-eye').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.getAttribute('data-target'));
            if (!input) return;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    });

    // Password strength indicator
    document.getElementById('novaSenha')?.addEventListener('input', (e) => {
        const val = e.target.value;
        const fill = document.getElementById('senhaStrengthFill');
        const text = document.getElementById('senhaStrengthText');
        if (!val) {
            fill.className = 'sec-strength-fill';
            text.textContent = 'Força da senha';
            return;
        }
        const s = checkPasswordStrength(val);
        fill.className = `sec-strength-fill ${s.cls}`;
        text.textContent = s.text;

        // Also check match
        checkSenhaMatch();
    });

    // Confirm password match
    document.getElementById('confirmarSenha')?.addEventListener('input', checkSenhaMatch);

    // Phone formatting
    ['acessoTelefone', 'acessoWhatsapp'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            e.target.value = formatPhone(e.target.value);
        });
    });

    // ---- Form: Alterar Senha ----
    document.getElementById('formAlterarSenha')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmar = document.getElementById('confirmarSenha').value;

        if (novaSenha.length < 6) {
            showToast('A nova senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }

        if (novaSenha !== confirmar) {
            showToast('As senhas não coincidem', 'error');
            return;
        }

        const btn = document.getElementById('btnSalvarSenha');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            await API.alterarSenha(senhaAtual, novaSenha);
            showToast('Senha alterada com sucesso!', 'success');
            closeSecModal('senhaOverlay');
        } catch (err) {
            showToast(err.message || 'Erro ao alterar senha', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });

    // ---- Form: Dados de Acesso ----
    document.getElementById('formDadosAcesso')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('acessoEmail').value.trim();
        const telefone = document.getElementById('acessoTelefone').value.trim();
        const whatsapp = document.getElementById('acessoWhatsapp').value.trim();

        const btn = document.getElementById('btnSalvarAcesso');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            await API.atualizarDadosAcesso({ email, telefone, whatsapp });
            showToast('Dados de acesso atualizados com sucesso!', 'success');
            closeSecModal('acessoOverlay');
        } catch (err) {
            showToast(err.message || 'Erro ao atualizar dados de acesso', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
});

function checkSenhaMatch() {
    const nova = document.getElementById('novaSenha')?.value || '';
    const confirmar = document.getElementById('confirmarSenha')?.value || '';
    const msg = document.getElementById('senhaMatchMsg');
    if (!msg) return;

    if (!confirmar) {
        msg.textContent = '';
        msg.className = 'sec-match-msg';
        return;
    }

    if (nova === confirmar) {
        msg.textContent = '✓ Senhas coincidem';
        msg.className = 'sec-match-msg match';
    } else {
        msg.textContent = '✗ Senhas não coincidem';
        msg.className = 'sec-match-msg no-match';
    }
}

async function loadDadosAcesso() {
    try {
        const m = await API.getMinistro();
        document.getElementById('acessoCpf').textContent = formatCpfDisplay(m.cpf);
        document.getElementById('acessoEmail').value = m.email || '';
        document.getElementById('acessoTelefone').value = m.telefone ? formatPhone(m.telefone) : '';
        document.getElementById('acessoWhatsapp').value = m.whatsapp ? formatPhone(m.whatsapp) : '';
    } catch (err) {
        showToast('Erro ao carregar dados de acesso', 'error');
    }
}

// ================================================================
//  SUPORTE — Central de Chamados
// ================================================================

const supCatLabels = {
    duvida: '💬 Dúvida Geral',
    financeiro: '💰 Financeiro',
    curso: '📚 Cursos',
    credencial: '🪪 Credencial',
    cadastro: '📝 Cadastro',
    tecnico: '🔧 Técnico',
    sugestao: '💡 Sugestão',
    outro: '📌 Outro'
};

const supStatusLabels = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    respondido: 'Respondido',
    fechado: 'Fechado'
};

function openSupModal() {
    document.getElementById('supOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSupModal() {
    document.getElementById('supOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function showSupTab(tabName) {
    document.querySelectorAll('.sup-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-sup-tab') === tabName));
    document.getElementById('supTabNovo').classList.toggle('active', tabName === 'novo');
    document.getElementById('supTabHistorico').classList.toggle('active', tabName === 'historico');

    if (tabName === 'historico') loadMeusChamados();
}

function formatSupDate(dateStr) {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderTickets(tickets) {
    const list = document.getElementById('supTicketsList');
    const empty = document.getElementById('supTicketsEmpty');
    const loading = document.getElementById('supTicketsLoading');

    loading.style.display = 'none';

    if (!tickets || tickets.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = tickets.map(t => `
        <div class="sup-ticket">
            <div class="sup-ticket-header">
                <h4 class="sup-ticket-title">${t.assunto}</h4>
                <span class="sup-ticket-status ${t.status}">${supStatusLabels[t.status] || t.status}</span>
            </div>
            <div class="sup-ticket-meta">
                <span><i class="fas fa-hashtag"></i> ${t.protocolo}</span>
                <span><i class="fas fa-tag"></i> ${supCatLabels[t.categoria] || t.categoria}</span>
                <span class="sup-ticket-priority ${t.prioridade}">${(t.prioridade || 'normal').charAt(0).toUpperCase() + (t.prioridade || 'normal').slice(1)}</span>
                <span><i class="fas fa-clock"></i> ${formatSupDate(t.created_at)}</span>
            </div>
            <p class="sup-ticket-msg">${t.mensagem}</p>
            ${t.resposta ? `
                <div class="sup-ticket-reply">
                    <div class="sup-ticket-reply-label"><i class="fas fa-reply"></i> Resposta${t.respondido_por ? ' — ' + t.respondido_por : ''}</div>
                    <p class="sup-ticket-reply-text">${t.resposta}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function loadMeusChamados() {
    const loading = document.getElementById('supTicketsLoading');
    const empty = document.getElementById('supTicketsEmpty');
    const list = document.getElementById('supTicketsList');

    loading.style.display = 'block';
    empty.style.display = 'none';
    list.innerHTML = '';

    try {
        const tickets = await API.getMeusChamados();
        renderTickets(tickets);
    } catch (err) {
        loading.style.display = 'none';
        empty.style.display = 'block';
    }
}

function showSupSuccess(protocolo) {
    const formTab = document.getElementById('supTabNovo');
    formTab.innerHTML = `
        <div class="sup-success">
            <div class="sup-success-icon"><i class="fas fa-check"></i></div>
            <h3>Chamado Enviado com Sucesso!</h3>
            <p>Seu chamado foi registrado. Guarde o número do protocolo:</p>
            <div class="sup-protocolo-display">${protocolo}</div>
            <p>Acompanhe o status na aba <strong>"Meus Chamados"</strong>.</p>
            <button type="button" class="sup-btn sup-btn-primary" onclick="resetSupForm()">
                <i class="fas fa-plus-circle"></i> Novo Chamado
            </button>
        </div>
    `;
}

function resetSupForm() {
    const formTab = document.getElementById('supTabNovo');
    formTab.innerHTML = `
        <form id="formSuporte" class="sup-form">
            <div class="sup-field">
                <label for="supCategoria"><i class="fas fa-tag"></i> Categoria</label>
                <select id="supCategoria" required>
                    <option value="">Selecione uma categoria...</option>
                    <option value="duvida">💬 Dúvida Geral</option>
                    <option value="financeiro">💰 Financeiro / Pagamentos</option>
                    <option value="curso">📚 Cursos / Matrículas</option>
                    <option value="credencial">🪪 Credencial Digital</option>
                    <option value="cadastro">📝 Cadastro / Dados Pessoais</option>
                    <option value="tecnico">🔧 Problema Técnico</option>
                    <option value="sugestao">💡 Sugestão / Melhoria</option>
                    <option value="outro">📌 Outro Assunto</option>
                </select>
            </div>
            <div class="sup-field">
                <label for="supAssunto"><i class="fas fa-heading"></i> Assunto</label>
                <input type="text" id="supAssunto" placeholder="Descreva brevemente o assunto" required maxlength="200">
            </div>
            <div class="sup-field">
                <label for="supMensagem"><i class="fas fa-comment-dots"></i> Mensagem</label>
                <textarea id="supMensagem" rows="4" placeholder="Descreva detalhadamente sua dúvida ou solicitação..." required maxlength="2000"></textarea>
                <span class="sup-char-count"><span id="supCharCount">0</span>/2000</span>
            </div>
            <div class="sup-field">
                <label for="supPrioridade"><i class="fas fa-exclamation-circle"></i> Prioridade</label>
                <div class="sup-priority-group">
                    <label class="sup-priority-opt">
                        <input type="radio" name="prioridade" value="baixa">
                        <span class="sup-priority-badge baixa"><i class="fas fa-arrow-down"></i> Baixa</span>
                    </label>
                    <label class="sup-priority-opt">
                        <input type="radio" name="prioridade" value="normal" checked>
                        <span class="sup-priority-badge normal"><i class="fas fa-minus"></i> Normal</span>
                    </label>
                    <label class="sup-priority-opt">
                        <input type="radio" name="prioridade" value="alta">
                        <span class="sup-priority-badge alta"><i class="fas fa-arrow-up"></i> Alta</span>
                    </label>
                    <label class="sup-priority-opt">
                        <input type="radio" name="prioridade" value="urgente">
                        <span class="sup-priority-badge urgente"><i class="fas fa-bolt"></i> Urgente</span>
                    </label>
                </div>
            </div>
            <div class="sup-actions">
                <button type="button" class="sup-btn sup-btn-cancel" id="supCancelBtn">Cancelar</button>
                <button type="submit" class="sup-btn sup-btn-primary" id="btnEnviarSuporte">
                    <i class="fas fa-paper-plane"></i> Enviar Chamado
                </button>
            </div>
        </form>
    `;
    bindSupFormEvents();
}

function bindSupFormEvents() {
    // Char count
    document.getElementById('supMensagem')?.addEventListener('input', (e) => {
        const count = document.getElementById('supCharCount');
        if (count) count.textContent = e.target.value.length;
    });

    // Cancel button
    document.getElementById('supCancelBtn')?.addEventListener('click', closeSupModal);

    // Submit
    document.getElementById('formSuporte')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoria = document.getElementById('supCategoria').value;
        const assunto = document.getElementById('supAssunto').value.trim();
        const mensagem = document.getElementById('supMensagem').value.trim();
        const prioridade = document.querySelector('input[name="prioridade"]:checked')?.value || 'normal';

        if (!categoria || !assunto || !mensagem) {
            showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const btn = document.getElementById('btnEnviarSuporte');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const result = await API.enviarSuporte({ categoria, assunto, mensagem, prioridade });
            showToast('Chamado enviado com sucesso!', 'success');
            showSupSuccess(result.protocolo);
        } catch (err) {
            showToast(err.message || 'Erro ao enviar chamado', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// Init support events on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Open
    document.getElementById('btnSuporte')?.addEventListener('click', (e) => {
        e.preventDefault();
        resetSupForm();
        showSupTab('novo');
        openSupModal();
    });

    // Close
    document.getElementById('supClose')?.addEventListener('click', closeSupModal);

    // Overlay click
    document.getElementById('supOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeSupModal();
    });

    // Tabs
    document.querySelectorAll('.sup-tab').forEach(tab => {
        tab.addEventListener('click', () => showSupTab(tab.getAttribute('data-sup-tab')));
    });

    // Init form events
    bindSupFormEvents();
});

// ================================================================
//  SOLICITAÇÃO DE CREDENCIAL — Modal
// ================================================================

function openCredModal() {
    document.getElementById('credOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCredModal() {
    document.getElementById('credOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function showCredStep(stepId) {
    document.querySelectorAll('.cred-step').forEach(s => s.style.display = 'none');
    const step = document.getElementById(stepId);
    if (step) step.style.display = 'block';
}

function navigateToCredencialTab() {
    closeCredModal();
    // Activate the credencial tab
    const tab = document.getElementById('ptab-credencial');
    if (tab) {
        tab.click();
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function formatCredDate(dateStr) {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function checkCredencialStatus() {
    showCredStep('credStepLoading');
    openCredModal();

    try {
        const cred = await API.getCredencial();

        if (cred && cred.codigo) {
            // Has a credential - check if expired
            const validade = cred.data_validade ? new Date(cred.data_validade) : null;
            const expirada = validade && validade < new Date();
            const ativo = cred.status === 'ATIVO' && !expirada;

            if (expirada) {
                // Show expired step
                document.getElementById('credExpCodigo').textContent = cred.codigo;
                document.getElementById('credExpValidade').textContent = formatCredDate(cred.data_validade);
                showCredStep('credStepExpirada');
            } else {
                // Show active step
                document.getElementById('credInfoCodigo').textContent = cred.codigo;
                document.getElementById('credInfoNome').textContent = cred.nome || '---';
                document.getElementById('credInfoCargo').textContent = cred.cargo || '---';
                document.getElementById('credInfoValidade').textContent = formatCredDate(cred.data_validade);

                const statusBadge = document.getElementById('credInfoStatus');
                if (ativo) {
                    statusBadge.textContent = 'ATIVA';
                    statusBadge.className = 'cred-status-badge ativa';
                } else {
                    statusBadge.textContent = 'INATIVA';
                    statusBadge.className = 'cred-status-badge inativa';
                }

                showCredStep('credStepAtiva');
            }
        } else {
            // No credential - show solicitation form
            await checkRequisitos();
            showCredStep('credStepSolicitar');
        }
    } catch (err) {
        // No credential found or error - show solicitation form
        await checkRequisitos();
        showCredStep('credStepSolicitar');
    }
}

async function checkRequisitos() {
    try {
        const m = await API.getMinistro();

        const reqCadastro = document.getElementById('credReqCadastro');
        const reqFoto = document.getElementById('credReqFoto');
        const reqAprovado = document.getElementById('credReqAprovado');

        // Check cadastro completo (has nome, cargo, cpf)
        const cadastroOk = !!(m.nome && m.cargo && m.cpf);
        if (reqCadastro) {
            reqCadastro.className = cadastroOk ? 'req-ok' : 'req-pending';
            reqCadastro.innerHTML = cadastroOk
                ? '<i class="fas fa-check-circle"></i> Cadastro completo (dados pessoais)'
                : '<i class="fas fa-exclamation-circle"></i> Cadastro completo (dados pessoais) — <em>pendente</em>';
        }

        // Check foto
        const fotoOk = !!m.foto_url;
        if (reqFoto) {
            reqFoto.className = fotoOk ? 'req-ok' : 'req-pending';
            reqFoto.innerHTML = fotoOk
                ? '<i class="fas fa-check-circle"></i> Foto de perfil cadastrada'
                : '<i class="fas fa-exclamation-circle"></i> Foto de perfil cadastrada — <em>pendente</em>';
        }

        // Check aprovado
        const aprovadoOk = m.aprovado === true;
        if (reqAprovado) {
            reqAprovado.className = aprovadoOk ? 'req-ok' : 'req-pending';
            reqAprovado.innerHTML = aprovadoOk
                ? '<i class="fas fa-check-circle"></i> Aprovação pela administração'
                : '<i class="fas fa-exclamation-circle"></i> Aprovação pela administração — <em>pendente</em>';
        }
    } catch (err) {
        // Silently fail, show default state
    }
}

async function solicitarCredencial() {
    const btn = document.getElementById('btnConfirmarSolicitar');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
        // Call getCredencial which auto-generates the credential if none exists
        const cred = await API.getCredencial();

        if (cred && cred.codigo) {
            document.getElementById('credSucessoTitulo').textContent = 'Credencial Gerada!';
            document.getElementById('credSucessoMsg').textContent = 'Sua credencial ministerial digital foi gerada com sucesso.';
            document.getElementById('credSucessoDetalhe').textContent = 
                'Código: ' + cred.codigo + ' — Acesse a aba "Credencial" para visualizar, baixar e compartilhar.';
            showCredStep('credStepSucesso');

            // Reset credencial tab cache so it reloads
            credencialLoaded = false;
        } else {
            throw new Error('Não foi possível gerar a credencial');
        }
    } catch (err) {
        document.getElementById('credErroDetalhe').textContent = 
            err.message || 'Não foi possível processar sua solicitação. Tente novamente mais tarde ou entre em contato com o suporte.';
        showCredStep('credStepErro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function renovarCredencialModal() {
    const btn = document.getElementById('btnRenovarCred');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Renovando...';

    try {
        await API.renovarCredencial();

        document.getElementById('credSucessoTitulo').textContent = 'Credencial Renovada!';
        document.getElementById('credSucessoMsg').textContent = 'Sua credencial ministerial foi renovada por mais 1 ano.';
        document.getElementById('credSucessoDetalhe').textContent = 
            'Acesse a aba "Credencial" para ver os novos dados de validade.';
        showCredStep('credStepSucesso');

        // Reset credencial tab cache
        credencialLoaded = false;
    } catch (err) {
        document.getElementById('credErroDetalhe').textContent = 
            err.message || 'Erro ao renovar credencial. Tente novamente.';
        showCredStep('credStepErro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Init credential modal events on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Open modal
    document.getElementById('btnSolicitarCredencial')?.addEventListener('click', () => {
        checkCredencialStatus();
    });

    // Close
    document.getElementById('credCloseBtn')?.addEventListener('click', closeCredModal);

    // Overlay click
    document.getElementById('credOverlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeCredModal();
    });

    // Cancel buttons
    ['credCancelBtn1', 'credCancelBtn2', 'credCancelBtn3', 'credCancelBtn4'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', closeCredModal);
    });

    // Solicitar
    document.getElementById('btnConfirmarSolicitar')?.addEventListener('click', solicitarCredencial);

    // Renovar
    document.getElementById('btnRenovarCred')?.addEventListener('click', renovarCredencialModal);

    // Ver credencial completa (go to tab)
    document.getElementById('btnVerCredencial')?.addEventListener('click', navigateToCredencialTab);

    // Ir para credencial (success step)
    document.getElementById('btnIrCredencial')?.addEventListener('click', navigateToCredencialTab);
});
