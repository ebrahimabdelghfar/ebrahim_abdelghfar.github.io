# Ebrahim Abdelghfar — Portfolio

A modern, data-driven portfolio website powered by GitHub Pages. All content is stored in a single JSON file, making updates effortless — no HTML/CSS/JS editing required.

## 🏗️ Project Structure

```
├── index.html              # Shell HTML (loads content dynamically)
├── css/
│   ├── style.css           # Main styles + theme variables
│   ├── animations.css      # Scroll reveal + stagger animations
│   └── responsive.css      # Mobile-first media queries
├── js/
│   ├── app.js              # Main orchestrator (loads JSON → renders)
│   ├── renderer.js         # Section rendering functions
│   ├── interactions.js     # Nav, modals, scroll, theme toggle
│   └── typewriter.js       # Typewriter effect
├── data/
│   ├── portfolio.json      # ✏️ ALL YOUR CONTENT GOES HERE
│   └── config.json         # Site settings, theme, EmailJS config
├── admin/
│   └── index.html          # Visual editor for portfolio.json
├── assets/
│   └── images/             # Store project screenshots, resume PDF, etc.
├── robots.txt              # SEO
├── sitemap.xml             # SEO
└── README.md               # This file
```

## ✏️ How to Edit Your Portfolio

### Option 1: Edit JSON Directly (Quickest)

1. Open `data/portfolio.json` in any text editor.
2. Modify the content (experience, projects, skills, etc.).
3. Commit and push to GitHub.
4. Your site updates automatically!

### Option 2: Use the Admin Panel (No Code Needed)

1. Open `admin/index.html` in your browser (or visit `https://ebrahimabdelghfar.github.io/admin/`).
2. Click **"Load from ../data/portfolio.json"** to import your current content.
3. Navigate through sections using the sidebar and edit your content.
4. Click **"Export portfolio.json"** to download the updated file.
5. Replace `data/portfolio.json` in your repo with the downloaded file.
6. Commit and push!

## 📄 Content Structure (portfolio.json)

The JSON file has the following top-level sections:

| Section         | Description                                    |
|-----------------|------------------------------------------------|
| `hero`          | Name, bio, photo, social links, typewriter texts |
| `experience`    | Work experience timeline items                 |
| `education`     | Education & certifications timeline            |
| `skills`        | Skill categories with individual items         |
| `projects`      | Project cards with modal details               |
| `competitions`  | Competition awards                             |
| `scholarships`  | Scholarship entries                            |
| `volunteering`  | Volunteering timeline items                    |

## 🎨 Features

- **Dark/Light Theme Toggle** — Saves preference in `localStorage`
- **Responsive Design** — Mobile-first layout
- **Scroll Animations** — Reveal on scroll with stagger effects
- **Typewriter Effect** — Cycling hero text
- **Expandable Timelines** — Click to expand details
- **Project Modals** — Rich project details with GitHub links
- **Contact Form** — Powered by EmailJS
- **Page Loader** — Smooth loading experience
- **Back to Top Button** — Quick navigation
- **SEO Optimized** — Open Graph, Twitter Cards, sitemap, robots.txt

## ⚙️ Configuration (config.json)

Edit `data/config.json` to change:

- **Site metadata** — Title, description, author
- **Theme colors** — Both dark and light mode
- **EmailJS settings** — Service ID, Template ID, Public Key
- **Navigation sections** — Add/remove/reorder nav items

## 🚀 Deployment

This site is deployed via **GitHub Pages** from the `main` branch. Simply push changes and the site updates automatically.

## 📝 Adding a New Section

1. Add data to `portfolio.json` under a new key.
2. Add a rendering function to `js/renderer.js`.
3. Call it from `js/app.js`.
4. Add the section container to `index.html`.
5. Add it to `config.json` sections array for navigation.

## 📜 License

© Ebrahim Abdelghfar Ebrahim. All rights reserved.
