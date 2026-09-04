import { createServer, loadEnv } from 'vite';
import copilot from '../api/copilot.mjs';

// Keep provider credentials on the server; never expose them through VITE_*.
const env = loadEnv('development', process.cwd(), 'OPENAI_');
for (const key of ['OPENAI_API_KEY', 'OPENAI_MODEL']) {
  if (!process.env[key] && env[key]) process.env[key] = env[key];
}

const server = await createServer({
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  plugins: [{
    name: 'local-copilot-api',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/copilot') return next();
        try {
          const chunks = [];
          let bytes = 0;
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 128 * 1024) {
              res.writeHead(413, { 'content-type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request is too large.' }));
              return;
            }
            chunks.push(chunk);
          }
          const response = await copilot(new Request('http://localhost/api/copilot', {
            method: req.method,
            headers: { 'content-type': 'application/json' },
            body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
          }));
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch {
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Local copilot server failed.' }));
        }
      });
    },
  }],
});
await server.listen();
server.printUrls();
