/* ============================================
   CIEIB - Main JavaScript
   ============================================ */

// ---- Utilitário global: escapar HTML para prevenir XSS ----
function escHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
    // ===== Mobile Navigation =====
    const mobileToggle = document.getElementById('mobileToggle');
    const nav = document.getElementById('nav');

    // Create overlay for mobile nav
    let navOverlay = document.querySelector('.nav-overlay');
    if (!navOverlay && mobileToggle) {
        navOverlay = document.createElement('div');
        navOverlay.className = 'nav-overlay';
        document.body.appendChild(navOverlay);
    }

    function closeMainNav() {
        if (mobileToggle) {
            mobileToggle.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
        if (nav) nav.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.addEventListener('click', () => {
            const isOpen = nav.classList.contains('active');
            if (isOpen) {
                closeMainNav();
            } else {
                mobileToggle.classList.add('active');
                mobileToggle.setAttribute('aria-expanded', 'true');
                nav.classList.add('active');
                if (navOverlay) navOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMainNav);
    }

    // Mobile dropdown toggle
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector(':scope > a');
        if (link) {
            link.setAttribute('aria-haspopup', 'true');
            link.setAttribute('aria-expanded', 'false');
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                    link.setAttribute('aria-expanded', dropdown.classList.contains('active').toString());
                }
            });
        }
    });

    // Close nav on link click (mobile)
    const navLinks = document.querySelectorAll('.nav-list a:not(.dropdown > a)');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMainNav();
            }
        });
    });

    // ===== Header Scroll Effect =====
    const header = document.getElementById('header');
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        lastScrollY = scrollY;
    });

    // ===== Back to Top Button =====
    const backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Counter Animation (com sufixo "+") =====
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-target'));
        if (!target || target <= 0) return;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                el.textContent = target.toLocaleString('pt-BR') + '+';
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current).toLocaleString('pt-BR');
            }
        }, 16);
    };

    // Aguardar loadStats() do index.html antes de iniciar contadores
    // O observer só dispara quando o elemento fica visível, então o API já terá retornado
    function initCounterObserver() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(num => counterObserver.observe(num));
    }

    // Pequeno delay para permitir que loadStats() do index.html atualize data-target
    if (statNumbers.length > 0) {
        setTimeout(initCounterObserver, 300);
    }

    // ===== Fade-in Animation =====
    const fadeElements = document.querySelectorAll('.fade-in');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => fadeObserver.observe(el));

    // Auto add fade-in to major sections
    const sections = document.querySelectorAll(
        '.evento-card, .resolucao-card, .noticia-card, .team-card, .stat-item, .convencoes-content, .contact-info-card'
    );

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                sectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    sections.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        sectionObserver.observe(el);
    });

    // ===== Hero Particles =====
    const particlesContainer = document.getElementById('particles');

    if (particlesContainer) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = (Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // ===== Newsletter Form =====
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]');
            const btn = newsletterForm.querySelector('button');
            if (!email || !email.value) return;

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            btn.disabled = true;

            try {
                const resp = await fetch('/api/contato/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.value })
                });
                if (!resp.ok) throw new Error('Erro ao cadastrar');
                btn.innerHTML = '<i class="fas fa-check"></i> Cadastrado!';
                btn.style.background = '#28a745';
                btn.style.borderColor = '#28a745';
                email.value = '';
            } catch (err) {
                btn.innerHTML = '<i class="fas fa-times"></i> Erro!';
                btn.style.background = '#dc3545';
                btn.style.borderColor = '#dc3545';
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.disabled = false;
            }, 3000);
        });
    }

    // ===== Contact Form — handled per-page via API (see contato.html) =====
    // main.js no longer handles the contact form submission.
    // Each page includes its own API-powered form handler.

    // ===== Smooth Scroll for Anchor Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return; // ignorar links vazios
            try {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch { /* seletor inválido */ }
        });
    });

    // ===== Active nav link highlight =====
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-list a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });

    // ===== PUSH NOTIFICATIONS BAR (site público) =====
    loadSiteNotifications();

    // ===== CARREGAMENTO DINÂMICO DE CONFIGURAÇÕES =====
    loadSiteConfig().finally(() => {
        document.body.classList.add('site-ready');
    });

    // Fallback: garantir que a página aparece mesmo se a API falhar/demorar
    setTimeout(() => {
        document.body.classList.add('site-ready');
    }, 2000);
});

