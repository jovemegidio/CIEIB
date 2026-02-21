/* ==============================================================
   PAINEL ADMINISTRATIVO — JavaScript
   ============================================================== */

// ---- API Helper ----
const AdminAPI = {
    baseUrl: '/api/admin',
    token: () => localStorage.getItem('admin_token'),
    headers: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AdminAPI.token()}`
    }),

    async request(method, endpoint, body) {
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
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Data</th><th>Categoria</th><th>Local</th><th>Inscritos</th><th>Status</th><th>Valor</th><th>Ações</th></tr></thead><tbody>
        ${allEventos.map(e => {
            const statusClass = e.status === 'Aberto' ? 'badge-ativo' : e.status === 'Em Andamento' ? 'badge-warning' : 'badge-inativo';
            const inscritos = parseInt(e.total_inscritos || 0);
            const maxInsc = parseInt(e.max_inscritos || 0);
            const inscLabel = maxInsc > 0 ? `${inscritos}/${maxInsc}` : `${inscritos}`;
            return `<tr>
            <td><strong>${e.titulo}</strong>${e.convencao && e.convencao !== 'CIEIB' ? ` <small style="color:#888">(${e.convencao})</small>` : ''}</td>
            <td>${formatDate(e.data_evento)}${e.data_termino ? ' — ' + formatDate(e.data_termino) : ''}</td>
            <td>${e.categoria || '-'}</td>
            <td>${e.local || '-'}</td>
            <td><span class="badge ${maxInsc > 0 && inscritos >= maxInsc ? 'badge-inativo' : 'badge-ativo'}">${inscLabel}</span></td>
            <td><span class="badge ${statusClass}">${e.status}</span></td>
            <td>R$ ${parseFloat(e.valor || 0).toFixed(2)}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openEventoModal(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('eventos', ${e.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
        }).join('')}
    </tbody></table>`;
}

function openEventoModal(id) {
    const item = id ? allEventos.find(e => e.id === id) : null;
    const inscritos = parseInt(item?.total_inscritos || 0);
    document.getElementById('modalTitle').textContent = item ? 'Editar Evento' : 'Novo Evento';
    document.getElementById('modalBody').innerHTML = `
        ${item ? `<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:var(--admin-primary)">${inscritos}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Inscritos</div>
            </div>
            <div style="flex:1;min-width:120px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:var(--admin-secondary)">R$ ${parseFloat(item?.valor || 0).toFixed(2)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Valor</div>
            </div>
            <div style="flex:1;min-width:120px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:${item?.status === 'Aberto' ? '#27ae60' : item?.status === 'Em Andamento' ? '#f39c12' : '#e74c3c'}">${item?.status || '-'}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Status</div>
            </div>
            <div style="flex:1;min-width:120px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:22px;font-weight:700;color:#555">${formatDate(item?.created_at)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Criado em</div>
            </div>
        </div>` : ''}
        <div class="admin-form-group"><label>Título *</label><input type="text" id="mEventoTitle" value="${item?.titulo || ''}" placeholder="Ex: 38ª Convenção Nacional CIEIB"></div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mEventoDesc" rows="3" placeholder="Descrição detalhada do evento...">${item?.descricao || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Categoria</label>
                <select id="mEventoCat">
                    <option value="">— Selecione —</option>
                    <option value="Convenção" ${item?.categoria === 'Convenção' ? 'selected' : ''}>Convenção</option>
                    <option value="Congresso" ${item?.categoria === 'Congresso' ? 'selected' : ''}>Congresso</option>
                    <option value="Seminário" ${item?.categoria === 'Seminário' ? 'selected' : ''}>Seminário</option>
                    <option value="Conferência" ${item?.categoria === 'Conferência' ? 'selected' : ''}>Conferência</option>
                    <option value="Retiro" ${item?.categoria === 'Retiro' ? 'selected' : ''}>Retiro</option>
                    <option value="Encontro" ${item?.categoria === 'Encontro' ? 'selected' : ''}>Encontro</option>
                    <option value="Culto Especial" ${item?.categoria === 'Culto Especial' ? 'selected' : ''}>Culto Especial</option>
                    <option value="Workshop" ${item?.categoria === 'Workshop' ? 'selected' : ''}>Workshop</option>
                    <option value="Outro" ${item?.categoria === 'Outro' ? 'selected' : ''}>Outro</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Convenção</label>
                <select id="mEventoConv">
                    <option value="CIEIB" ${(!item?.convencao || item?.convencao === 'CIEIB') ? 'selected' : ''}>CIEIB — Nacional</option>
                    <option value="CIEIBN" ${item?.convencao === 'CIEIBN' ? 'selected' : ''}>CIEIBN — Norte</option>
                    <option value="CIEIBNE" ${item?.convencao === 'CIEIBNE' ? 'selected' : ''}>CIEIBNE — Nordeste</option>
                    <option value="CIEIBCO" ${item?.convencao === 'CIEIBCO' ? 'selected' : ''}>CIEIBCO — Centro-Oeste</option>
                    <option value="CIEIBSE" ${item?.convencao === 'CIEIBSE' ? 'selected' : ''}>CIEIBSE — Sudeste</option>
                    <option value="CIEIBS" ${item?.convencao === 'CIEIBS' ? 'selected' : ''}>CIEIBS — Sul</option>
                </select>
            </div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Data Início</label><input type="date" id="mEventoData" value="${item?.data_evento?.split('T')[0] || ''}"></div>
            <div class="admin-form-group"><label>Data Término</label><input type="date" id="mEventoFim" value="${item?.data_termino?.split('T')[0] || ''}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Hora Início</label><input type="time" id="mEventoHora" value="${item?.hora_inicio || ''}"></div>
            <div class="admin-form-group"><label>Hora Término</label><input type="time" id="mEventoHoraFim" value="${item?.hora_termino || ''}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Local</label><input type="text" id="mEventoLocal" value="${item?.local || ''}" placeholder="Ex: Centro de Convenções, São Paulo - SP"></div>
            <div class="admin-form-group"><label>Valor (R$)</label><input type="number" id="mEventoValor" step="0.01" min="0" value="${item?.valor || '0'}"></div>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Máx. Inscritos</label><input type="number" id="mEventoMax" min="0" value="${item?.max_inscritos || '0'}" placeholder="0 = ilimitado"></div>
            <div class="admin-form-group"><label>Status</label>
                <select id="mEventoStatus">
                    <option value="Aberto" ${item?.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${item?.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Encerrado" ${item?.status === 'Encerrado' ? 'selected' : ''}>Encerrado</option>
                    <option value="Cancelado" ${item?.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>
        ${adminUploadField('mEventoImg', 'Imagem / Banner do Evento (800×400px)', item?.imagem_url)}
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveEvento(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

async function saveEvento(id) {
    const titulo = document.getElementById('mEventoTitle').value.trim();
    if (!titulo) { showToast('Título é obrigatório', 'error'); return; }
    const body = {
        titulo,
        descricao: document.getElementById('mEventoDesc').value,
        categoria: document.getElementById('mEventoCat').value,
        convencao: document.getElementById('mEventoConv').value,
        data_evento: document.getElementById('mEventoData').value || null,
        data_termino: document.getElementById('mEventoFim').value || null,
        hora_inicio: document.getElementById('mEventoHora').value || null,
        hora_termino: document.getElementById('mEventoHoraFim').value || null,
        valor: parseFloat(document.getElementById('mEventoValor').value) || 0,
        local: document.getElementById('mEventoLocal').value,
        max_inscritos: parseInt(document.getElementById('mEventoMax').value) || 0,
        status: document.getElementById('mEventoStatus').value,
        imagem_url: document.getElementById('mEventoImg')?.value || null,
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
    const ok = await adminConfirm({ title: 'Excluir Módulo', message: 'Excluir este módulo e todas as suas aulas?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
    try {
        await AdminAPI.del(`/modulos/${moduloId}`);
        showToast('Módulo excluído', 'success');
        openCursoModulos(cursoId);
    } catch (err) { showToast(err.message, 'error'); }
}

let _currentAulas = [];
async function openModuloAulas(moduloId, moduloTitulo) {
    try {
        _currentAulas = await AdminAPI.get(`/modulos/${moduloId}/aulas`);
        document.getElementById('modalTitle').textContent = `Aulas — ${moduloTitulo}`;
        const tipoIcons = { video: 'fa-play-circle', texto: 'fa-file-alt', pdf: 'fa-file-pdf', audio: 'fa-headphones', quiz: 'fa-question-circle' };
        const tipoBadge = { video: 'badge-ativo', texto: 'badge-destaque', pdf: 'badge-inativo', audio: 'badge-warning', quiz: 'badge-info-notif' };
        document.getElementById('modalBody').innerHTML = `
            <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <div style="flex:1;min-width:100px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:var(--admin-primary)">${_currentAulas.length}</div>
                    <div style="font-size:11px;color:#888;">Aulas</div>
                </div>
                <div style="flex:1;min-width:100px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:var(--admin-secondary)">${_currentAulas.reduce((s,a) => s + (a.duracao_minutos||0), 0)}min</div>
                    <div style="font-size:11px;color:#888;">Duração Total</div>
                </div>
                <div style="flex:1;min-width:100px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#27ae60">${_currentAulas.filter(a=>a.tipo==='video').length}</div>
                    <div style="font-size:11px;color:#888;">Vídeos</div>
                </div>
                <div style="flex:1;min-width:100px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#8e44ad">${_currentAulas.filter(a=>a.tipo==='texto'||a.tipo==='pdf').length}</div>
                    <div style="font-size:11px;color:#888;">Textos/PDF</div>
                </div>
            </div>
            <button class="btn-admin-primary" onclick="openAulaForm(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')" style="margin-bottom:16px;"><i class="fas fa-plus"></i> Nova Aula</button>
            ${_currentAulas.length === 0 ? '<p style="color:#aaa;text-align:center;padding:30px;">Nenhuma aula cadastrada neste módulo</p>' : _currentAulas.map((a, idx) => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #eee;border-radius:10px;margin-bottom:8px;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--admin-primary)'" onmouseout="this.style.borderColor='#eee'">
                    <div style="width:32px;height:32px;border-radius:50%;background:#f0f4f8;display:flex;align-items:center;justify-content:center;color:var(--admin-primary);font-weight:700;font-size:0.8rem;flex-shrink:0;">${idx+1}</div>
                    <i class="fas ${tipoIcons[a.tipo]||'fa-file'} ${''} " style="color:var(--admin-secondary);font-size:1.1rem;flex-shrink:0;"></i>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:0.88rem;font-weight:600;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.titulo}</div>
                        <div style="font-size:0.72rem;color:#999;margin-top:2px;">
                            <span class="badge ${tipoBadge[a.tipo]||'badge-ativo'}" style="font-size:0.65rem;padding:2px 8px;">${a.tipo}</span>
                            ${a.duracao_minutos ? `<span style="margin-left:6px;"><i class="fas fa-clock"></i> ${a.duracao_minutos}min</span>` : ''}
                            ${a.conteudo_url ? '<span style="margin-left:6px;"><i class="fas fa-link"></i> Com conteúdo</span>' : '<span style="margin-left:6px;color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> Sem conteúdo</span>'}
                            ${a.material_url ? '<span style="margin-left:6px;"><i class="fas fa-paperclip"></i> Material</span>' : ''}
                        </div>
                    </div>
                    <div style="display:flex;gap:6px;flex-shrink:0;">
                        <button class="btn-table-action btn-table-edit" onclick="openAulaForm(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}'  , ${a.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-table-action btn-table-delete" onclick="deleteAula(${a.id}, ${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        `;
        document.getElementById('modalFooter').innerHTML = `<button class="btn-admin-secondary" onclick="closeModal()">Fechar</button>`;
    } catch (err) { showToast(err.message, 'error'); }
}

function openAulaForm(moduloId, moduloTitulo, aulaId) {
    const item = aulaId ? _currentAulas.find(a => a.id === aulaId) : null;
    document.getElementById('modalTitle').textContent = item ? `Editar Aula — ${item.titulo}` : `Nova Aula — ${moduloTitulo}`;
    document.getElementById('modalBody').innerHTML = `
        <div class="admin-form-group"><label>Título *</label><input type="text" id="mAulaTitle" value="${item?.titulo || ''}" placeholder="Nome da aula"></div>
        <div class="admin-form-group"><label>Descrição</label><textarea id="mAulaDesc" style="min-height:60px;" placeholder="Breve descrição do conteúdo da aula">${item?.descricao || ''}</textarea></div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Tipo *</label>
                <select id="mAulaTipo" onchange="aulaToggleConteudo()">
                    <option value="video" ${item?.tipo==='video'?'selected':''}>🎬 Vídeo</option>
                    <option value="texto" ${item?.tipo==='texto'?'selected':''}>📝 Texto</option>
                    <option value="pdf" ${item?.tipo==='pdf'?'selected':''}>📄 PDF</option>
                    <option value="audio" ${item?.tipo==='audio'?'selected':''}>🎧 Áudio</option>
                    <option value="quiz" ${item?.tipo==='quiz'?'selected':''}>❓ Quiz</option>
                </select>
            </div>
            <div class="admin-form-group"><label>Duração (min)</label><input type="number" id="mAulaDuracao" min="0" value="${item?.duracao_minutos || 0}"></div>
            <div class="admin-form-group"><label>Ordem</label><input type="number" id="mAulaOrdem" min="0" value="${item?.ordem || 0}"></div>
        </div>
        <div id="aulaConteudoArea"></div>
        ${adminUploadField('mAulaMaterial', 'Material de Apoio (PDF, DOC, etc.)', item?.material_url)}
    `;
    aulaToggleConteudo(item);
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="openModuloAulas(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}')">Voltar</button>
        <button class="btn-admin-primary" onclick="saveAula(${moduloId}, '${moduloTitulo.replace(/'/g, "\\'")}'  , ${aulaId || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
}

function aulaToggleConteudo(item) {
    const tipo = document.getElementById('mAulaTipo').value;
    const area = document.getElementById('aulaConteudoArea');
    const val = item?.conteudo_url || '';
    if (tipo === 'video') {
        area.innerHTML = `
            <div class="admin-form-group">
                <label><i class="fas fa-video"></i> URL do Vídeo (YouTube, Vimeo, etc.)</label>
                <input type="url" id="mAulaConteudoUrl" value="${val}" placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/...">
                <small style="color:#888;margin-top:4px;display:block;">Cole a URL do vídeo. Suporta YouTube, Vimeo, Google Drive e links diretos MP4.</small>
                ${val && (val.includes('youtube') || val.includes('youtu.be')) ? `<div style="margin-top:8px;border-radius:8px;overflow:hidden;"><iframe width="100%" height="200" src="https://www.youtube.com/embed/${extractYouTubeId(val)}" frameborder="0" allowfullscreen></iframe></div>` : ''}
            </div>`;
    } else if (tipo === 'texto') {
        area.innerHTML = `
            <div class="admin-form-group">
                <label><i class="fas fa-file-alt"></i> Conteúdo da Aula</label>
                <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                    <button type="button" class="btn-mini-format" onclick="aulaInsertFmt('**','**')" title="Negrito"><i class="fas fa-bold"></i></button>
                    <button type="button" class="btn-mini-format" onclick="aulaInsertFmt('_','_')" title="Itálico"><i class="fas fa-italic"></i></button>
                    <button type="button" class="btn-mini-format" onclick="aulaInsertFmt('\\n• ','')" title="Lista"><i class="fas fa-list-ul"></i></button>
                    <button type="button" class="btn-mini-format" onclick="aulaInsertFmt('## ','')" title="Subtítulo"><i class="fas fa-heading"></i></button>
                    <span style="flex:1;"></span>
                    <small style="color:#999;align-self:center;">**negrito** · _itálico_ · ## subtítulo</small>
                </div>
                <textarea id="mAulaConteudoUrl" style="min-height:200px;font-family:monospace;font-size:0.9rem;line-height:1.6;">${htmlToPlainEdit(val)}</textarea>
            </div>`;
    } else if (tipo === 'pdf' || tipo === 'audio') {
        area.innerHTML = `${adminUploadField('mAulaConteudoUrl', tipo === 'pdf' ? 'Arquivo PDF da Aula' : 'Arquivo de Áudio', val)}`;
    } else {
        area.innerHTML = `
            <div class="admin-form-group">
                <label><i class="fas fa-question-circle"></i> URL ou Conteúdo do Quiz</label>
                <input type="text" id="mAulaConteudoUrl" value="${val}" placeholder="URL do quiz ou conteúdo">
            </div>`;
    }
}

function extractYouTubeId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    return m ? m[1] : '';
}

function aulaInsertFmt(before, after) {
    const ta = document.getElementById('mAulaConteudoUrl');
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    ta.value = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd = start + before.length + selected.length;
}

async function saveAula(moduloId, moduloTitulo, aulaId) {
    const titulo = document.getElementById('mAulaTitle').value.trim();
    if (!titulo) { showToast('Título é obrigatório', 'error'); return; }
    const tipo = document.getElementById('mAulaTipo').value;
    let conteudoUrl = document.getElementById('mAulaConteudoUrl')?.value || '';
    if (tipo === 'texto' && conteudoUrl) conteudoUrl = plainEditToHtml(conteudoUrl);
    const body = {
        titulo,
        descricao: document.getElementById('mAulaDesc').value,
        tipo,
        duracao_minutos: parseInt(document.getElementById('mAulaDuracao').value) || 0,
        conteudo_url: conteudoUrl,
        material_url: document.getElementById('mAulaMaterial')?.value || '',
        ordem: parseInt(document.getElementById('mAulaOrdem').value) || 0,
    };
    try {
        if (aulaId) await AdminAPI.put(`/aulas/${aulaId}`, body);
        else await AdminAPI.post(`/modulos/${moduloId}/aulas`, body);
        showToast(aulaId ? 'Aula atualizada!' : 'Aula criada!', 'success');
        openModuloAulas(moduloId, moduloTitulo);
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteAula(aulaId, moduloId, moduloTitulo) {
    const ok = await adminConfirm({ title: 'Excluir Aula', message: 'Excluir esta aula permanentemente?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
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
    const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Página</th><th>Seção</th><th>Título</th><th>Ordem</th><th>Status</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>
        ${items.map(c => `<tr>
            <td><span class="badge badge-ativo">${c.pagina}</span></td>
            <td>${c.secao}</td>
            <td>${c.titulo || '-'}</td>
            <td style="text-align:center;">${c.ordem || 0}</td>
            <td>${c.ativo !== false ? '<span class="badge badge-ativo">Ativo</span>' : '<span class="badge badge-inativo">Inativo</span>'}</td>
            <td style="font-size:0.78rem;color:#888;">${fmtDt(c.updated_at)}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openConteudoModal(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('conteudos', ${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('')}
    </tbody></table>`;
}

function htmlToPlainEdit(html) {
    if (!html) return '';
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
    text = text.replace(/<\/?p[^>]*>/gi, '');
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '_$1_');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<i>(.*?)<\/i>/gi, '_$1_');
    text = text.replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    text = text.replace(/<ul[^>]*>/gi, '').replace(/<\/ul>/gi, '');
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n');
    text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '## $1\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"');
    return text.trim();
}

function plainEditToHtml(text) {
    if (!text) return '';
    let html = text;
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^• (.+)$/gm, '<li>$1</li>');
    if (html.includes('<li>')) html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    const paragraphs = html.split(/\n{2,}/);
    if (paragraphs.length > 1) {
        html = paragraphs.map(p => {
            p = p.trim();
            if (!p) return '';
            if (/^<(h[1-6]|ul|ol|li|div|table)/i.test(p)) return p;
            return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('');
    } else {
        html = html.replace(/\n/g, '<br>');
    }
    return html;
}

function openConteudoModal(id) {
    const item = id ? allConteudos.find(c => c.id === id) : null;
    const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    const cleanContent = htmlToPlainEdit(item?.conteudo);
    document.getElementById('modalTitle').textContent = item ? 'Editar Conteúdo' : 'Novo Conteúdo';
    document.getElementById('modalBody').innerHTML = `
        ${item ? `<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:16px;font-weight:700;color:var(--admin-primary)">${item.pagina}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Página</div>
            </div>
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:16px;font-weight:700;color:var(--admin-secondary)">${item.secao}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Seção</div>
            </div>
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:16px;font-weight:700;color:${item.ativo !== false ? '#27ae60' : '#e74c3c'}">${item.ativo !== false ? 'Ativo' : 'Inativo'}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Status</div>
            </div>
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:14px;font-weight:600;color:#555">${fmtDt(item.updated_at)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Atualizado</div>
            </div>
        </div>` : ''}
        <div class="form-grid">
            <div class="admin-form-group"><label>Página *</label>
                <select id="mCmsPagina">
                    <option value="">— Selecione —</option>
                    ${['index','quem-somos','diretoria','noticias','contato','area-do-ministro'].map(p => `<option value="${p}" ${item?.pagina === p ? 'selected' : ''}>${p}</option>`).join('')}
                    <option value="_outro" ${item?.pagina && !['index','quem-somos','diretoria','noticias','contato','area-do-ministro'].includes(item?.pagina) ? 'selected' : ''}>Outra...</option>
                </select>
                <input type="text" id="mCmsPaginaCustom" value="${item?.pagina && !['index','quem-somos','diretoria','noticias','contato','area-do-ministro'].includes(item?.pagina) ? item.pagina : ''}" placeholder="Nome da página" style="margin-top:6px;${item?.pagina && !['index','quem-somos','diretoria','noticias','contato','area-do-ministro'].includes(item?.pagina) ? '' : 'display:none;'}">
            </div>
            <div class="admin-form-group"><label>Seção *</label><input type="text" id="mCmsSecao" value="${item?.secao || ''}" placeholder="ex: intro, missao, visao, historia"></div>
        </div>
        <div class="admin-form-group"><label>Título</label><input type="text" id="mCmsTitulo" value="${item?.titulo || ''}"></div>
        <div class="admin-form-group">
            <label>Conteúdo</label>
            <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                <button type="button" class="btn-mini-format" onclick="cmsInsertFormat('**','**')" title="Negrito"><i class="fas fa-bold"></i></button>
                <button type="button" class="btn-mini-format" onclick="cmsInsertFormat('_','_')" title="Itálico"><i class="fas fa-italic"></i></button>
                <button type="button" class="btn-mini-format" onclick="cmsInsertFormat('\\n• ','')" title="Lista"><i class="fas fa-list-ul"></i></button>
                <button type="button" class="btn-mini-format" onclick="cmsInsertFormat('## ','')" title="Subtítulo"><i class="fas fa-heading"></i></button>
                <button type="button" class="btn-mini-format" onclick="cmsInsertLink()" title="Link"><i class="fas fa-link"></i></button>
                <span style="flex:1;"></span>
                <small style="color:#999;align-self:center;">**negrito** · _itálico_ · ## subtítulo · [texto](url)</small>
            </div>
            <textarea id="mCmsConteudo" style="min-height:180px;font-family:monospace;font-size:0.9rem;line-height:1.5;">${cleanContent}</textarea>
        </div>
        <div class="form-grid">
            <div class="admin-form-group"><label>Ordem</label><input type="number" id="mCmsOrdem" min="0" value="${item?.ordem || 0}" placeholder="0"></div>
            <div class="admin-form-group"><label>Status</label>
                <select id="mCmsAtivo">
                    <option value="true" ${item?.ativo !== false ? 'selected' : ''}>Ativo</option>
                    <option value="false" ${item?.ativo === false ? 'selected' : ''}>Inativo</option>
                </select>
            </div>
        </div>
        ${adminUploadField('mCmsImg', 'Imagem da Seção', item?.imagem_url)}
    `;
    // Toggle custom page input
    document.getElementById('mCmsPagina').addEventListener('change', function() {
        document.getElementById('mCmsPaginaCustom').style.display = this.value === '_outro' ? '' : 'none';
    });
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="saveConteudo(${id || 'null'})"><i class="fas fa-save"></i> Salvar</button>
    `;
    openModal();
}

function cmsInsertFormat(before, after) {
    const ta = document.getElementById('mCmsConteudo');
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    ta.value = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd = start + before.length + selected.length;
}

function cmsInsertLink() {
    const ta = document.getElementById('mCmsConteudo');
    const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd) || 'texto';
    const url = prompt('URL do link:', 'https://');
    if (url) cmsInsertFormat(`[${selected}](${url})`.replace(selected, ''), '');
}

async function saveConteudo(id) {
    let pagina = document.getElementById('mCmsPagina').value;
    if (pagina === '_outro') pagina = document.getElementById('mCmsPaginaCustom').value.trim();
    const secao = document.getElementById('mCmsSecao').value.trim();
    if (!pagina || !secao) { showToast('Página e Seção são obrigatórios', 'error'); return; }
    const rawText = document.getElementById('mCmsConteudo').value;
    const body = {
        pagina,
        secao,
        titulo: document.getElementById('mCmsTitulo').value,
        conteudo: plainEditToHtml(rawText),
        imagem_url: document.getElementById('mCmsImg').value,
        ordem: parseInt(document.getElementById('mCmsOrdem').value) || 0,
        ativo: document.getElementById('mCmsAtivo').value === 'true',
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
        el.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fas fa-users" style="font-size:2.5rem;color:#ddd;display:block;margin-bottom:12px;"></i><p style="color:#aaa;font-size:0.88rem;">Nenhum membro encontrado</p><p style="color:#ccc;font-size:0.75rem;margin-top:4px;">Tente ajustar os filtros de busca</p></div>';
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

    // Count active filters
    const activeFilters = [
        document.getElementById('filtroStatus')?.value,
        document.getElementById('filtroAnuidade')?.value,
        document.getElementById('filtroCredencial')?.value
    ].filter(Boolean).length;
    const searchVal = document.getElementById('ministrosSearch')?.value || '';
    const totalInfo = `<div class="membros-table-info"><span><i class="fas fa-users"></i> ${data.total || data.ministros.length} membro(s) encontrado(s)</span>${activeFilters > 0 || searchVal ? `<span class="mti-filters"><i class="fas fa-filter"></i> ${activeFilters} filtro(s) ${searchVal ? '+ busca' : ''}</span>` : ''}</div>`;

    el.innerHTML = totalInfo + `<table class="admin-table"><thead><tr>
        <th style="width:48px;"></th><th>Nome</th><th>CPF</th><th>Cargo</th><th>Registro</th>
        <th>Status</th><th>Ações</th>
    </tr></thead><tbody>
        ${data.ministros.map(m => `<tr class="membro-row" ondblclick="openMembroDetail(${m.id})" title="Duplo clique para abrir detalhes">
            <td>
                <div class="membros-avatar" style="width:36px;height:36px;font-size:0.72rem;">
                    ${m.foto_url ? `<img src="${m.foto_url}" alt="">` : getInitials(m.nome)}
                </div>
            </td>
            <td><strong style="font-size:0.83rem;">${m.nome}</strong></td>
            <td style="font-size:0.8rem;font-family:monospace;">${formatCPF(m.cpf)}</td>
            <td style="font-size:0.8rem;">${formatCargo(m.cargo)}</td>
            <td style="font-size:0.78rem;color:#999;">${m.registro || '—'}</td>
            <td>${statusBadge(m.status)}</td>
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

function formatCargo(cargo) {
    if (!cargo) return '-';
    const map = {
        'PASTOR': 'Pastor(a)', 'MISSIONÁRIO': 'Missionário(a)', 'EVANGELISTA': 'Evangelista',
        'PRESBÍTERO': 'Presbítero(a)', 'DIÁCONO': 'Diácono/Diaconisa', 'COOPERADOR': 'Cooperador(a)',
        'OBREIRO': 'Obreiro(a)'
    };
    return map[cargo] || cargo.charAt(0) + cargo.slice(1).toLowerCase();
}

function formatCPF(cpf) {
    if (!cpf) return '—';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return cpf;
}

function formatRG(rg) {
    if (!rg) return '—';
    const digits = rg.replace(/\D/g, '');
    if (digits.length === 9) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    if (digits.length === 8) return digits.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
    if (digits.length >= 7 && digits.length <= 10) {
        return rg.includes('.') || rg.includes('-') ? rg : digits.replace(/(\d{2})(\d{3})(\d{3})(\d*)/, '$1.$2.$3' + (digits.length > 8 ? '-$4' : ''));
    }
    return rg;
}

function formatTelefone(tel) {
    if (!tel) return '—';
    const digits = tel.replace(/\D/g, '');
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel;
}

async function toggleMinistroStatus(id, currentStatus) {
    const newStatus = currentStatus === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    const ok = await adminConfirm({ title: newStatus === 'INATIVO' ? 'Desativar Membro' : 'Ativar Membro', message: `${newStatus === 'INATIVO' ? 'Desativar' : 'Ativar'} este membro?`, type: 'warning', confirmText: newStatus === 'INATIVO' ? 'Desativar' : 'Ativar' });
    if (!ok) return;
    try {
        await AdminAPI.put(`/ministros/${id}/status`, { status: newStatus });
        showToast('Status alterado!', 'success');
        loadAdminMinistros();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteMinistro(id) {
    const ok = await adminConfirm({ title: 'Excluir Membro', message: 'ATENÇÃO: Excluir este membro permanentemente? Todos os dados relacionados serão removidos.', type: 'danger', confirmText: 'Excluir Permanentemente' });
    if (!ok) return;
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
// DETALHE DO MEMBRO — Modal centralizado completo
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

        // Header subtitle
        document.getElementById('mdpSubtitle').textContent = `${m.cargo || 'Sem cargo'} — ${m.registro || 'Sem registro'}`;

        // WhatsApp button
        const wppBtn = document.getElementById('mdpBtnWhatsapp');
        const wppNum = (m.whatsapp || m.telefone || '').replace(/\D/g, '');
        if (wppNum) {
            wppBtn.style.display = '';
            wppBtn.onclick = () => window.open(`https://wa.me/55${wppNum}`, '_blank');
        } else {
            wppBtn.style.display = 'none';
        }

        document.getElementById('mdpProfileArea').innerHTML = `
            <div class="mdp-profile">
                <div class="mdp-profile-avatar">
                    ${m.foto_url ? `<img src="${m.foto_url}" alt="">` : getInitials(m.nome)}
                </div>
                <div class="mdp-profile-info">
                    <h4>${m.nome}</h4>
                    <p>${formatCargo(m.cargo)} — ${m.nome_igreja || 'Sem igreja vinculada'}</p>
                    <p>CPF: ${formatCPF(m.cpf)} ${m.registro ? `| Registro: ${m.registro}` : ''}</p>
                    <div class="mdp-profile-badges">
                        <span class="badge ${m.status === 'ATIVO' ? 'badge-ativo' : m.status === 'PENDENTE' ? 'badge-pendente' : 'badge-inativo'}">${m.status}</span>
                        <span class="badge ${m.anuidade_status === 'paga' ? 'badge-paga' : m.anuidade_status === 'vencida' ? 'badge-vencida' : 'badge-pendente'}">Anuid. ${(m.anuidade_status || 'pendente')}</span>
                        <span class="badge ${m.credencial_status === 'ativa' ? 'badge-ativa' : m.credencial_status === 'vencida' ? 'badge-vencida' : 'badge-pendente'}">Cred. ${(m.credencial_status || 'pendente')}</span>
                    </div>
                </div>
                <div class="mdp-profile-quick-actions">
                    <button class="mdp-quick-btn" onclick="openBoletoModal(${m.id})"><i class="fas fa-plus-circle"></i> Novo Boleto</button>
                    <button class="mdp-quick-btn" onclick="openCredencialModal(${m.id})"><i class="fas fa-id-badge"></i> Nova Credencial</button>
                </div>
            </div>
        `;

        // Reset tabs and render first
        switchMdpTab('dados');

        // Show modal
        document.getElementById('membroDetailOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (err) {
        showToast('Erro ao carregar detalhes do membro', 'error');
    }
}

function closeMembroDetail() {
    document.getElementById('membroDetailOverlay').classList.remove('active');
    document.body.style.overflow = '';
    currentMembro = null;
}

function printMembroDetail() {
    const modal = document.getElementById('membroDetailPanel');
    if (!modal) return;

    const printWin = window.open('', '_blank', 'width=900,height=700');
    const m = currentMembro || {};
    const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Ficha — ${m.nome || 'Membro'}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 24px; color: #333; font-size: 13px; }
            h1 { font-size: 18px; color: #1a3a5c; border-bottom: 2px solid #c8a951; padding-bottom: 6px; margin-bottom: 12px; }
            h2 { font-size: 14px; color: #1a3a5c; margin: 16px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 16px; }
            .item label { font-size: 10px; color: #888; text-transform: uppercase; display: block; }
            .item span { font-weight: 600; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
            .badge-ativo { background: #e8f5e9; color: #2e7d32; }
            .badge-pendente { background: #fff3e0; color: #e65100; }
            .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
            @media print { body { padding: 12px; } }
        </style></head><body>
        <h1><i>📋</i> Ficha do Membro — ${m.nome || ''}</h1>
        <p style="margin-bottom: 12px;">
            <span class="badge badge-${(m.status||'').toLowerCase() === 'ativo' ? 'ativo' : 'pendente'}">${m.status || '—'}</span>
            ${m.cargo || ''} — Registro: ${m.registro || '—'}
        </p>
        <h2>Dados Pessoais</h2>
        <div class="grid">
            <div class="item"><label>Nome</label><span>${m.nome || '—'}</span></div>
            <div class="item"><label>CPF</label><span>${m.cpf || '—'}</span></div>
            <div class="item"><label>RG</label><span>${m.rg || '—'} ${m.orgao_expedidor || ''}</span></div>
            <div class="item"><label>Sexo</label><span>${m.sexo === 'M' ? 'Masculino' : m.sexo === 'F' ? 'Feminino' : '—'}</span></div>
            <div class="item"><label>Nascimento</label><span>${fmtDate(m.data_nascimento)}</span></div>
            <div class="item"><label>Estado Civil</label><span>${m.estado_civil || '—'}</span></div>
            <div class="item"><label>Cônjuge</label><span>${m.nome_conjuge || '—'}</span></div>
            <div class="item"><label>Escolaridade</label><span>${m.escolaridade || '—'}</span></div>
            <div class="item"><label>Email</label><span>${m.email || '—'}</span></div>
            <div class="item"><label>Telefone</label><span>${m.telefone || '—'}</span></div>
            <div class="item"><label>WhatsApp</label><span>${m.whatsapp || '—'}</span></div>
            <div class="item"><label>Igreja</label><span>${m.nome_igreja || '—'}</span></div>
        </div>
        <h2>Dados Ministeriais</h2>
        <div class="grid">
            <div class="item"><label>Cargo</label><span>${m.cargo || '—'}</span></div>
            <div class="item"><label>Função</label><span>${m.funcao_ministerial || '—'}</span></div>
            <div class="item"><label>Tempo Ministério</label><span>${m.tempo_ministerio || '—'}</span></div>
            <div class="item"><label>Consagração</label><span>${fmtDate(m.data_consagracao)}</span></div>
            <div class="item"><label>Registro</label><span>${m.registro || '—'}</span></div>
            <div class="item"><label>Data Registro</label><span>${fmtDate(m.data_registro)}</span></div>
        </div>
        ${(m.endereco && m.endereco.endereco) ? `
            <h2>Endereço</h2>
            <div class="grid">
                <div class="item"><label>Logradouro</label><span>${m.endereco.endereco}, ${m.endereco.numero || 's/n'}</span></div>
                <div class="item"><label>Complemento</label><span>${m.endereco.complemento || '—'}</span></div>
                <div class="item"><label>Bairro</label><span>${m.endereco.bairro || '—'}</span></div>
                <div class="item"><label>Cidade/UF</label><span>${m.endereco.cidade || '—'} / ${m.endereco.uf || '—'}</span></div>
                <div class="item"><label>CEP</label><span>${m.endereco.cep || '—'}</span></div>
            </div>
        ` : ''}
        <div class="footer">CIEIB — Convenção das Igrejas Evangélicas Interdenominacional do Brasil | Impresso em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
    </body></html>`);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
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
                <div class="mdp-info-item"><label>CPF</label><span>${formatCPF(m.cpf)}</span></div>
                <div class="mdp-info-item"><label>RG</label><span>${formatRG(m.rg)} ${m.orgao_expedidor ? `(${m.orgao_expedidor})` : ''}</span></div>
                <div class="mdp-info-item"><label>Sexo</label><span>${m.sexo === 'M' ? 'Masculino' : m.sexo === 'F' ? 'Feminino' : '—'}</span></div>
                <div class="mdp-info-item"><label>Data Nascimento</label><span>${fmtDate(m.data_nascimento)}</span></div>
                <div class="mdp-info-item"><label>Estado Civil</label><span>${m.estado_civil || '—'}</span></div>
                <div class="mdp-info-item"><label>Cônjuge</label><span>${m.nome_conjuge || '—'}</span></div>
                <div class="mdp-info-item"><label>Escolaridade</label><span>${m.escolaridade || '—'}</span></div>
            </div>

            <div class="mdp-section-title"><i class="fas fa-phone"></i> Contato</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Email</label><span>${m.email || '—'}</span></div>
                <div class="mdp-info-item"><label>Telefone</label><span>${formatTelefone(m.telefone)}</span></div>
                <div class="mdp-info-item"><label>WhatsApp</label><span>${formatTelefone(m.whatsapp)}</span></div>
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
            ` : '<p style="color:#aaa;font-size:0.82rem;padding:8px;">Endereço não cadastrado</p>'}

            <div class="mdp-section-title"><i class="fas fa-church"></i> Dados Ministeriais</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Cargo</label><span>${formatCargo(m.cargo)}</span></div>
                <div class="mdp-info-item"><label>Função Ministerial</label><span>${m.funcao_ministerial || '—'}</span></div>
                <div class="mdp-info-item"><label>Igreja</label><span>${m.nome_igreja || '—'}</span></div>
                <div class="mdp-info-item"><label>Tempo de Ministério</label><span>${m.tempo_ministerio || '—'}</span></div>
                <div class="mdp-info-item"><label>Data Consagração</label><span>${fmtDate(m.data_consagracao)}</span></div>
                <div class="mdp-info-item"><label>Data de Batismo</label><span>${fmtDate(m.data_batismo)}</span></div>
                <div class="mdp-info-item"><label>Data da Ordenação</label><span>${fmtDate(m.data_ordenacao)}</span></div>
                <div class="mdp-info-item"><label>Igreja onde foi Ordenado</label><span>${m.igreja_ordenacao || '—'}</span></div>
                <div class="mdp-info-item"><label>Cidade da Ordenação</label><span>${m.cidade_ordenacao || '—'}</span></div>
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
        `;
    }

    else if (tab === 'documentos') {
        const docs = m.documentos || {};
        const docTypes = [
            { key: 'documento_identidade', label: 'RG / Identidade', icon: 'fa-id-card' },
            { key: 'cpf_documento', label: 'CPF', icon: 'fa-file-alt' },
            { key: 'comprovante_endereco', label: 'Comprovante de Residência', icon: 'fa-home' },
            { key: 'credencial_eclesiastica', label: 'Credencial Eclesiástica', icon: 'fa-certificate' },
            { key: 'foto_3x4', label: 'Foto 3x4', icon: 'fa-camera' },
            { key: 'certidao_casamento', label: 'Certidão de Casamento', icon: 'fa-ring' },
            { key: 'diploma_teologia', label: 'Diploma de Teologia', icon: 'fa-graduation-cap' },
            { key: 'carta_recomendacao', label: 'Carta de Recomendação', icon: 'fa-envelope-open-text' },
        ];

        content.innerHTML = `
            <div class="mdp-section-title"><i class="fas fa-folder-open"></i> Documentos do Membro</div>
            <p style="font-size:0.78rem;color:var(--admin-gray);margin-bottom:16px;">Documentos enviados pelo ministro durante o cadastro. Você pode visualizar e fazer upload de novos documentos.</p>
            <div class="mdp-docs-grid">
                ${docTypes.map(dt => {
                    const url = docs[dt.key + '_url'] || docs[dt.key] || null;
                    const hasFile = !!url;
                    return `
                        <div class="mdp-doc-card ${hasFile ? 'has-file' : 'no-file'}">
                            <div class="mdp-doc-icon"><i class="fas ${dt.icon}"></i></div>
                            <h5>${dt.label}</h5>
                            <p>${hasFile ? '✓ Arquivo enviado' : 'Não enviado'}</p>
                            <div class="mdp-doc-actions">
                                ${hasFile ? `<a href="${url}" target="_blank" class="mdp-btn-view" style="color:#1565c0;background:#e3f2fd;"><i class="fas fa-eye"></i> Ver</a>` : ''}
                                <button class="mdp-btn-edit" style="background:#fff3e0;color:#e65100;" onclick="uploadDocumentoMembro(${m.id}, '${dt.key}', '${dt.label}')"><i class="fas fa-upload"></i> ${hasFile ? 'Trocar' : 'Enviar'}</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="mdp-section-title" style="margin-top:28px;"><i class="fas fa-upload"></i> Upload Rápido de Documento</div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
                <div style="flex:1;min-width:200px;">
                    <label style="display:block;font-size:0.72rem;font-weight:700;color:var(--admin-gray);text-transform:uppercase;margin-bottom:4px;">Tipo de Documento</label>
                    <select id="mdpDocTipo" style="width:100%;padding:9px 12px;border:1.5px solid var(--admin-border);border-radius:8px;font-family:inherit;font-size:0.82rem;">
                        ${docTypes.map(dt => `<option value="${dt.key}">${dt.label}</option>`).join('')}
                        <option value="outro">Outro Documento</option>
                    </select>
                </div>
                <div>
                    <input type="file" id="mdpDocFile" accept="image/*,.pdf" style="display:none;" onchange="doUploadDocMembro(${m.id})">
                    <button class="btn-admin-primary" style="padding:9px 18px;" onclick="document.getElementById('mdpDocFile').click()"><i class="fas fa-cloud-upload-alt"></i> Selecionar Arquivo</button>
                </div>
            </div>
        `;
    }

    else if (tab === 'financeiro') {
        const boletos = m.boletos || [];
        const contas = m.contas || [];

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="mdp-section-title" style="margin-top:0;"><i class="fas fa-barcode"></i> Boletos / Anuidades</div>
                <button class="btn-admin-primary" style="font-size:0.78rem;padding:8px 16px;" onclick="openBoletoModal(${m.id})"><i class="fas fa-plus"></i> Novo Boleto</button>
            </div>

            ${boletos.length === 0 ? `
                <div class="mdp-empty"><i class="fas fa-receipt"></i><p>Nenhum boleto registrado</p><p style="font-size:0.72rem;color:#bbb;margin-top:4px;">Clique em "Novo Boleto" para criar</p></div>
            ` : boletos.map(b => `
                <div class="mdp-list-item">
                    <div class="mdp-list-item-info">
                        <h5>${b.tipo === 'anuidade' ? '📄 Anuidade' : b.tipo === 'mensalidade' ? '📑 Mensalidade' : '📋 Taxa'} — ${b.referencia || ''} ${b.ano || ''}</h5>
                        <p>Vencimento: ${fmtDate(b.data_vencimento)} | Valor: R$ ${parseFloat(b.valor || 0).toFixed(2)} | <span class="badge ${b.status === 'pago' ? 'badge-paga' : b.status === 'vencido' ? 'badge-vencida' : 'badge-pendente'}">${(b.status || 'pendente').toUpperCase()}</span></p>
                        ${b.data_pagamento ? `<p style="color:#0f9d58;font-size:0.7rem;">✓ Pago em ${fmtDate(b.data_pagamento)} — R$ ${parseFloat(b.valor_pago || 0).toFixed(2)}</p>` : ''}
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
                <button class="btn-admin-primary" style="font-size:0.78rem;padding:8px 16px;" onclick="openCredencialModal(${m.id})"><i class="fas fa-plus"></i> Nova Credencial</button>
            </div>

            ${creds.length === 0 ? `
                <div class="mdp-empty"><i class="fas fa-id-badge"></i><p>Nenhuma credencial emitida</p><p style="font-size:0.72rem;color:#bbb;margin-top:4px;">Clique em "Nova Credencial" para emitir</p></div>
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

    else if (tab === 'observacoes') {
        content.innerHTML = `
            <div class="mdp-section-title" style="margin-top:0;"><i class="fas fa-sticky-note"></i> Observações Administrativas</div>
            <p style="font-size:0.78rem;color:var(--admin-gray);margin-bottom:14px;">Anotações internas visíveis apenas para administradores. Use para registrar informações relevantes sobre o membro.</p>
            <div class="mdp-obs-area">
                <textarea class="mdp-obs-textarea" id="mdpObsTexto" placeholder="Digite suas observações sobre este membro...">${m.observacoes_admin || ''}</textarea>
                <div class="mdp-obs-save">
                    <button class="btn-admin-primary" onclick="salvarObservacoesMembro(${m.id})"><i class="fas fa-save"></i> Salvar Observações</button>
                </div>
            </div>

            <div class="mdp-section-title"><i class="fas fa-tags"></i> Informações Rápidas</div>
            <div class="mdp-info-grid">
                <div class="mdp-info-item"><label>Status do Cadastro</label><span class="badge ${m.status === 'ATIVO' ? 'badge-ativo' : m.status === 'PENDENTE' ? 'badge-pendente' : 'badge-inativo'}">${m.status}</span></div>
                <div class="mdp-info-item"><label>Anuidade</label><span class="badge ${m.anuidade_status === 'paga' ? 'badge-paga' : m.anuidade_status === 'vencida' ? 'badge-vencida' : 'badge-pendente'}">${(m.anuidade_status || 'pendente').toUpperCase()}</span></div>
                <div class="mdp-info-item"><label>Credencial</label><span class="badge ${m.credencial_status === 'ativa' ? 'badge-ativa' : m.credencial_status === 'vencida' ? 'badge-vencida' : 'badge-pendente'}">${(m.credencial_status || 'pendente').toUpperCase()}</span></div>
                <div class="mdp-info-item"><label>Data de Cadastro</label><span>${fmtDate(m.created_at)}</span></div>
            </div>
        `;
    }
}

// ---- Upload de documento para membro ----
function uploadDocumentoMembro(membroId, docKey, docLabel) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tipo', docKey);
            const res = await fetch(`/api/admin/ministros/${membroId}/documentos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${AdminAPI.token()}` },
                body: formData
            });
            if (!res.ok) throw new Error('Erro no upload');
            showToast(`${docLabel} enviado com sucesso!`, 'success');
            openMembroDetail(membroId);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
    input.click();
}

async function doUploadDocMembro(membroId) {
    const tipo = document.getElementById('mdpDocTipo').value;
    const fileInput = document.getElementById('mdpDocFile');
    const file = fileInput.files[0];
    if (!file) return;
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);
        const res = await fetch(`/api/admin/ministros/${membroId}/documentos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AdminAPI.token()}` },
            body: formData
        });
        if (!res.ok) throw new Error('Erro no upload');
        showToast('Documento enviado com sucesso!', 'success');
        openMembroDetail(membroId);
    } catch (err) {
        showToast(err.message, 'error');
    }
    fileInput.value = '';
}

// ---- Salvar observações do membro ----
async function salvarObservacoesMembro(membroId) {
    const obs = document.getElementById('mdpObsTexto').value;
    try {
        await AdminAPI.put(`/ministros/${membroId}`, { observacoes_admin: obs });
        if (currentMembro) currentMembro.observacoes_admin = obs;
        showToast('Observações salvas!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
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
    const ok = await adminConfirm({ title: 'Excluir Boleto', message: 'Excluir este boleto permanentemente?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
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
    const ok = await adminConfirm({ title: 'Excluir Credencial', message: 'Excluir esta credencial permanentemente?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
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
        const configMap = {};
        configs.forEach(c => { configMap[c.chave] = c; });

        // Definição completa de seções
        const sections = [
            {
                id: 'site-info',
                title: 'Identidade do Site',
                subtitle: 'Nome, logo, favicon e informações gerais',
                icon: 'fas fa-globe',
                iconClass: 'icon-site',
                fields: [
                    { chave: 'nome_site', label: 'Nome do Site', type: 'text', full: true },
                    { chave: 'site_logo_url', label: 'Logo do Cabeçalho', type: 'upload', hint: 'Recomendado: 312×72px' },
                    { chave: 'site_logo_footer_url', label: 'Logo do Rodapé', type: 'upload', hint: 'Recomendado: 154×64px' },
                    { chave: 'site_favicon_url', label: 'Favicon do Site', type: 'upload', hint: 'Recomendado: 64×64px (formato quadrado)' },
                ]
            },
            {
                id: 'seo',
                title: 'SEO e Metadados',
                subtitle: 'Otimização para motores de busca',
                icon: 'fas fa-search',
                iconClass: 'icon-seo',
                fields: [
                    { chave: 'meta_description', label: 'Meta Description', type: 'textarea', full: true },
                    { chave: 'meta_keywords', label: 'Meta Keywords', type: 'text', full: true, placeholder: 'igreja, evangélica, convenção, CIEIB...' },
                    { chave: 'meta_og_image', label: 'OG Image (compartilhamento social)', type: 'upload', hint: 'Recomendado: 1200×630px' },
                ]
            },
            {
                id: 'header',
                title: 'Cabeçalho (Header)',
                subtitle: 'Personalização completa do topo do site',
                icon: 'fas fa-heading',
                iconClass: 'icon-header',
                fields: [
                    { chave: 'header_bg_color', label: 'Cor de Fundo do Header', type: 'color', placeholder: '#1a3a5c' },
                    { chave: 'header_text_color', label: 'Cor do Texto do Header', type: 'color', placeholder: '#ffffff' },
                    { chave: 'header_topbar_bg', label: 'Cor da Top Bar', type: 'color', placeholder: '#0f2440' },
                    { chave: 'header_topbar_text', label: 'Cor do Texto Top Bar', type: 'color', placeholder: '#c8a951' },
                    { chave: 'header_topbar_info', label: 'Info da Top Bar (horário etc)', type: 'text', full: true, placeholder: 'Seg a Sex: 09h às 17h | Atendimento Online' },
                    { chave: 'header_cta_text', label: 'Texto do Botão CTA', type: 'text', placeholder: 'Área do Ministro' },
                    { chave: 'header_cta_url', label: 'URL do Botão CTA', type: 'text', placeholder: '/painel-ministro.html' },
                ]
            },
            {
                id: 'hero',
                title: 'Hero (Página Inicial)',
                subtitle: 'Banner principal da home page',
                icon: 'fas fa-image',
                iconClass: 'icon-hero',
                fields: [
                    { chave: 'hero_badge', label: 'Badge / Subtítulo', type: 'text', full: true },
                    { chave: 'hero_titulo', label: 'Título Principal', type: 'textarea', full: true, placeholder: 'Linha 1\nLinha 2 (será destacada automaticamente)' },
                    { chave: 'hero_descricao', label: 'Descrição', type: 'textarea', full: true },
                    { chave: 'hero_bg_image', label: 'Imagem de Fundo do Hero', type: 'upload', hint: 'Recomendado: 1920×1080px ou maior' },
                    { chave: 'hero_bg_overlay', label: 'Cor do Overlay', type: 'color', placeholder: 'rgba(15,36,64,0.85)' },
                ]
            },
            {
                id: 'contact',
                title: 'Informações de Contato',
                subtitle: 'Telefone, email, endereço e mapa',
                icon: 'fas fa-phone-alt',
                iconClass: 'icon-contact',
                fields: [
                    { chave: 'site_telefone', label: 'Telefone Principal', type: 'text' },
                    { chave: 'site_email', label: 'Email Principal', type: 'text' },
                    { chave: 'site_email_atendimento', label: 'Email de Atendimento', type: 'text' },
                    { chave: 'site_whatsapp', label: 'WhatsApp (com DDI)', type: 'text', placeholder: '5511999999999' },
                    { chave: 'site_whatsapp_display', label: 'WhatsApp para Exibição', type: 'text', placeholder: '(11) 99999-9999' },
                    { chave: 'site_endereco', label: 'Endereço Completo (aceita HTML)', type: 'textarea', full: true },
                    { chave: 'site_horario', label: 'Horário de Funcionamento', type: 'text', full: true },
                    { chave: 'site_maps_embed', label: 'Embed do Google Maps (iframe)', type: 'textarea', full: true },
                ]
            },
            {
                id: 'footer',
                title: 'Rodapé (Footer)',
                subtitle: 'Personalização completa do rodapé',
                icon: 'fas fa-grip-lines',
                iconClass: 'icon-footer',
                fields: [
                    { chave: 'footer_sobre', label: 'Texto "Sobre" no Rodapé', type: 'textarea', full: true },
                    { chave: 'footer_copyright', label: 'Texto de Copyright', type: 'text', full: true },
                    { chave: 'footer_bg_color', label: 'Cor de Fundo do Rodapé', type: 'color', placeholder: '#0f2440' },
                    { chave: 'footer_text_color', label: 'Cor do Texto do Rodapé', type: 'color', placeholder: '#c8a951' },
                    { chave: 'footer_link1_text', label: 'Link Extra 1 — Texto', type: 'text' },
                    { chave: 'footer_link1_url', label: 'Link Extra 1 — URL', type: 'text' },
                    { chave: 'footer_link2_text', label: 'Link Extra 2 — Texto', type: 'text' },
                    { chave: 'footer_link2_url', label: 'Link Extra 2 — URL', type: 'text' },
                ]
            },
            {
                id: 'stats',
                title: 'Estatísticas / Contadores',
                subtitle: 'Números exibidos na home page',
                icon: 'fas fa-chart-bar',
                iconClass: 'icon-stats',
                fields: [
                    { chave: 'stat_igrejas', label: 'Igrejas Afiliadas', type: 'text' },
                    { chave: 'stat_ministros', label: 'Ministros Credenciados', type: 'text' },
                    { chave: 'stat_estados', label: 'Estados Alcançados', type: 'text' },
                    { chave: 'stat_convencoes', label: 'Convenções Regionais', type: 'text' },
                ]
            },
        ];

        let html = '';
        const rendered = new Set();

        for (const sec of sections) {
            html += `<div class="config-section" id="configSec-${sec.id}">
                <div class="config-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <div class="config-section-icon ${sec.iconClass}"><i class="${sec.icon}"></i></div>
                    <h4>${sec.title}<small>${sec.subtitle}</small></h4>
                    <span class="config-section-toggle"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="config-section-body">`;

            for (const f of sec.fields) {
                rendered.add(f.chave);
                const val = configMap[f.chave]?.valor || '';
                const desc = configMap[f.chave]?.descricao || f.label;
                const fullClass = f.full ? ' full-width' : '';
                const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : '';

                if (f.type === 'textarea') {
                    // Converter HTML para texto legível no admin
                    let displayVal = val.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?span[^>]*>/gi, '');
                    html += `<div class="admin-form-group${fullClass}">
                        <label>${desc} <span class="config-key">(${f.chave})</span></label>
                        <textarea class="config-input" data-chave="${f.chave}" rows="3"${ph}>${displayVal}</textarea>
                    </div>`;
                } else if (f.type === 'color') {
                    html += `<div class="admin-form-group${fullClass}">
                        <label>${desc} <span class="config-key">(${f.chave})</span></label>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <input type="text" class="config-input" data-chave="${f.chave}" value="${val.replace(/"/g, '&quot;')}" style="flex:1;"${ph}>
                            <input type="color" value="${val && val.startsWith('#') ? val : '#1a3a5c'}" onchange="this.previousElementSibling.value=this.value" style="width:42px;height:38px;border:1.5px solid #ddd;border-radius:8px;padding:2px;cursor:pointer;">
                        </div>
                    </div>`;
                } else if (f.type === 'upload') {
                    const hintHtml = f.hint ? `<small class="config-upload-hint" style="display:block;color:#888;font-size:12px;margin-top:4px;">${f.hint}</small>` : '';
                    html += `<div class="admin-form-group full-width">
                        <label>${desc} <span class="config-key">(${f.chave})</span></label>
                        ${hintHtml}
                        <input type="hidden" class="config-input" data-chave="${f.chave}" id="cfgUpload_${f.chave}" value="${val.replace(/"/g, '&quot;')}">
                        <div class="admin-upload-box" id="cfgUpload_${f.chave}_box">
                            <div class="admin-upload-preview" id="cfgUpload_${f.chave}_preview" style="${val ? '' : 'display:none;'}">
                                <img id="cfgUpload_${f.chave}_img" src="${val || ''}" alt="Preview">
                                <button type="button" class="admin-upload-remove" onclick="adminRemoveImage('cfgUpload_${f.chave}')" title="Remover"><i class="fas fa-times"></i></button>
                            </div>
                            <div class="admin-upload-area" id="cfgUpload_${f.chave}_area" style="${val ? 'display:none;' : ''}">
                                <input type="file" id="cfgUpload_${f.chave}_file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon" onchange="adminUploadFile('cfgUpload_${f.chave}')" style="display:none;">
                                <div class="admin-upload-placeholder" onclick="document.getElementById('cfgUpload_${f.chave}_file').click()">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <span>Clique para enviar imagem do dispositivo</span>
                                    <small>JPG, PNG, WebP, GIF, SVG ou ICO (máx. 5MB)</small>
                                </div>
                            </div>
                            <div class="admin-upload-loading" id="cfgUpload_${f.chave}_loading" style="display:none;">
                                <i class="fas fa-spinner fa-spin"></i> Enviando...
                            </div>
                        </div>
                    </div>`;
                } else {
                    html += `<div class="admin-form-group${fullClass}">
                        <label>${desc} <span class="config-key">(${f.chave})</span></label>
                        <input type="text" class="config-input" data-chave="${f.chave}" value="${val.replace(/"/g, '&quot;')}"${ph}>
                    </div>`;
                }
            }

            html += '</div></div>';
        }

        // Qualquer chave restante não agrupada
        const extras = configs.filter(c => !rendered.has(c.chave));
        if (extras.length > 0) {
            html += `<div class="config-section">
                <div class="config-section-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <div class="config-section-icon icon-site"><i class="fas fa-cog"></i></div>
                    <h4>Outras Configurações<small>Chaves personalizadas</small></h4>
                    <span class="config-section-toggle"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="config-section-body">`;
            for (const c of extras) {
                html += `<div class="admin-form-group">
                    <label>${c.descricao || c.chave} <span class="config-key">(${c.chave})</span></label>
                    <input type="text" class="config-input" data-chave="${c.chave}" value="${(c.valor || '').replace(/"/g, '&quot;')}">
                </div>`;
            }
            html += '</div></div>';
        }

        el.innerHTML = html;
    } catch (err) { showToast('Erro ao carregar configurações', 'error'); }
}

async function saveConfiguracoes() {
    const inputs = document.querySelectorAll('.config-input');
    const configs = Array.from(inputs).map(i => {
        let valor = i.value;
        // Textarea: converter quebras de linha reais em <br>
        if (i.tagName === 'TEXTAREA') {
            valor = valor.replace(/\n/g, '<br>');
        }
        // hero_titulo: segunda linha automaticamente envolta em <span> para destaque
        if (i.dataset.chave === 'hero_titulo' && valor.includes('<br>')) {
            const parts = valor.split('<br>');
            const first = parts.shift();
            const rest = parts.join('<br>');
            // Só envolve se ainda não tem <span>
            if (!rest.includes('<span>')) {
                valor = first + '<br><span>' + rest + '</span>';
            }
        }
        return { chave: i.dataset.chave, valor };
    });
    try {
        await AdminAPI.put('/configuracoes', { configs });
        showToast('Configurações salvas! As alterações já refletem no site.', 'success');
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
    const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}) : '';
    const fmtSize = s => s >= 1048576 ? (s/1048576).toFixed(1)+' MB' : (s/1024).toFixed(1)+' KB';
    const tipoIcon = t => t === 'imagem' ? 'fa-image' : 'fa-file-pdf';
    const tipoColor = t => t === 'imagem' ? '#0e7490' : '#d93025';
    el.innerHTML = allMidias.map(m => `
        <div class="midia-item">
            <div class="midia-thumb">${m.tipo === 'imagem'
                ? `<img src="${m.url}" alt="${m.titulo}" loading="lazy">`
                : `<i class="fas ${tipoIcon(m.tipo)}" style="font-size:2rem;color:${tipoColor(m.tipo)}"></i>`}</div>
            <div class="midia-info">
                <h5>${m.titulo}</h5>
                <p style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span class="badge" style="background:${m.tipo==='imagem'?'#e0f7fa':'#fce8e8'};color:${tipoColor(m.tipo)};font-size:0.65rem;"><i class="fas ${tipoIcon(m.tipo)}"></i> ${m.tipo}</span>
                    <span style="color:#888;font-size:0.75rem;">${fmtSize(m.tamanho || 0)}</span>
                    <span style="color:#aaa;font-size:0.7rem;">${fmtDt(m.created_at)}</span>
                </p>
                ${m.descricao ? `<p style="font-size:0.75rem;color:#666;margin-top:2px;">${m.descricao}</p>` : ''}
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
        <div class="admin-form-group"><label>Título *</label><input type="text" id="mMidiaTitulo" placeholder="Ex: Logo Convenção 2026"></div>
        <div class="admin-form-group"><label>Descrição (opcional)</label><textarea id="mMidiaDesc" rows="2" placeholder="Breve descrição da mídia..."></textarea></div>
        <div class="admin-form-group">
            <label>Arquivo *</label>
            <div id="mMidiaDropZone" style="border:2px dashed #ccc;border-radius:10px;padding:30px;text-align:center;cursor:pointer;transition:all .2s;background:#fafbfc;"
                 onclick="document.getElementById('mMidiaArquivo').click()"
                 ondragover="event.preventDefault();this.style.borderColor='var(--admin-primary)';this.style.background='#f0f4f8';"
                 ondragleave="this.style.borderColor='#ccc';this.style.background='#fafbfc';"
                 ondrop="event.preventDefault();this.style.borderColor='#ccc';this.style.background='#fafbfc';document.getElementById('mMidiaArquivo').files=event.dataTransfer.files;midiaFilePreview();">
                <div id="mMidiaPreview" style="display:none;margin-bottom:12px;"></div>
                <div id="mMidiaPlaceholder">
                    <i class="fas fa-cloud-upload-alt" style="font-size:2.5rem;color:#aaa;"></i>
                    <p style="margin:8px 0 4px;color:#555;font-weight:600;">Clique ou arraste um arquivo</p>
                    <small style="color:#999;">Imagens (JPG, PNG, WebP, GIF) ou Documentos (PDF, DOC, DOCX)</small><br>
                    <small style="color:#bbb;">Tamanho máximo: 5 MB</small>
                </div>
            </div>
            <input type="file" id="mMidiaArquivo" accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx" style="display:none;" onchange="midiaFilePreview()">
        </div>
    `;
    document.getElementById('modalFooter').innerHTML = `
        <button class="btn-admin-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-admin-primary" onclick="uploadMidia()"><i class="fas fa-cloud-upload-alt"></i> Enviar</button>
    `;
    openModal();
}

function midiaFilePreview() {
    const file = document.getElementById('mMidiaArquivo').files[0];
    const preview = document.getElementById('mMidiaPreview');
    const placeholder = document.getElementById('mMidiaPlaceholder');
    if (!file) { preview.style.display = 'none'; placeholder.style.display = ''; return; }
    const fmtSize = s => s >= 1048576 ? (s/1048576).toFixed(1)+' MB' : (s/1024).toFixed(1)+' KB';
    if (file.size > 5 * 1024 * 1024) { showToast('Arquivo muito grande. Máximo 5 MB.', 'error'); document.getElementById('mMidiaArquivo').value = ''; return; }
    placeholder.style.display = 'none';
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.innerHTML = `<img src="${e.target.result}" style="max-height:120px;border-radius:8px;margin-bottom:8px;"><br><span style="font-size:0.85rem;color:#555;"><i class="fas fa-image" style="color:#0e7490;"></i> ${file.name} <small style="color:#999;">(${fmtSize(file.size)})</small></span>`;
            preview.style.display = '';
        };
        reader.readAsDataURL(file);
    } else {
        const icon = file.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-word';
        const color = file.name.endsWith('.pdf') ? '#d93025' : '#1a73e8';
        preview.innerHTML = `<i class="fas ${icon}" style="font-size:2.5rem;color:${color};"></i><br><span style="font-size:0.85rem;color:#555;">${file.name} <small style="color:#999;">(${fmtSize(file.size)})</small></span>`;
        preview.style.display = '';
    }
    // Auto-fill title if empty
    const titleInput = document.getElementById('mMidiaTitulo');
    if (!titleInput.value) titleInput.value = file.name.replace(/\.[^.]+$/, '');
}

async function uploadMidia() {
    const file = document.getElementById('mMidiaArquivo').files[0];
    if (!file) { showToast('Selecione um arquivo', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Arquivo muito grande. Máximo 5 MB.', 'error'); return; }
    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('titulo', document.getElementById('mMidiaTitulo').value || file.name);
    formData.append('descricao', document.getElementById('mMidiaDesc').value || '');
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
    const ok = await adminConfirm({ title: 'Excluir Mídia', message: 'Excluir esta mídia permanentemente?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
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
    const tipoBadge = { info:'badge-info-notif', success:'badge-ativo', warning:'badge-warning', error:'badge-inativo', evento:'badge-evento-notif', curso:'badge-curso-notif', destaque:'badge-destaque' };
    const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    const now = new Date();
    el.innerHTML = `<table class="admin-table"><thead><tr><th>Título</th><th>Mensagem</th><th>Tipo</th><th>Vigência</th><th>Ativa</th><th>Ações</th></tr></thead><tbody>
        ${allNotifSite.map(n => {
            const inicio = n.data_inicio ? new Date(n.data_inicio) : null;
            const fim = n.data_fim ? new Date(n.data_fim) : null;
            const expirada = fim && fim < now;
            const aindaNao = inicio && inicio > now;
            let statusLabel = n.ativa ? '<span class="badge badge-ativo">Ativa</span>' : '<span class="badge badge-inativo">Inativa</span>';
            if (n.ativa && expirada) statusLabel = '<span class="badge badge-warning">Expirada</span>';
            if (n.ativa && aindaNao) statusLabel = '<span class="badge badge-warning">Agendada</span>';
            return `<tr>
            <td><strong>${n.titulo}</strong></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n.mensagem || ''}</td>
            <td><span class="badge ${tipoBadge[n.tipo] || 'badge-ativo'}">${tipoLabels[n.tipo] || n.tipo}</span></td>
            <td style="font-size:0.78rem;line-height:1.4;">${fmtDt(n.data_inicio)}<br>${fim ? '→ ' + fmtDt(n.data_fim) : '<span style="color:#aaa">Sem fim</span>'}</td>
            <td>${statusLabel}</td>
            <td class="actions-cell">
                <button class="btn-table-action btn-table-edit" onclick="openNotifSiteModal(${n.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-table-action btn-table-delete" onclick="deleteItem('notificacoes-site', ${n.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
        }).join('')}
    </tbody></table>`;
}

function openNotifSiteModal(id) {
    const item = id ? allNotifSite.find(n => n.id === id) : null;
    const fmtDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
    const fmtDtBr = d => d ? new Date(d).toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
    const tipoIcons = { info:'fa-info-circle', success:'fa-check-circle', warning:'fa-exclamation-triangle', error:'fa-exclamation-circle', evento:'fa-calendar-alt', curso:'fa-graduation-cap', destaque:'fa-star' };
    const tipoBgs = { info:'#1a4a7a', success:'#047857', warning:'#b45309', error:'#b91c1c', evento:'#6d28d9', curso:'#0e7490', destaque:'linear-gradient(135deg,#1a3a5c,#c8a951)' };
    const tipoNames = { info:'Informação', success:'Sucesso', warning:'Aviso', error:'Urgente', evento:'Evento', curso:'Curso', destaque:'Destaque' };

    const now = new Date();
    const inicio = item?.data_inicio ? new Date(item.data_inicio) : null;
    const fim = item?.data_fim ? new Date(item.data_fim) : null;
    const expirada = fim && fim < now;
    const agendada = inicio && inicio > now;
    let vigencia = item?.ativa ? '🟢 Visível agora' : '⚪ Desativada';
    let vigCor = item?.ativa ? '#27ae60' : '#aaa';
    if (item?.ativa && expirada) { vigencia = '🟡 Expirada'; vigCor = '#f39c12'; }
    if (item?.ativa && agendada) { vigencia = '🔵 Agendada'; vigCor = '#3498db'; }

    document.getElementById('modalTitle').textContent = item ? 'Editar Notificação do Site' : 'Nova Notificação do Site';
    document.getElementById('modalBody').innerHTML = `
        ${item ? `<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:${vigCor}">${vigencia}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Situação</div>
            </div>
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:18px;"><i class="fas ${tipoIcons[item.tipo] || 'fa-info-circle'}" style="color:${tipoBgs[item.tipo] || '#1a4a7a'}"></i> ${tipoNames[item.tipo] || item.tipo}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Tipo</div>
            </div>
            <div style="flex:1;min-width:110px;background:#f0f4f8;border-radius:8px;padding:12px;text-align:center;">
                <div style="font-size:14px;font-weight:600;color:#555">${fmtDtBr(item.created_at)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">Criada em</div>
            </div>
        </div>
        <div style="margin-bottom:18px;border-radius:10px;overflow:hidden;color:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px;background:${tipoBgs[item.tipo] || '#1a4a7a'};">
            <i class="fas ${tipoIcons[item.tipo] || 'fa-info-circle'}" style="font-size:20px;opacity:0.9;"></i>
            <div style="flex:1;">
                <strong style="font-size:0.95rem;">${item.titulo}</strong>
                ${item.mensagem ? `<span style="margin-left:8px;opacity:0.9;font-size:0.85rem;">${item.mensagem}</span>` : ''}
            </div>
            ${item.link ? `<span style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:6px;font-size:0.78rem;">Saiba mais →</span>` : ''}
        </div>` : ''}
        <div class="admin-form-group"><label>Título *</label><input type="text" id="mNotifTitle" value="${item?.titulo || ''}" placeholder="Ex: 15ª Convenção Nacional"></div>
        <div class="admin-form-group"><label>Mensagem</label><textarea id="mNotifMsg" rows="2" placeholder="Ex: Inscrições abertas até 30 de agosto!">${item?.mensagem || ''}</textarea></div>
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
    const ok = await adminConfirm({ title: 'Excluir Item', message: 'Tem certeza que deseja excluir este item?', type: 'danger', confirmText: 'Excluir' });
    if (!ok) return;
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

function adminConfirm({ title = 'Confirmar', message = 'Tem certeza?', type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('adminConfirmOverlay');
        const iconEl = document.getElementById('confirmIcon');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const btnOk = document.getElementById('confirmBtnOk');
        const btnCancel = document.getElementById('confirmBtnCancel');

        const icons = { warning: 'exclamation-triangle', danger: 'trash-alt', info: 'info-circle', success: 'check-circle' };
        iconEl.className = `admin-confirm-icon icon-${type}`;
        iconEl.innerHTML = `<i class="fas fa-${icons[type] || icons.warning}"></i>`;
        titleEl.textContent = title;
        msgEl.textContent = message;
        btnOk.textContent = confirmText;
        btnOk.className = `admin-confirm-btn admin-confirm-ok btn-${type}`;
        btnCancel.textContent = cancelText;
        overlay.classList.add('active');

        function cleanup(result) {
            overlay.classList.remove('active');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            overlay.removeEventListener('click', onOverlay);
            document.removeEventListener('keydown', onKey);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlay(e) { if (e.target === overlay) cleanup(false); }
        function onKey(e) { if (e.key === 'Escape') cleanup(false); }

        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        overlay.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onKey);
    });
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
