/**
 * renderer.js
 * Renders all portfolio sections dynamically from JSON data.
 */

const Renderer = {
    /**
     * Render navigation menu items from config sections.
     */
    renderNav(sections, navMenuEl) {
        sections.forEach((sec, i) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            const a = document.createElement('a');
            a.href = `#${sec.id}`;
            a.className = `nav-link${i === 0 ? ' active' : ''}`;
            a.textContent = sec.label;
            li.appendChild(a);
            navMenuEl.appendChild(li);
        });
    },

    /**
     * Render the hero section.
     */
    renderHero(hero, containerEl) {
        const socialHTML = hero.socialLinks.map(link =>
            `<a href="${link.url}" target="_blank" aria-label="${link.platform}"><i class="${link.icon}"></i></a>`
        ).join('');

        const resumeBtn = hero.resumeURL
            ? `<a href="${hero.resumeURL}" target="_blank" class="btn-resume"><i class="fas fa-download"></i> Download Resume</a>`
            : '';

        containerEl.innerHTML = `
            <div class="hero-text">
                <h1><span class="typewriter"></span></h1>
                <p id="bio-text">${hero.bio}</p>
                <div class="hero-buttons">
                    ${resumeBtn}
                </div>
                <div class="social-links">${socialHTML}</div>
            </div>
            <div class="hero-img-container">
                <img src="${hero.photo}" alt="${hero.name}" loading="lazy">
            </div>
        `;
    },

    /**
     * Render a timeline section (experience, education, volunteering).
     */
    renderTimeline(items, containerEl, type) {
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline';

        items.forEach(item => {
            const side = item.side || 'right';
            const subtitle = item.company || item.institution || item.organization || '';

            let detailsHTML = '';
            if (item.detailsHTML) {
                detailsHTML += `<p>${item.detailsHTML}</p>`;
            }
            if (item.details && item.details.length > 0) {
                const listItems = item.details.map(d => `<li>${d}</li>`).join('');
                detailsHTML += `<ul>${listItems}</ul>`;
            }

            const html = `
                <div class="timeline-item ${side}">
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <div class="timeline-header-text">
                                <h3>${item.title}</h3>
                                <p class="timeline-subtitle">${subtitle}</p>
                                <span class="timeline-date">${item.date}</span>
                            </div>
                            <span class="expand-icon"><i class="fas fa-chevron-down"></i></span>
                        </div>
                        <div class="expand-details">
                            ${detailsHTML}
                        </div>
                    </div>
                </div>
            `;
            timelineDiv.insertAdjacentHTML('beforeend', html);
        });

        containerEl.appendChild(timelineDiv);
    },

    /**
     * Render the skills section.
     */
    renderSkills(skills, containerEl) {
        const grid = document.createElement('div');
        grid.className = 'skills-grid';

        skills.forEach(cat => {
            const items = cat.items.map(item =>
                `<li><i class="${item.icon}"></i> ${item.name}</li>`
            ).join('');

            grid.insertAdjacentHTML('beforeend', `
                <div class="skill-category">
                    <h3><i class="${cat.icon}"></i> ${cat.category}</h3>
                    <ul>${items}</ul>
                </div>
            `);
        });

        containerEl.appendChild(grid);
    },

    /**
     * Render the projects section (cards + modals).
     */
    renderProjects(projects, containerEl, modalsContainer) {
        const grid = document.createElement('div');
        grid.className = 'projects-grid';

        projects.forEach(proj => {
            // Card
            grid.insertAdjacentHTML('beforeend', `
                <div class="project-card" data-modal="${proj.id}">
                    <img src="${proj.image}" alt="${proj.title}" loading="lazy">
                    <div class="project-info">
                        <h3>${proj.title}</h3>
                        <p>${proj.summary}</p>
                    </div>
                </div>
            `);

            // Modal
            const details = proj.details.map(d => `<li>${d}</li>`).join('');
            const linkHTML = proj.link
                ? `<a href="${proj.link}" target="_blank" class="project-link">${proj.linkText || 'View Project'} <i class="fas fa-external-link-alt"></i></a>`
                : '';

            modalsContainer.insertAdjacentHTML('beforeend', `
                <div id="${proj.id}" class="modal">
                    <div class="modal-content">
                        <span class="close-modal">&times;</span>
                        <h3>${proj.title}</h3>
                        <p>${proj.description}</p>
                        <ul>${details}</ul>
                        ${linkHTML}
                    </div>
                </div>
            `);
        });

        containerEl.appendChild(grid);
    },

    /**
     * Render awards/competitions or scholarships grid.
     */
    renderAwards(items, containerEl, singleColumn = false) {
        const grid = document.createElement('div');
        grid.className = 'awards-grid';
        if (singleColumn) {
            grid.style.gridTemplateColumns = '1fr';
        }

        items.forEach(item => {
            grid.insertAdjacentHTML('beforeend', `
                <div class="award-card">
                    <div class="icon"><i class="${item.icon}"></i></div>
                    <h3>${item.title}</h3>
                    <span class="award-date">${item.date}</span>
                    <p>${item.description}</p>
                </div>
            `);
        });

        containerEl.appendChild(grid);
    },

    /**
     * Render the contact form.
     */
    renderContact(containerEl) {
        containerEl.innerHTML = `
            <p style="text-align: center;">Have a question or want to work together? Feel free to reach out.</p>
            <form class="contact-form" id="contact-form">
                <div class="form-group">
                    <input type="text" name="from_name" placeholder="Your Name" required>
                </div>
                <div class="form-group">
                    <input type="email" name="from_email" placeholder="Your Email" required>
                </div>
                <div class="form-group">
                    <input type="text" name="subject" placeholder="Subject" required>
                </div>
                <div class="form-group">
                    <textarea name="message" rows="6" placeholder="Your Message" required></textarea>
                </div>
                <button type="submit" class="btn-submit">Send Message</button>
                <div id="form-feedback" style="display: none;"></div>
            </form>
        `;
    },

    /**
     * Render the footer.
     */
    renderFooter(footerText, footerEl) {
        const year = new Date().getFullYear();
        footerEl.innerHTML = `
            <div class="container">
                <p>&copy; ${year} ${footerText}</p>
            </div>
        `;
    }
};

// Export for use in app.js (works as global for non-module script loading)
window.Renderer = Renderer;