// ---- Push Notification Bar para o site público (design profissional) ----
async function loadSiteNotifications() {
    try {
        let notifs;
        if (typeof API !== 'undefined' && API.getNotificacoesSite) {
            notifs = await API.getNotificacoesSite();
        } else {
            const res = await fetch('/api/notificacoes/site');
            if (!res.ok) return;
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) return;
            notifs = await res.json();
        }
        if (!notifs || notifs.length === 0) return;

        const dismissed = JSON.parse(sessionStorage.getItem('cieib_notifs_dismissed') || '[]');
        const pending = notifs.filter(n => !dismissed.includes(n.id));
        if (pending.length === 0) return;

        const tipoConfig = {
            'info':    { bg: 'snb-bg-info',    icon: 'fa-info-circle',           badge: 'Informação' },
            'success': { bg: 'snb-bg-success',  icon: 'fa-check-circle',          badge: 'Novidade' },
            'warning': { bg: 'snb-bg-warning',  icon: 'fa-exclamation-triangle',  badge: 'Atenção' },
            'error':   { bg: 'snb-bg-error',    icon: 'fa-exclamation-circle',    badge: 'Urgente' },
            'evento':  { bg: 'snb-bg-evento',   icon: 'fa-calendar-alt',          badge: 'Evento' },
            'curso':   { bg: 'snb-bg-curso',    icon: 'fa-graduation-cap',        badge: 'Curso' },
            'destaque':{ bg: 'snb-bg-destaque', icon: 'fa-star',                  badge: 'Destaque' }
        };

        const bar = document.createElement('div');
        bar.className = 'site-notification-bar';
        bar.id = 'siteNotifBar';

        let currentIdx = 0;

        function renderNotif(idx) {
            const n = pending[idx];
            const cfg = tipoConfig[n.tipo] || tipoConfig['info'];
            bar.className = 'site-notification-bar ' + cfg.bg;

            let dotsHtml = '';
            if (pending.length > 1) {
                dotsHtml = '<div class="snb-dots">' +
                    pending.map((_, i) => `<span class="snb-dot ${i === idx ? 'active' : ''}" data-idx="${i}"></span>`).join('') +
                    '</div>';
            }

            bar.innerHTML = `
                <div class="container">
                    <div class="snb-inner">
                        <div class="snb-icon-wrap"><i class="fas ${escHtml(cfg.icon)}"></i></div>
                        <span class="snb-badge">${escHtml(cfg.badge)}</span>
                        <div class="snb-text">
                            <strong>${escHtml(n.titulo)}</strong>
                            <span>${escHtml(n.mensagem || '')}</span>
                        </div>
                        ${n.link ? `<a href="${escHtml(n.link)}" class="snb-cta">Saiba mais <i class="fas fa-arrow-right"></i></a>` : ''}
                        ${dotsHtml}
                        <button class="snb-close" aria-label="Fechar notificação" data-id="${n.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;

            // Bind close button
            bar.querySelector('.snb-close').addEventListener('click', function() {
                dismissSiteNotif(parseInt(this.dataset.id));
            });

            // Bind dot navigation with smooth transition
            bar.querySelectorAll('.snb-dot').forEach(dot => {
                dot.addEventListener('click', function() {
                    const newIdx = parseInt(this.dataset.idx);
                    if (newIdx === currentIdx) return;

                    const inner = bar.querySelector('.snb-inner');
                    const goRight = newIdx > currentIdx;

                    if (inner) {
                        inner.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)';
                        inner.style.opacity = '0';
                        inner.style.transform = goRight ? 'translateX(-25px)' : 'translateX(25px)';

                        setTimeout(() => {
                            currentIdx = newIdx;
                            const n = pending[currentIdx];
                            const cfg = tipoConfig[n.tipo] || tipoConfig['info'];
                            bar.style.transition = 'background 0.5s ease';
                            bar.className = 'site-notification-bar ' + cfg.bg;
                            renderNotif(currentIdx);

                            const newInner = bar.querySelector('.snb-inner');
                            if (newInner) {
                                newInner.style.transition = 'none';
                                newInner.style.opacity = '0';
                                newInner.style.transform = goRight ? 'translateX(25px)' : 'translateX(-25px)';
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        newInner.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)';
                                        newInner.style.opacity = '1';
                                        newInner.style.transform = 'translateX(0)';
                                    });
                                });
                            }
                        }, 360);
                    } else {
                        currentIdx = newIdx;
                        renderNotif(currentIdx);
                    }
                });
            });
        }

        renderNotif(0);

        // Insert after top-bar
        const topBar = document.querySelector('.top-bar');
        if (topBar && topBar.nextSibling) {
            topBar.parentNode.insertBefore(bar, topBar.nextSibling);
        } else {
            document.body.prepend(bar);
        }

        // Auto-rotate if multiple notifications with smooth crossfade
        if (pending.length > 1) {
            function rotateNotif() {
                const inner = bar.querySelector('.snb-inner');
                if (!inner) return;

                // Fade out + slide left
                inner.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)';
                inner.style.opacity = '0';
                inner.style.transform = 'translateX(-30px)';

                setTimeout(() => {
                    // Update index and re-render
                    currentIdx = (currentIdx + 1) % pending.length;
                    const n = pending[currentIdx];
                    const cfg = tipoConfig[n.tipo] || tipoConfig['info'];

                    // Smooth background transition (bar stays in place)
                    bar.style.transition = 'background 0.6s ease';
                    bar.className = 'site-notification-bar ' + cfg.bg;

                    renderNotif(currentIdx);

                    // Position new content offscreen-right
                    const newInner = bar.querySelector('.snb-inner');
                    if (newInner) {
                        newInner.style.transition = 'none';
                        newInner.style.opacity = '0';
                        newInner.style.transform = 'translateX(30px)';

                        // Slide in from right
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                newInner.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)';
                                newInner.style.opacity = '1';
                                newInner.style.transform = 'translateX(0)';
                            });
                        });
                    }
                }, 420);
            }

            let rotateTimer = setInterval(rotateNotif, 6000);

            // Pause rotation on hover
            bar.addEventListener('mouseenter', () => clearInterval(rotateTimer));
            bar.addEventListener('mouseleave', () => {
                rotateTimer = setInterval(rotateNotif, 6000);
            });
        }

    } catch (err) {
        // Silently fail if API unavailable
    }
}

function dismissSiteNotif(id) {
    const dismissed = JSON.parse(sessionStorage.getItem('cieib_notifs_dismissed') || '[]');
    dismissed.push(id);
    sessionStorage.setItem('cieib_notifs_dismissed', JSON.stringify(dismissed));

    const bar = document.getElementById('siteNotifBar');
    if (bar) {
        bar.style.transform = 'translateY(-100%)';
        bar.style.opacity = '0';
        bar.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
        setTimeout(() => bar.remove(), 400);
    }
}

// ---- Carregamento dinâmico das configurações do site ----
async function loadSiteConfig() {
    try {
        let config, redes;

        // Buscar todas as configurações
        if (typeof API !== 'undefined' && API.getConfigAll) {
            config = await API.getConfigAll();
        } else {
            const res = await fetch('/api/dashboard/config-all');
            if (res.ok) config = await res.json();
        }

        // Buscar redes sociais
        try {
            if (typeof API !== 'undefined' && API.getRedesSociais) {
                redes = await API.getRedesSociais();
            } else {
                const res = await fetch('/api/dashboard/redes-sociais');
                if (res.ok) redes = await res.json();
            }
        } catch (e) { redes = []; }

        if (!config) return;

        // Injetar valores em todos os elementos com data-config
        document.querySelectorAll('[data-config]').forEach(el => {
            const key = el.dataset.config;
            if (config[key] !== undefined && config[key] !== null && config[key] !== '') {
                el.textContent = config[key];
            }
        });

        // Atualizar <title> com nome_site
        if (config.nome_site) {
            const baseName = config.nome_site;
            const sigla = baseName.split(/[—:|]/)[0].trim(); // Ex: 'CIEIB'
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const isHome = !currentPage || currentPage === '' || currentPage === '/' || currentPage === 'index.html' || currentPage === 'index';
            if (isHome) {
                // Página inicial: usa o nome completo da config
                document.title = baseName;
            } else {
                // Subpáginas: formato "CIEIB: Nome da Página"
                const separatorMatch = document.title.match(/^(?:CIEIB\s*[:\u2014|\-]\s*)?(.+?)(?:\s*[:\u2014|\-]\s*CIEIB)?$/i);
                if (separatorMatch) {
                    const pageName = separatorMatch[1].trim();
                    document.title = sigla + ': ' + pageName;
                } else {
                    document.title = baseName;
                }
            }
        }

        // Atualizar meta description
        if (config.meta_description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', config.meta_description);
            } else {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                metaDesc.content = config.meta_description;
                document.head.appendChild(metaDesc);
            }
        }

        // Atualizar meta keywords
        if (config.meta_keywords) {
            let metaKw = document.querySelector('meta[name="keywords"]');
            if (!metaKw) { metaKw = document.createElement('meta'); metaKw.name = 'keywords'; document.head.appendChild(metaKw); }
            metaKw.setAttribute('content', config.meta_keywords);
        }

        // Atualizar OG Image
        if (config.meta_og_image) {
            let ogImg = document.querySelector('meta[property="og:image"]');
            if (!ogImg) { ogImg = document.createElement('meta'); ogImg.setAttribute('property', 'og:image'); document.head.appendChild(ogImg); }
            ogImg.setAttribute('content', config.meta_og_image);
        }

        // Atualizar favicon
        if (config.site_favicon_url) {
            let link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            if (link) {
                link.href = config.site_favicon_url;
            } else {
                link = document.createElement('link');
                link.rel = 'icon';
                link.href = config.site_favicon_url;
                document.head.appendChild(link);
            }
        }

        // Atualizar logo do cabeçalho (substitui ícone + texto por imagem)
        if (config.site_logo_url) {
            document.querySelectorAll('.logo, .painel-logo').forEach(el => {
                const existingImg = el.querySelector('img.logo-img');
                if (existingImg) {
                    existingImg.src = config.site_logo_url;
                } else {
                    // Esconder ícone e texto, inserir <img>
                    const logoIcon = el.querySelector('.logo-icon');
                    const logoText = el.querySelector('.logo-text');
                    if (logoIcon) logoIcon.style.display = 'none';
                    if (logoText) logoText.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = config.site_logo_url;
                    img.alt = config.nome_site || 'CIEIB';
                    img.className = 'logo-img';
                    el.insertBefore(img, el.firstChild);
                }
            });
        }
        // Atualizar logo do rodapé (usa logo próprio ou cai no do cabeçalho)
        const footerLogoUrl = config.site_logo_footer_url || config.site_logo_url;
        if (footerLogoUrl) {
            document.querySelectorAll('.footer-logo').forEach(el => {
                const existingImg = el.querySelector('img.logo-img');
                if (existingImg) {
                    existingImg.src = footerLogoUrl;
                } else {
                    // Esconder ícone e texto, inserir <img>
                    const logoIcon = el.querySelector('.logo-icon');
                    const logoSpan = el.querySelector('span');
                    if (logoIcon) logoIcon.style.display = 'none';
                    if (logoSpan) logoSpan.style.display = 'none';
                    const img = document.createElement('img');
                    img.src = footerLogoUrl;
                    img.alt = config.nome_site || 'CIEIB';
                    img.className = 'logo-img logo-img-footer';
                    el.insertBefore(img, el.firstChild);
                }
            });
        }

        // Aplicar cores do header dinamicamente
        const dynStyles = [];
        if (config.header_bg_color) dynStyles.push(`.main-nav { background: ${config.header_bg_color} !important; }`);
        if (config.header_text_color) dynStyles.push(`.main-nav .nav-link, .main-nav .logo-text { color: ${config.header_text_color} !important; }`);
        if (config.header_topbar_bg) dynStyles.push(`.top-bar { background: ${config.header_topbar_bg} !important; }`);
        if (config.header_topbar_text) dynStyles.push(`.top-bar, .top-bar a, .top-bar .top-bar-info { color: ${config.header_topbar_text} !important; }`);
        if (config.footer_bg_color) dynStyles.push(`footer, .site-footer { background: ${config.footer_bg_color} !important; }`);
        if (config.footer_text_color) dynStyles.push(`footer, .site-footer, .site-footer a, .site-footer h4, .site-footer p { color: ${config.footer_text_color} !important; }`);
        if (config.hero_bg_image) dynStyles.push(`.hero { background-image: url('${config.hero_bg_image}') !important; background-size: cover; background-position: center; }`);
        if (config.hero_bg_overlay) dynStyles.push(`.hero::before { background: ${config.hero_bg_overlay} !important; }`);

        if (dynStyles.length > 0) {
            let styleEl = document.getElementById('dynamic-config-styles');
            if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'dynamic-config-styles'; document.head.appendChild(styleEl); }
            styleEl.textContent = dynStyles.join('\n');
        }

        // Header CTA button
        if (config.header_cta_text) {
            document.querySelectorAll('.nav-cta').forEach(item => {
                const link = item.tagName === 'A' ? item : item.querySelector('a');
                if (link) {
                    // Preservar o ícone existente e só alterar o texto
                    const icon = link.querySelector('i');
                    link.textContent = ''; // limpa
                    if (icon) link.appendChild(icon);
                    link.append(' ' + config.header_cta_text);
                    if (config.header_cta_url) link.href = config.header_cta_url;
                }
            });
        }

        // Header topbar info
        if (config.header_topbar_info) {
            const tbInfo = document.querySelector('.top-bar-info');
            if (tbInfo) tbInfo.innerHTML = config.header_topbar_info;
        }

        // Footer extra links
        const footerExtra = document.getElementById('footerExtraLinks');
        if (footerExtra) {
            let linksHtml = '';
            if (config.footer_link1_text && config.footer_link1_url) linksHtml += `<li><a href="${config.footer_link1_url}">${config.footer_link1_text}</a></li>`;
            if (config.footer_link2_text && config.footer_link2_url) linksHtml += `<li><a href="${config.footer_link2_url}">${config.footer_link2_text}</a></li>`;
            if (linksHtml) footerExtra.innerHTML = linksHtml;
        }

        // Atualizar embed do Google Maps (contato.html)
        if (config.site_maps_embed) {
            const mapContainer = document.getElementById('siteMapEmbed');
            if (mapContainer) {
                mapContainer.innerHTML = config.site_maps_embed;
            }
        }

        // Atualizar redes sociais (top-bar e footer)
        if (redes && redes.length > 0) {
            const socialHtml = redes.map(r => {
                const icon = r.icone || 'fas fa-link';
                return `<a href="${r.url}" aria-label="${r.nome}" target="_blank" rel="noopener noreferrer"><i class="${icon}"></i></a>`;
            }).join('');

            const topBarSocial = document.getElementById('topBarSocial');
            if (topBarSocial) topBarSocial.innerHTML = socialHtml;

            const footerSocial = document.getElementById('footerSocial');
            if (footerSocial) footerSocial.innerHTML = socialHtml;
        }

        // Atualizar WhatsApp float
        if (config.site_whatsapp) {
            const waFloat = document.getElementById('whatsappFloat');
            if (waFloat) waFloat.href = 'https://wa.me/' + config.site_whatsapp;
        }

        // Atualizar hero (index.html)
        if (config.hero_titulo) {
            let titulo = config.hero_titulo;
            // Auto-wrap: se tem <br> mas não tem <span>, destaca a segunda linha
            if (titulo.includes('<br>') && !titulo.includes('<span>')) {
                const parts = titulo.split(/<br\s*\/?>/i);
                const first = parts.shift();
                titulo = first + '<br><span>' + parts.join('<br>') + '</span>';
            }
            const heroTitulo = document.getElementById('heroTitulo');
            if (heroTitulo) heroTitulo.innerHTML = titulo;
        }

    } catch (err) {
        // Falha silenciosa — conteúdo estático do HTML permanece como fallback
    }
}

// ================================================================
//  WIDGET DE ACESSIBILIDADE
// ================================================================
function initAccessibilityWidget() {
    // Não injetar no painel admin/ministro
    const path = window.location.pathname;
    if (path.includes('painel-admin') || path.includes('painel-ministro')) return;

    // Encontrar o top-bar-content para injetar o botão
    const topBarContent = document.querySelector('.top-bar-content');
    if (!topBarContent) return;

    // Estado salvo
    const state = JSON.parse(localStorage.getItem('cieib_a11y') || '{}');
    let zoomLevel = state.zoom || 100;

    // ---- Criar wrapper na top-bar ----
    const wrapper = document.createElement('div');
    wrapper.className = 'a11y-topbar-wrapper';

    // ---- Botão na top-bar ----
    const btn = document.createElement('button');
    btn.className = 'a11y-topbar-btn';
    btn.setAttribute('aria-label', 'Abrir painel de acessibilidade');
    btn.setAttribute('title', 'Acessibilidade');
    btn.innerHTML = '<i class="fas fa-universal-access"></i>';
    wrapper.appendChild(btn);

    // ---- Criar painel dropdown ----
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Opções de acessibilidade');
    panel.innerHTML = `
        <div class="a11y-panel-header">
            <h3><i class="fas fa-universal-access"></i> Acessibilidade</h3>
            <button class="a11y-panel-close" aria-label="Fechar painel"><i class="fas fa-times"></i></button>
        </div>
        <div class="a11y-panel-body">
            <div class="a11y-section">
                <div class="a11y-section-title">Tamanho do Texto</div>
                <div class="a11y-zoom-row">
                    <button data-a11y-zoom="-" aria-label="Diminuir texto"><i class="fas fa-minus"></i></button>
                    <span id="a11yZoomLabel">${zoomLevel}%</span>
                    <button data-a11y-zoom="+" aria-label="Aumentar texto"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="a11y-section">
                <div class="a11y-section-title">Visual</div>
                <div class="a11y-btns">
                    <button class="a11y-btn" data-a11y="high-contrast">
                        <i class="fas fa-adjust"></i>Alto Contraste
                    </button>
                    <button class="a11y-btn" data-a11y="grayscale">
                        <i class="fas fa-palette"></i>Tons de Cinza
                    </button>
                    <button class="a11y-btn" data-a11y="invert">
                        <i class="fas fa-exchange-alt"></i>Inverter Cores
                    </button>
                    <button class="a11y-btn" data-a11y="underline-links">
                        <i class="fas fa-underline"></i>Sublinhar Links
                    </button>
                </div>
            </div>
            <div class="a11y-section">
                <div class="a11y-section-title">Navegação</div>
                <div class="a11y-btns">
                    <button class="a11y-btn" data-a11y="big-cursor">
                        <i class="fas fa-mouse-pointer"></i>Cursor Grande
                    </button>
                    <button class="a11y-btn" data-a11y="stop-animations">
                        <i class="fas fa-ban"></i>Parar Animações
                    </button>
                    <button class="a11y-btn" data-a11y="reading-guide">
                        <i class="fas fa-grip-lines"></i>Guia de Leitura
                    </button>
                    <button class="a11y-btn" data-a11y="focus-mode">
                        <i class="fas fa-eye"></i>Foco na Leitura
                    </button>
                </div>
            </div>
            <button class="a11y-reset" id="a11yReset">
                <i class="fas fa-undo"></i> Restaurar Padrão
            </button>
        </div>
    `;
    wrapper.appendChild(panel);

    // Injetar na top-bar, após as redes sociais
    topBarContent.appendChild(wrapper);

    // ---- Botão mobile flutuante (top-bar fica oculta em ≤768px) ----
    const mobileFab = document.createElement('button');
    mobileFab.className = 'a11y-mobile-fab';
    mobileFab.setAttribute('aria-label', 'Acessibilidade');
    mobileFab.innerHTML = '<i class="fas fa-universal-access"></i>';
    document.body.appendChild(mobileFab);
    mobileFab.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.toggle('open');
        btn.classList.toggle('active', isOpen);
        mobileFab.classList.toggle('active', isOpen);
    });

    // ---- Guia de leitura (barra horizontal que segue o mouse) ----
    let readingGuide = null;

    function createReadingGuide() {
        if (readingGuide) return;
        readingGuide = document.createElement('div');
        readingGuide.className = 'a11y-reading-guide';
        document.body.appendChild(readingGuide);
        document.addEventListener('mousemove', moveReadingGuide);
    }
    function removeReadingGuide() {
        if (readingGuide) {
            document.removeEventListener('mousemove', moveReadingGuide);
            readingGuide.remove();
            readingGuide = null;
        }
    }
    function moveReadingGuide(e) {
        if (readingGuide) readingGuide.style.top = (e.clientY - 6) + 'px';
    }

    // ---- Aplicar / remover opção ----
    const toggles = ['high-contrast', 'grayscale', 'invert', 'underline-links', 'big-cursor', 'stop-animations', 'reading-guide', 'focus-mode'];

    function applyOption(key, active) {
        const cls = `a11y-${key}`;
        if (key === 'reading-guide') {
            active ? createReadingGuide() : removeReadingGuide();
        } else if (key === 'focus-mode') {
            // Focus mode: escurece tudo e destaca o hover
            let overlay = document.getElementById('a11yFocusOverlay');
            if (active && !overlay) {
                overlay = document.createElement('style');
                overlay.id = 'a11yFocusOverlay';
                overlay.textContent = `
                    body.a11y-focus-mode *:not(:hover):not(.a11y-panel):not(.a11y-panel *):not(.a11y-fab):not(script):not(style):not(meta):not(link):not(head):not(html):not(body) {
                        opacity: 0.4 !important;
                    }
                    body.a11y-focus-mode *:hover {
                        opacity: 1 !important;
                    }
                `;
                document.head.appendChild(overlay);
            } else if (!active && overlay) {
                overlay.remove();
            }
        }
        document.body.classList.toggle(cls, active);
        // Update button state
        const btn = panel.querySelector(`[data-a11y="${key}"]`);
        if (btn) btn.classList.toggle('active', active);
    }

    function applyZoom(level) {
        zoomLevel = Math.max(80, Math.min(150, level));
        document.documentElement.style.fontSize = zoomLevel + '%';
        const label = document.getElementById('a11yZoomLabel');
        if (label) label.textContent = zoomLevel + '%';
        saveState();
    }

    function saveState() {
        const s = { zoom: zoomLevel };
        toggles.forEach(k => { if (document.body.classList.contains(`a11y-${k}`)) s[k] = true; });
        localStorage.setItem('cieib_a11y', JSON.stringify(s));
    }

    function resetAll() {
        zoomLevel = 100;
        document.documentElement.style.fontSize = '';
        toggles.forEach(k => applyOption(k, false));
        const label = document.getElementById('a11yZoomLabel');
        if (label) label.textContent = '100%';
        localStorage.removeItem('cieib_a11y');
    }

    // ---- Restaurar estado salvo ----
    if (state.zoom && state.zoom !== 100) applyZoom(state.zoom);
    toggles.forEach(k => { if (state[k]) applyOption(k, true); });

    // ---- Event listeners ----
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = panel.classList.toggle('open');
        btn.classList.toggle('active', isOpen);
        btn.setAttribute('aria-expanded', isOpen);
    });

    panel.querySelector('.a11y-panel-close').addEventListener('click', () => {
        panel.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
    });

    // Toggle buttons
    panel.querySelectorAll('[data-a11y]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.a11y;
            const nowActive = !btn.classList.contains('active');

            // Visual filters are mutually exclusive
            const visualGroup = ['high-contrast', 'grayscale', 'invert'];
            if (visualGroup.includes(key) && nowActive) {
                visualGroup.filter(k => k !== key).forEach(k => applyOption(k, false));
            }

            applyOption(key, nowActive);
            saveState();
        });
    });

    // Zoom buttons
    panel.querySelectorAll('[data-a11y-zoom]').forEach(btn => {
        btn.addEventListener('click', () => {
            applyZoom(zoomLevel + (btn.dataset.a11yZoom === '+' ? 10 : -10));
        });
    });

    // Reset
    document.getElementById('a11yReset').addEventListener('click', resetAll);

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target) && !mobileFab.contains(e.target) && panel.classList.contains('open')) {
            panel.classList.remove('open');
            btn.classList.remove('active');
            mobileFab.classList.remove('active');
        }
    });

    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            panel.classList.remove('open');
            btn.classList.remove('active');
            mobileFab.classList.remove('active');
        }
    });
}

// Iniciar widget de acessibilidade
initAccessibilityWidget();

// ===== PWA — Service Worker Registration =====
(function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
                .then((registration) => {
                    console.log('✅ Service Worker registrado:', registration.scope);

                    // Verificar atualizações periodicamente
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000); // A cada 1 hora

                    // Notificar quando houver atualização disponível
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (!newWorker) return;

                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Novo Service Worker disponível - mostrar notificação de atualização
                                showPWAUpdateNotification(newWorker);
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.warn('⚠️ Falha ao registrar Service Worker:', error);
                });

            // Recarregar quando o novo SW assumir
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        });
    }

    // Banner de atualização disponível
    function showPWAUpdateNotification(worker) {
        // Criar banner de atualização
        const banner = document.createElement('div');
        banner.className = 'pwa-update-banner';
        banner.innerHTML = `
            <div class="pwa-update-content">
                <i class="fas fa-sync-alt"></i>
                <span>Nova versão disponível!</span>
                <button class="pwa-update-btn" id="pwaUpdateBtn">Atualizar</button>
                <button class="pwa-update-close" id="pwaUpdateClose" aria-label="Fechar">&times;</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Mostrar com animação
        requestAnimationFrame(() => {
            banner.classList.add('show');
        });

        document.getElementById('pwaUpdateBtn').addEventListener('click', () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            banner.remove();
        });

        document.getElementById('pwaUpdateClose').addEventListener('click', () => {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        });
    }

    // ===== PWA Install Prompt =====
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Mostrar botão de instalação customizado apenas se não foi dispensado recentemente
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return; // Não mostrar por 7 dias após dispensar
        }

        showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA instalado com sucesso!');
        deferredPrompt = null;
        const banner = document.querySelector('.pwa-install-banner');
        if (banner) banner.remove();
    });

    function showInstallBanner() {
        // Não mostrar se já está instalado (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (window.navigator.standalone === true) return;

        const banner = document.createElement('div');
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-install-content">
                <img src="/fav.jpg" alt="CIEIB" class="pwa-install-icon" style="border-radius:50%;object-fit:cover;">
                <div class="pwa-install-text">
                    <strong>Instalar CIEIB</strong>
                    <span>Acesse como um app no seu celular</span>
                </div>
                <button class="pwa-install-btn" id="pwaInstallBtn">Instalar</button>
                <button class="pwa-install-close" id="pwaInstallClose" aria-label="Fechar">&times;</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Mostrar com delay
        setTimeout(() => {
            banner.classList.add('show');
        }, 3000);

        document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA install: ${outcome}`);
            deferredPrompt = null;
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        });

        document.getElementById('pwaInstallClose').addEventListener('click', () => {
            localStorage.setItem('pwa-install-dismissed', Date.now().toString());
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        });
    }

    // ===== Detectar modo offline/online =====
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        document.body.classList.toggle('is-offline', !isOnline);

        if (!isOnline) {
            showToast('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 'warning');
        } else {
            // Remover toast de offline se existir
            const offlineToast = document.querySelector('.toast-warning');
            if (offlineToast) offlineToast.remove();
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    function showToast(message, type = 'info') {
        const existing = document.querySelector(`.toast-${type}`);
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `pwa-toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'warning' ? 'wifi' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        if (type !== 'warning') {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }
})();
