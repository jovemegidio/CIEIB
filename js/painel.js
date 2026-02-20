/* ==============================================================
   PAINEL DO MINISTRO — JAVASCRIPT
   ============================================================== */

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initDragDrop();
    initDateTime();
    initMobileNav();
    initUserName();
    checkAuth();
});

// ---- Verificação de Login ----
function checkAuth() {
    const loggedIn = sessionStorage.getItem('cieib_logado');
    if (!loggedIn) {
        window.location.href = 'area-do-ministro.html';
    }
}

// ---- Mobile Nav Toggle ----
function initMobileNav() {
    const toggle = document.getElementById('painelMobileToggle');
    const nav = document.getElementById('painelNav');
    if (!toggle || !nav) return;

    // Create overlay
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
        if (nav.classList.contains('active')) {
            closeNav();
        } else {
            openNav();
        }
    });

    overlay.addEventListener('click', closeNav);

    // Mobile dropdown toggle
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

    // Close nav on window resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeNav();
            dropdowns.forEach(function(d) { d.classList.remove('active'); });
        }
    });
}

// ---- User Name Display ----
function initUserName() {
    const el = document.getElementById('painelUserName');
    if (!el) return;
    const span = el.querySelector('span');
    if (!span) return;
    const nome = sessionStorage.getItem('cieib_usuario') || '';
    // Show first name only
    const primeiro = nome.split(' ')[0];
    span.textContent = primeiro || 'Ministro';
}

// ---- Tabs ----
function initTabs() {
    const tabs = document.querySelectorAll('.ptab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');

            // Remove active
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Set active
            this.classList.add('active');
            const panel = document.getElementById('tab-' + target);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}

// ---- Drag & Drop ----
function initDragDrop() {
    const dropArea = document.getElementById('dragDropArea');
    if (!dropArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('drag-over');
        });
    });

    dropArea.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    const fileInput = document.getElementById('fotoUpload');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFileUpload(this.files[0]);
            }
        });
    }
}

function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const dropArea = document.getElementById('dragDropArea');
        dropArea.innerHTML = `
            <img src="${e.target.result}" style="max-width:100%;max-height:200px;border-radius:8px;">
            <p style="margin-top:10px;font-size:0.82rem;color:var(--primary);">${file.name}</p>
        `;
        showToast('Foto carregada com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
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

// ---- Salvar Dados ----
function salvarDados() {
    // Simulação de salvar
    const btn = document.querySelector('.phb-btn-save');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        showToast('Dados salvos com sucesso!', 'success');
    }, 1500);
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

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
