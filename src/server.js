import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SessionStore } from './session-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function serveStatic(res, filePath, contentType) {
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

export async function startServer({ host, port, codexHome }) {
  const store = new SessionStore(codexHome);
  await store.ensureLayout();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/api/sessions') {
      try {
        const sessions = await store.listSessions();
        return json(res, 200, { sessions });
      } catch (error) {
        return json(res, 500, { error: error.message });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/sessions/rename') {
      try {
        const body = await readBody(req);
        const result = await store.renameSession(body.sessionId, body.name);
        return json(res, 200, result);
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/sessions/delete') {
      try {
        const body = await readBody(req);
        const result = await store.deleteSession(body.sessionId);
        return json(res, 200, result);
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/sessions/copy') {
      try {
        const body = await readBody(req);
        const result = await store.copySession(body.sessionId);
        return json(res, 200, result);
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/sessions/duplicate') {
      try {
        const body = await readBody(req);
        const result = await store.duplicateSession(body.sessionId);
        return json(res, 200, result);
      } catch (error) {
        return json(res, 400, { error: error.message });
      }
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return serveStatic(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
    }

    if (req.method === 'GET' && url.pathname === '/app.js') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'app.js'), 'application/javascript; charset=utf-8');
    }

    if (req.method === 'GET' && url.pathname === '/styles.css') {
      return serveStatic(res, path.join(PUBLIC_DIR, 'styles.css'), 'text/css; charset=utf-8');
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  return server;
}
