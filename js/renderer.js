/**
 * renderer.js
 * Turns data/portfolio.json into page markup.
 */

const Renderer = {
    renderNav(sections, listEl) {
        listEl.innerHTML = sections
            .map(s => `<li><a class="nav-link" href="#${s.id}">${s.label}</a></li>`)
            .join('');
    },

    socialLinks(links) {
        return links.map(l =>
            `<li><a href="${l.url}" ${l.url.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener"'} aria-label="${l.platform}"><i class="${l.icon}" aria-hidden="true"></i></a></li>`
        ).join('');
    },

    renderHero(hero, el) {
        const stats = (hero.stats || []).map(s =>
            `<div class="fact"><dt>${s.number}</dt><dd>${s.label}</dd></div>`
        ).join('');

        const resume = hero.resumeURL
            ? `<a class="btn btn-primary" href="${hero.resumeURL}" target="_blank" rel="noopener">Download CV</a>`
            : '';

        el.innerHTML = `
            <div class="hero-id" data-enter>
                ${hero.photo ? `<img class="hero-photo" src="${hero.photo}" alt="Portrait of ${hero.name}" width="56" height="56">` : ''}
                <p>${hero.title}<br><span>${hero.location || ''}</span></p>
            </div>
            <h1 class="hero-name" data-enter>${hero.name}</h1>
            <p class="hero-bio" data-enter>${hero.bio}</p>
            <div class="hero-actions" data-enter>
                ${resume}
                <a class="btn btn-ghost" href="#contact">Get in touch</a>
                <ul class="social">${this.socialLinks(hero.socialLinks)}</ul>
            </div>
            <dl class="hero-facts" data-enter>${stats}</dl>
        `;
    },

    /** Experience, education, teaching: date column + content column. */
    renderEntries(items, el) {
        el.innerHTML = `<ol class="entries">${items.map(item => {
            const org = item.company || item.institution || item.organization || '';
            const points = (item.details || []).filter(Boolean).map(d => `<li>${d}</li>`).join('');
            return `
                <li class="entry">
                    <p class="entry-when">${item.date}</p>
                    <div class="entry-main">
                        <h3>${item.title}</h3>
                        <p class="entry-org">
                            ${item.logo ? `<img src="${item.logo}" alt="" width="22" height="22" loading="lazy">` : ''}
                            ${org}
                        </p>
                        ${item.detailsHTML ? `<p class="entry-note">${item.detailsHTML}</p>` : ''}
                        ${points ? `<ul class="entry-points">${points}</ul>` : ''}
                    </div>
                </li>`;
        }).join('')}</ol>`;
    },

    renderSkills(skills, el) {
        el.innerHTML = `<dl class="skills">${skills.map(cat => `
            <div class="skill-row">
                <dt>${cat.category}</dt>
                <dd>${cat.items.map(i => i.name).join(', ')}</dd>
            </div>`).join('')}</dl>`;
    },

    renderProjects(projects, el) {
        el.innerHTML = `<ul class="projects">${projects.map((p, i) => `
            <li class="project${p.image ? '' : ' project-text'}">
                <button class="project-open" type="button" data-project="${i}">
                    <span class="project-media">
                        ${p.image
                            ? `<img src="${p.image}" alt="" loading="lazy">`
                            : `<span class="project-plate">${p.title}</span>`}
                    </span>
                    <span class="project-title">${p.title}</span>
                    <span class="project-summary">${p.summary}</span>
                </button>
            </li>`).join('')}</ul>`;
    },

    projectDialog(p) {
        const points = (p.details || []).map(d => `<li>${d}</li>`).join('');
        return `
            <div class="dialog-inner">
                <button class="dialog-close icon-btn" type="button" aria-label="Close project details">
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
                ${p.image ? `<img class="dialog-img" src="${p.image}" alt="Screenshot of ${p.title}">` : ''}
                <h3 id="dialog-title">${p.title}</h3>
                <p class="dialog-desc">${p.description}</p>
                ${points ? `<ul class="entry-points">${points}</ul>` : ''}
                ${p.link ? `<a class="btn btn-primary" href="${p.link}" target="_blank" rel="noopener">${p.linkText || 'View project'}</a>` : ''}
            </div>`;
    },

    renderAwards(items, el) {
        el.innerHTML = `<ol class="entries">${items.map(a => `
            <li class="entry">
                <p class="entry-when">${a.date}</p>
                <div class="entry-main">
                    <h3>${a.title}</h3>
                    <p class="entry-text">${a.description}</p>
                </div>
            </li>`).join('')}</ol>`;
    },

    renderContact(hero, el) {
        const email = (hero.socialLinks.find(l => l.url.startsWith('mailto:')) || {}).url || '';
        el.innerHTML = `
            <div class="contact">
                <div class="contact-intro">
                    <p>Hiring for robotics, autonomy or simulation work? Email me directly or send a message here.</p>
                    ${email ? `<a class="contact-email" href="${email}">${email.replace('mailto:', '')}</a>` : ''}
                    <ul class="social">${this.socialLinks(hero.socialLinks.filter(l => !l.url.startsWith('mailto:')))}</ul>
                </div>
                <form class="contact-form" id="contact-form" novalidate>
                    <p class="form-hint">All fields are required.</p>
                    ${[
                        ['cf-name', 'Name', '<input id="cf-name" type="text" name="from_name" autocomplete="name" required', 'Enter your name.'],
                        ['cf-email', 'Email', '<input id="cf-email" type="email" name="from_email" autocomplete="email" required', 'Enter your email address.'],
                        ['cf-subject', 'Subject', '<input id="cf-subject" type="text" name="subject" required', 'Enter a subject.'],
                        ['cf-message', 'Message', '<textarea id="cf-message" name="message" rows="5" required', 'Write a message.']
                    ].map(([id, label, open, msg]) => `
                    <div class="field">
                        <label for="${id}">${label}</label>
                        ${open} aria-describedby="${id}-error" data-missing="${msg}">${open.startsWith('<textarea') ? '</textarea>' : ''}
                        <p class="field-error" id="${id}-error"></p>
                    </div>`).join('')}
                    <button type="submit" class="btn btn-primary">Send message</button>
                    <p class="form-status" id="form-status" role="status"></p>
                </form>
            </div>`;
    },

    renderFooter(name, el) {
        el.innerHTML = `<div class="wrap"><p>&copy; ${new Date().getFullYear()} ${name}</p><a href="#top">Back to top</a></div>`;
    }
};

window.Renderer = Renderer;
