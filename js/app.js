/**
 * app.js
 * Main orchestrator — loads JSON data and renders the entire portfolio.
 */

(async function () {
    const loader = document.getElementById('page-loader');

    try {
        // 1. Fetch config and portfolio data in parallel (cache-bust to always get latest)
        const cacheBust = `?v=${Date.now()}`;
        const [configRes, portfolioRes] = await Promise.all([
            fetch('data/config.json' + cacheBust),
            fetch('data/portfolio.json' + cacheBust)
        ]);

        if (!configRes.ok || !portfolioRes.ok) {
            throw new Error('Failed to load data files.');
        }

        const config = await configRes.json();
        const data = await portfolioRes.json();

        // 2. Set document title
        document.title = config.site.title;

        // 3. Set nav logo
        const navLogoEl = document.querySelector('.nav-logo');
        if (navLogoEl) navLogoEl.textContent = config.site.navLogo;

        // 4. Render navigation items
        const navMenuEl = document.getElementById('nav-menu');
        Renderer.renderNav(config.sections, navMenuEl);

        // 5. Render Hero
        const heroContainer = document.querySelector('#hero .hero-content');
        Renderer.renderHero(data.hero, heroContainer);

        // 6. Render Experience
        const expContainer = document.querySelector('#experience .container');
        Renderer.renderTimeline(data.experience, expContainer, 'experience');

        // 7. Render Education
        const eduContainer = document.querySelector('#education .container');
        Renderer.renderTimeline(data.education, eduContainer, 'education');

        // 8. Render Skills
        const skillsContainer = document.querySelector('#skills .container');
        Renderer.renderSkills(data.skills, skillsContainer);

        // 9. Render Projects
        const projectsContainer = document.querySelector('#projects .container');
        const modalsContainer = document.getElementById('modals-container');
        Renderer.renderProjects(data.projects, projectsContainer, modalsContainer);

        // 10. Render Competitions
        const compContainer = document.querySelector('#competitions .container');
        Renderer.renderAwards(data.competitions, compContainer);

        // 11. Render Scholarships
        const scholarContainer = document.querySelector('#scholarships .container');
        Renderer.renderAwards(data.scholarships, scholarContainer, true);

        // 12. Render Volunteering
        const volContainer = document.querySelector('#volunteering .container');
        Renderer.renderTimeline(data.volunteering, volContainer, 'volunteering');

        // 13. Render Contact
        const contactContainer = document.querySelector('#contact .container');
        Renderer.renderContact(contactContainer);

        // 14. Render Footer
        const footerEl = document.querySelector('.footer');
        Renderer.renderFooter(config.site.footerText, footerEl);

        // 15. Start typewriter
        Typewriter.start('.typewriter', data.hero.typewriterTexts);

        // 16. Initialize all interactions
        Interactions.init();

        // 17. Initialize contact form with EmailJS
        Interactions.initContactForm(config.emailjs);

    } catch (err) {
        console.error('Portfolio loading error:', err);
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;font-family:sans-serif;color:#c9d1d9;background:#0d1117;">
                <div>
                    <h1>Oops!</h1>
                    <p>Failed to load portfolio data. Please try again later.</p>
                    <p style="color:#666;font-size:0.9rem;">${err.message}</p>
                </div>
            </div>
        `;
    } finally {
        // Hide loader
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    }
})();
