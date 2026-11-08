/**
 * interactions.js
 * Theme, mobile menu, project dialog, contact form.
 */

const Interactions = {
    init(projects) {
        this.initTheme();
        this.initMenu();
        this.initNavState();
        this.initProjects(projects);
    },

    /** Mark the nav link of the section in the middle of the viewport. */
    initNavState() {
        const links = [...document.querySelectorAll('.nav-link')];
        const io = new IntersectionObserver(entries => entries.forEach(e => {
            if (!e.isIntersecting) return;
            links.forEach(a => a.hash === `#${e.target.id}`
                ? a.setAttribute('aria-current', 'location')
                : a.removeAttribute('aria-current'));
        }), { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main > section').forEach(s => io.observe(s));
    },

    initTheme() {
        const btn = document.getElementById('theme-toggle');
        const root = document.documentElement;
        const systemDark = matchMedia('(prefers-color-scheme: dark)');
        const current = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
        const announce = () => {
            btn.setAttribute('aria-label', `Switch to ${current() === 'dark' ? 'light' : 'dark'} theme`);
            document.dispatchEvent(new Event('themechange'));
        };

        btn.addEventListener('click', () => {
            const apply = () => {
                root.dataset.theme = current() === 'dark' ? 'light' : 'dark';
                try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch (e) { }
                announce();
            };
            // Browsers without View Transitions, or reduced motion: switch instantly.
            if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();

            // The new theme spreads out in a circle from the toggle button.
            const r = btn.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            document.startViewTransition(apply).ready.then(() => {
                root.animate(
                    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                    { duration: 600, easing: 'cubic-bezier(.2, .7, .2, 1)', pseudoElement: '::view-transition-new(root)' }
                );
            });
        });
        systemDark.addEventListener('change', announce);
        announce();
    },

    initMenu() {
        const toggle = document.getElementById('nav-toggle');
        const nav = document.getElementById('nav');
        const setOpen = open => {
            nav.classList.toggle('open', open);
            document.body.classList.toggle('menu-open', open);
            toggle.setAttribute('aria-expanded', open);
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };
        toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
        nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    },

    initProjects(projects) {
        const dialog = document.getElementById('project-dialog');

        document.querySelector('.projects').addEventListener('click', e => {
            const btn = e.target.closest('[data-project]');
            if (!btn) return;
            dialog.innerHTML = Renderer.projectDialog(projects[btn.dataset.project]);
            dialog.showModal();
        });

        dialog.addEventListener('click', e => {
            // Click on the backdrop (the dialog element itself) or the close button closes it.
            if (e.target === dialog || e.target.closest('.dialog-close')) dialog.close();
        });
    },

    initContactForm(cfg) {
        const form = document.getElementById('contact-form');
        const status = document.getElementById('form-status');
        const submit = form.querySelector('button[type="submit"]');
        const fields = [...form.querySelectorAll('input, textarea')];

        // Each error sits under its own field (linked with aria-describedby).
        const check = field => {
            const msg = field.validity.valueMissing ? field.dataset.missing
                : field.validity.typeMismatch ? 'Enter an email address like name@company.com.' : '';
            field.setAttribute('aria-invalid', msg ? 'true' : 'false');
            document.getElementById(`${field.id}-error`).textContent = msg;
            return !msg;
        };
        fields.forEach(f => {
            f.addEventListener('blur', () => { if (f.value) check(f); });
            f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
        });

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const invalid = fields.filter(f => !check(f));
            if (invalid.length) {
                invalid[0].focus();
                return;
            }
            if (!window.emailjs || !cfg || !cfg.publicKey) {
                status.textContent = 'The form is unavailable right now. Email me directly instead.';
                status.className = 'form-status error';
                return;
            }

            submit.disabled = true;
            submit.textContent = 'Sending…';
            status.textContent = '';
            try {
                emailjs.init({ publicKey: cfg.publicKey });
                await emailjs.sendForm(cfg.serviceID, cfg.templateID, form);
                form.reset();
                status.textContent = 'Message sent. I will reply by email.';
                status.className = 'form-status success';
            } catch (err) {
                status.textContent = 'The message did not send. Try again, or email me directly.';
                status.className = 'form-status error';
            } finally {
                submit.disabled = false;
                submit.textContent = 'Send message';
            }
        });
    }
};

window.Interactions = Interactions;
