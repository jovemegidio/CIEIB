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
        }
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
                link.setAttribute('aria-expanded', dropdown.classList.contains('active').toString());
            }
        });
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

    // ===== Counter Animation =====
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateCounter = (el) => {
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 16);
    };

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => counterObserver.observe(num));

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

            // Bind dot navigation
            bar.querySelectorAll('.snb-dot').forEach(dot => {
                dot.addEventListener('click', function() {
                    currentIdx = parseInt(this.dataset.idx);
                    renderNotif(currentIdx);
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

        // Auto-rotate if multiple notifications
        if (pending.length > 1) {
            let rotateTimer = setInterval(() => {
                currentIdx = (currentIdx + 1) % pending.length;
                bar.style.opacity = '0';
                bar.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    renderNotif(currentIdx);
                    bar.style.opacity = '1';
                }, 300);
            }, 7000);

            // Pause rotation on hover
            bar.addEventListener('mouseenter', () => clearInterval(rotateTimer));
            bar.addEventListener('mouseleave', () => {
                rotateTimer = setInterval(() => {
                    currentIdx = (currentIdx + 1) % pending.length;
                    bar.style.opacity = '0';
                    bar.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        renderNotif(currentIdx);
                        bar.style.opacity = '1';
                    }, 300);
                }, 7000);
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
