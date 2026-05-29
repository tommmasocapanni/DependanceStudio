import http.server
import json
import os
import urllib.parse
import pathlib

PORT = 8000
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'site-data.json')


class Handler(http.server.SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path in ('/api/save', '/api/save.php'):
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': True}).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())
            return

        self.send_response(404)
        self.end_headers()

    PROJECT_DIR = os.path.join(os.path.dirname(__file__), 'projects')

    @staticmethod
    def _get_project_slugs():
        slugs = []
        projects_dir = Handler.PROJECT_DIR
        if os.path.isdir(projects_dir):
            for f in os.listdir(projects_dir):
                if f.endswith('.html'):
                    slugs.append(f[:-5])
        return slugs

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)


        if parsed.path == '/api/load':
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content.encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())
            return

        # Redirect /projects/slug.html → /page.html?slug=slug
        import re
        m = re.match(r'^/projects/(.+)\.html$', parsed.path)
        if m:
            slug = m.group(1)
            self.send_response(302)
            self.send_header('Location', f'/page.html?slug={slug}')
            self.end_headers()
            return

        # Extensionless URL handling
        path_no_ext = parsed.path.rstrip('/')
        if path_no_ext and not os.path.splitext(path_no_ext)[1] and path_no_ext != '/':
            # Check if it's a project slug → serve static projects/NAME.html
            slug = path_no_ext.lstrip('/')
            project_file = os.path.join(Handler.PROJECT_DIR, slug + '.html')
            if slug in self._get_project_slugs() and os.path.isfile(project_file):
                self.path = '/projects/' + slug + '.html'
                return super().do_GET()
            # Check if /path.html exists in root
            local_path = os.path.join(os.getcwd(), slug + '.html')
            if os.path.isfile(local_path):
                self.path = path_no_ext + '.html'
                return super().do_GET()

        return super().do_GET()

    def log_message(self, format, *args):
        if len(args) >= 3:
            print(f"[{self.log_date_time_string()}] {args[0]} {args[1]} {args[2]}")
        elif len(args) >= 2:
            print(f"[{self.log_date_time_string()}] {args[0]} {args[1]}")
        elif len(args) >= 1:
            print(f"[{self.log_date_time_string()}] {args[0]}")
        else:
            print(f"[{self.log_date_time_string()}] (no args)")


if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'Server running at http://localhost:{PORT}')
    server.serve_forever()
