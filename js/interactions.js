/**
 * interactions.js
 * Handles all UI interactions: scroll effects, nav toggle, modals, theme, back-to-top.
 */

const Interactions = {
    /**
     * Initialize all interactions after DOM content is rendered.
     */
    init() {
        this.initScrollEffects();
        this.initMobileNav();
        this.initTimeline();
        this.initModals();
        this.initRevealAnimations();
        this.initThemeToggle();
        this.initBackToTop();
        this.initStatCounters();
        this.initSmoothScroll();
    },

    /**
     * Header scroll shadow + active nav link highlighting.
     */
    initScrollEffects() {
        const header = document.getElementById('header');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 70;

        const handleScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }

            let currentSection = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.scrollY >= (sectionTop - headerHeight - 1)) {
                    currentSection = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(currentSection)) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Run once on init
    },

    /**
     * Mobile navigation toggle.
     */
    initMobileNav() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.querySelectorAll('.nav-link');

        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    },

    /**
     * Expandable timeline items.
     */
    initTimeline() {
        const timelineContents = document.querySelectorAll('.timeline-content');
        timelineContents.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'a') return;
                item.classList.toggle('expanded');
            });
        });
    },

    /**
     * Project modals — open/close.
     */
    initModals() {
        const projectCards = document.querySelectorAll('.project-card');
        const modals = document.querySelectorAll('.modal');
        const closeModals = document.querySelectorAll('.close-modal');

        projectCards.forEach(card => {
            card.addEventListener('click', () => {
                const modalId = card.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) modal.classList.add('show');
            });
        });

        const closeModal = (modal) => {
            if (modal) modal.classList.remove('show');
        };

        closeModals.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(button.closest('.modal'));
            });
        });

        window.addEventListener('click', (e) => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.forEach(modal => closeModal(modal));
            }
        });
    },

    /**
     * Intersection Observer for scroll reveal animations.
     */
    initRevealAnimations() {
        const revealElements = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1
        });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    },

    /**
     * Dark/Light theme toggle with localStorage persistence.
     */
    initThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this._updateThemeIcon(toggleBtn, savedTheme);

        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('portfolio-theme', next);
            this._updateThemeIcon(toggleBtn, next);
        });
    },

    _updateThemeIcon(btn, theme) {
        const icon = btn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            btn.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            btn.title = 'Switch to Dark Mode';
        }
    },

    /**
     * Back to top button.
     */
    initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    /**
     * Initialize EmailJS contact form.
     */
    initContactForm(emailjsConfig) {
        if (!emailjsConfig || !emailjsConfig.publicKey) return;

        // Initialize EmailJS
        emailjs.init({ publicKey: emailjsConfig.publicKey });

        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;

        const submitBtn = contactForm.querySelector('.btn-submit');
        const formFeedback = document.getElementById('form-feedback');

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            formFeedback.style.display = 'none';

            emailjs.sendForm(emailjsConfig.serviceID, emailjsConfig.templateID, this)
                .then(() => {
                    submitBtn.textContent = 'Send Message';
                    submitBtn.disabled = false;
                    formFeedback.textContent = 'Message sent successfully!';
                    formFeedback.className = 'success';
                    formFeedback.style.display = 'block';
                    contactForm.reset();
                }, (err) => {
                    submitBtn.textContent = 'Send Message';
                    submitBtn.disabled = false;
                    formFeedback.textContent = `Failed to send message. Error: ${JSON.stringify(err)}`;
                    formFeedback.className = 'error';
                    formFeedback.style.display = 'block';
                });
        });
    },

    /**
     * Animated number counter for hero stats (triggers on scroll into view).
     */
    initStatCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;

        let counted = false;

        const countUp = (el) => {
            const text = el.textContent.trim();
            const hasPlus = text.includes('+');
            const target = parseInt(text);
            if (isNaN(target)) return;

            const duration = 1500;
            const frameDuration = 1000 / 60;
            const totalFrames = Math.round(duration / frameDuration);
            let frame = 0;

            const easeOutQuad = t => t * (2 - t);

            const counter = setInterval(() => {
                frame++;
                const progress = easeOutQuad(frame / totalFrames);
                const current = Math.round(target * progress);
                el.textContent = current + (hasPlus ? '+' : '');

                if (frame === totalFrames) {
                    clearInterval(counter);
                    el.textContent = target + (hasPlus ? '+' : '');
                }
            }, frameDuration);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !counted) {
                    counted = true;
                    statNumbers.forEach(el => countUp(el));
                }
            });
        }, { threshold: 0.5 });

        const statsRow = document.querySelector('.hero-stats');
        if (statsRow) statsObserver.observe(statsRow);
    },

    /**
     * Smooth scroll for all anchor links with offset for fixed header.
     */
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (!target) return;

                e.preventDefault();
                const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 70;
                const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    }
};

window.Interactions = Interactions;
