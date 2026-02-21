/* ============================================
   CIEIB - Main JavaScript
   ============================================ */

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
                await fetch('/api/contato/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.value })
                });
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
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
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
                        <div class="snb-icon-wrap"><i class="fas ${cfg.icon}"></i></div>
                        <span class="snb-badge">${cfg.badge}</span>
                        <div class="snb-text">
                            <strong>${n.titulo}</strong>
                            <span>${n.mensagem || ''}</span>
                        </div>
                        ${n.link ? `<a href="${n.link}" class="snb-cta">Saiba mais <i class="fas fa-arrow-right"></i></a>` : ''}
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
                el.innerHTML = config[key];
            }
        });

        // Atualizar <title> com nome_site
        if (config.nome_site) {
            const baseName = config.nome_site;
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const isHome = !currentPage || currentPage === '' || currentPage === '/' || currentPage === 'index.html' || currentPage === 'index';
            if (isHome) {
                // Página inicial: usa o nome completo da config
                document.title = baseName;
            } else {
                // Subpáginas: extrai o nome da página do título original
                // Detecta separadores: — | -
                const separatorMatch = document.title.match(/^(.+?)\s*(?:—|\||-)\s*(.+)$/);
                if (separatorMatch) {
                    // Usa o prefixo da página + nome do site da config
                    document.title = separatorMatch[1].trim() + ' — ' + baseName;
                } else {
                    // Título sem separador → usa nome completo
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
