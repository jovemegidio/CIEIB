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

        // Preencher inscrições em eventos
        fillEventos(inscricoes);

        // Preencher mensagens
        fillMensagens(mensagens);

        // Atualizar badge de notificações
        const naoLidas = mensagens.filter(m => !m.lida).length;
        const badge = document.querySelector('.notif-badge');
        if (badge) badge.textContent = naoLidas;

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
        'campo-registro': m.data_registro ? new Date(m.data_registro).toLocaleDateString('pt-BR') : ''
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

    // Datas
    const nascEl = document.getElementById('campo-nascimento');
    if (nascEl && m.data_nascimento) nascEl.value = m.data_nascimento.split('T')[0];

    const nascConjEl = document.getElementById('campo-nascconjuge');
    if (nascConjEl && m.data_nasc_conjuge) nascConjEl.value = m.data_nasc_conjuge.split('T')[0];
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
            <td><button class="btn-icon" title="Detalhar"><i class="fas fa-info-circle"></i></button></td>
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
        grouped[c.servico].total += parseFloat(c.valor);
        grouped[c.servico].desc += parseFloat(c.desconto);
        grouped[c.servico].pago += parseFloat(c.valor_pago);
        grouped[c.servico].aberto += parseFloat(c.saldo);
    });

    tbody.innerHTML = Object.entries(grouped).map(([servico, v]) => `
        <tr>
            <td>${servico}</td>
            <td>R$${v.total.toFixed(2)}</td>
            <td>R$${v.desc.toFixed(2)}</td>
            <td>R$${v.pago.toFixed(2)}</td>
            <td class="valor-aberto">R$${v.aberto.toFixed(2)}</td>
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
            <td colspan="2"></td>
        </tr>`;
    }

    tbody.innerHTML = html;
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
            <td><span class="status-badge status-${i.status_inscricao === 'Quitado' ? 'quitado-badge' : 'aberto-badge'}">${i.status_inscricao}</span></td>
            <td>${formatDate(i.data_evento)}</td>
            <td>${i.hora_inicio || ''}</td>
            <td>${formatDate(i.data_termino)}</td>
        </tr>
    `).join('');

    // Pagination
    const pagination = document.querySelector('#tab-eventos .table-pagination');
    if (pagination) pagination.textContent = `[1 a ${inscricoes.length} de ${inscricoes.length}]`;
}

// ---- Preencher mensagens (aba 5) ----
function fillMensagens(mensagens) {
    const container = document.querySelector('#tab-mensagens .panel-card-body');
    if (!container) return;

    // Manter toolbar
    const toolbar = container.querySelector('.msg-toolbar');

    if (mensagens.length === 0) {
        return; // Mantém o estado vazio padrão do HTML
    }

    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const msgList = document.createElement('div');
    msgList.className = 'msg-list';

    mensagens.forEach(m => {
        const div = document.createElement('div');
        div.className = `msg-item ${m.lida ? '' : 'msg-nao-lida'}`;
        div.style.cssText = 'padding:14px;border-bottom:1px solid #eee;cursor:pointer;transition:background 0.2s;';
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="font-size:0.9rem;">${m.assunto}</strong>
                <span style="font-size:0.75rem;color:#999;">${formatDate(m.data_envio)}</span>
            </div>
            <p style="font-size:0.82rem;color:#666;margin-top:4px;">${(m.conteudo || '').substring(0, 100)}...</p>
        `;
        div.addEventListener('mouseover', () => div.style.background = '#f9f9f9');
        div.addEventListener('mouseout', () => div.style.background = '');
        msgList.appendChild(div);
    });

    container.appendChild(msgList);
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
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const panel = document.getElementById('tab-' + target);
            if (panel) panel.classList.add('active');
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
            email: getVal('campo-email')
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
