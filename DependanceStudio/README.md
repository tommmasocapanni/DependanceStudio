# Dépendance Studio — Static portfolio with admin UI

This workspace now includes a clean, data-driven portfolio structure and a starter admin interface.

## Files created
- `index.html` — new homepage rendered from JSON data.
- `page.html` — dynamic page template for project and site pages using `?slug=`.
- `admin/index.html` — admin editor area for editing hero, footer, projects, and pages.
- `data/site-data.json` — central content model for the admin data.
- `css/styles.css` — lightweight styles for the admin UI.
- `js/site.js` — homepage rendering logic for the data-driven site.
- `js/page.js` — page route logic for the data-driven site.
- `js/admin.js` — admin editor logic with import/export and reset support.
- `index.webflow.html` — preserved original Webflow export homepage.

## Running locally
To use the site without fetch issues, run a local static server from the project folder. From the terminal:

```bash
cd /Users/tommasocapanni/Desktop/MIO/SitoDependance/DependanceStudio
python3 -m http.server 8000
```

Then visit:
- `http://localhost:8000/index.html`
- `http://localhost:8000/page.html?slug=about-us`
- `http://localhost:8000/admin/`

## Admin notes
- Password: `Dependance1!`
- Edits are saved to `localStorage` in the browser.
- You can export the current JSON and import it back into the admin later.
- Use the imported or exported JSON file to replace `data/site-data.json` for publishing.

## Next steps
1. Add authentication and persistence with a backend/serverless API.
2. Add a build/deploy pipeline for GitHub Pages or Vercel.
3. Convert the site to a full single-page app or static site generator if desired.
