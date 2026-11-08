/**
 * app.js
 * Loads config + portfolio JSON and renders the page.
 */

(async function () {
    const slot = id => document.querySelector(`#${id} [data-slot]`);

    try {
        const bust = `?v=${Date.now()}`;
        const [configRes, dataRes] = await Promise.all([
            fetch('data/config.json' + bust),
            fetch('data/portfolio.json' + bust)
        ]);
        if (!configRes.ok || !dataRes.ok) throw new Error('Could not load data files.');

        const config = await configRes.json();
        const data = await dataRes.json();

        document.title = config.site.title;
        document.querySelector('.mark').textContent = config.site.navLogo;

        Renderer.renderNav(config.sections, document.getElementById('nav-menu'));
        Renderer.renderHero(data.hero, document.getElementById('hero-content'));
        Renderer.renderEntries(data.experience, slot('experience'));
        Renderer.renderProjects(data.projects, slot('projects'));
        Renderer.renderSkills(data.skills, slot('skills'));
        Renderer.renderEntries(data.education, slot('education'));
        Renderer.renderEntries(data.volunteering, slot('teaching'));
        Renderer.renderAwards([...data.competitions, ...data.scholarships], slot('awards'));
        Renderer.renderContact(data.hero, slot('contact'));
        Renderer.renderFooter(config.site.footerText, document.querySelector('.site-footer'));

        Interactions.init(data.projects);
        Interactions.initContactForm(config.emailjs);
    } catch (err) {
        console.error('Portfolio loading error:', err);
        document.getElementById('hero-content').innerHTML =
            `<p class="load-error">The portfolio content did not load (${err.message}). Refresh the page to try again.</p>`;
    }
})();
