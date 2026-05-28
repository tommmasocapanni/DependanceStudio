const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: save data
  if (req.method === 'POST' && req.url === '/api/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // API: load data
  if (req.method === 'GET' && req.url === '/api/load') {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Redirect projects/*.html → page.html?slug=...
  const projectsMatch = req.url.match(/^\/projects\/(.+)\.html$/);
  if (projectsMatch) {
    const slug = projectsMatch[1];
    res.writeHead(302, { 'Location': `/page.html?slug=${slug}` });
    res.end();
    return;
  }

  // Static files
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

  // Favicon (ignore)
  if (urlPath === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Extensionless URL: try project slug, then .html file
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    const projectFile = path.join(__dirname, 'projects', path.basename(filePath) + '.html');
    if (fs.existsSync(projectFile)) {
      const slug = path.basename(filePath);
      res.writeHead(302, { 'Location': `/page.html?slug=${slug}` });
      res.end();
      return;
    }
    const withHtml = filePath + '.html';
    if (fs.existsSync(withHtml)) {
      filePath = withHtml;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  if (!fs.existsSync(filePath)) {
    // Try index.html inside directory
    const dirIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIndex)) {
      filePath = dirIndex;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
