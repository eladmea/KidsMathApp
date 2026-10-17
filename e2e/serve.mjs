// A tiny static server for a build, under the GitHub Pages path, so the
// walkthroughs can run without a separate server. run.mjs starts it with
// --serve <dir> and closes it when the walkthroughs finish.
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webmanifest': 'application/manifest+json',
};

export function serve(root, { port = 8765, base = '/KidsMathApp/' } = {}) {
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    if (!path.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    const relative = normalize(path.slice(base.length) || 'index.html').replace(/^(\.\.[/\\])+/, '');
    const file = join(root, relative.endsWith('/') || relative === '.' ? join(relative, 'index.html') : relative);
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch (e) {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(() => new Promise((done) => server.close(done)))));
}
