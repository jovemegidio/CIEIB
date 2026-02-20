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
        if (mobileToggle) mobileToggle.classList.remove('active');
        if (nav) nav.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = nav.classList.contains('active');
            if (isOpen) {
                closeMainNav();
            } else {
                mobileToggle.classList.add('active');
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
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
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
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]');
            if (email && email.value) {
                // Show success feedback
                const btn = newsletterForm.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Cadastrado!';
                btn.style.background = '#28a745';
                btn.style.borderColor = '#28a745';
                email.value = '';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                }, 3000);
            }
        });
    }

    // ===== Contact Form =====
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Mensagem Enviada!';
                btn.style.background = '#28a745';
                btn.style.borderColor = '#28a745';
                contactForm.reset();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }

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
});
