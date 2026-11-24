import http from 'node:http';
import { handleHealth } from './routes/health.ts';
import { handleHintRoute } from './routes/hint.ts';

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const HOST = '127.0.0.1';

export function createServer() {
  const server = http.createServer(async (req, res) => {
    // CORS Headers for Chrome Extension Origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    try {
      if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
        const data = handleHealth();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }

      if (req.method === 'POST' && (url.pathname === '/hint' || url.pathname === '/api/hint')) {
        let bodyRaw = '';
        for await (const chunk of req) {
          bodyRaw += chunk;
        }

        const body = JSON.parse(bodyRaw || '{}');
        const result = await handleHintRoute(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', path: url.pathname }));
    } catch (err: any) {
      console.error('[Nudge API Error]', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  });

  return server;
}

export function startServer(port = DEFAULT_PORT): http.Server {
  const server = createServer();

  server.on('error', (err: any) => {
    if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && port < 3010) {
      console.warn(`[Nudge API] Port ${port} is reserved or in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Nudge API Server Error]:', err);
    }
  });

  server.listen(port, HOST, () => {
    console.log(`[Nudge Hint Engine API] Running on http://${HOST}:${port}`);
    console.log(`[Nudge Hint Engine API] Health check: http://${HOST}:${port}/health`);
  });

  return server;
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer();
}
