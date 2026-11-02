'use strict';

const http = require('http');

const startedAt = Date.now();
const allowedStatuses = new Set([
    'starting',
    'connecting',
    'connected',
    'reconnecting',
    'disconnected',
    'logged-out',
    'error',
]);

let whatsappStatus = 'starting';

function setWhatsAppStatus(status) {
    whatsappStatus = allowedStatuses.has(status) ? status : 'unknown';
}

function send(response, statusCode, contentType, body) {
    response.writeHead(statusCode, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    });
    response.end(body);
}

function healthPage() {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#10141d">
  <title>Queen Riam · Status</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #10141d; color: #f4f6fb; }
    main { width: min(100%, 560px); padding: 32px; border: 1px solid #293244; border-radius: 20px; background: #171e2a; box-shadow: 0 24px 80px #05070c66; }
    .eyebrow { margin: 0 0 10px; color: #9ba8bd; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(28px, 6vw, 38px); letter-spacing: -.04em; }
    .subtitle { margin: 10px 0 28px; color: #aab5c7; line-height: 1.6; }
    .status-card { display: flex; align-items: center; gap: 14px; padding: 18px; border: 1px solid #303b4e; border-radius: 14px; background: #111722; }
    .dot { width: 12px; height: 12px; flex: 0 0 auto; border-radius: 50%; background: #e4ad4e; box-shadow: 0 0 0 5px #e4ad4e22; }
    .dot.good { background: #45d49a; box-shadow: 0 0 0 5px #45d49a22; }
    .dot.bad { background: #ff7777; box-shadow: 0 0 0 5px #ff777722; }
    .status-label { color: #9ba8bd; font-size: 12px; }
    #status { margin-top: 3px; font-size: 16px; font-weight: 700; text-transform: capitalize; }
    dl { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin: 22px 2px 0; font-size: 13px; }
    dt { color: #9ba8bd; } dd { margin: 0; color: #e6ebf4; text-align: right; }
    footer { margin-top: 26px; color: #7f8ca2; font-size: 12px; }
    @media (max-width: 420px) { main { padding: 24px; } }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Bot service</p>
    <h1>Queen Riam</h1>
    <p class="subtitle">A live overview of the service and WhatsApp connection.</p>
    <section class="status-card" aria-live="polite">
      <span id="status-dot" class="dot" aria-hidden="true"></span>
      <div>
        <div class="status-label">WhatsApp connection</div>
        <div id="status">Starting</div>
      </div>
    </section>
    <dl>
      <dt>Service uptime</dt><dd id="uptime">—</dd>
      <dt>Last checked</dt><dd id="checked-at">—</dd>
    </dl>
    <footer>Refreshes automatically every 10 seconds.</footer>
  </main>
  <script>
    const statusEl = document.getElementById('status');
    const dotEl = document.getElementById('status-dot');
    const uptimeEl = document.getElementById('uptime');
    const checkedAtEl = document.getElementById('checked-at');
    const goodStatuses = new Set(['connected']);
    const badStatuses = new Set(['disconnected', 'logged-out', 'error']);

    function formatUptime(totalSeconds) {
      const seconds = Math.max(0, Math.floor(totalSeconds));
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainder = seconds % 60;
      return hours ? hours + 'h ' + minutes + 'm' : minutes + 'm ' + remainder + 's';
    }

    async function refreshStatus() {
      try {
        const response = await fetch('/healthz', { cache: 'no-store' });
        if (!response.ok) throw new Error('Health request failed');
        const data = await response.json();
        statusEl.textContent = data.whatsappConnection;
        dotEl.className = 'dot' + (goodStatuses.has(data.whatsappConnection) ? ' good' : badStatuses.has(data.whatsappConnection) ? ' bad' : '');
        uptimeEl.textContent = formatUptime(data.uptimeSeconds);
        checkedAtEl.textContent = new Date(data.checkedAt).toLocaleTimeString();
      } catch (_) {
        statusEl.textContent = 'Health check unavailable';
        dotEl.className = 'dot bad';
      }
    }

    refreshStatus();
    setInterval(refreshStatus, 10000);
  </script>
</body>
</html>`;
}

function startHealthServer() {
    const port = Number(process.env.PORT || 10000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535.');
    }

    const server = http.createServer((request, response) => {
        if (request.method !== 'GET') {
            response.setHeader('Allow', 'GET');
            return send(response, 405, 'text/plain; charset=utf-8', 'Method not allowed');
        }

        let pathname;
        try {
            pathname = new URL(request.url, 'http://localhost').pathname;
        } catch (_) {
            return send(response, 400, 'text/plain; charset=utf-8', 'Bad request');
        }

        if (pathname === '/healthz') {
            return send(response, 200, 'application/json; charset=utf-8', JSON.stringify({
                status: 'ok',
                whatsappConnection: whatsappStatus,
                uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
                checkedAt: new Date().toISOString(),
            }));
        }

        if (pathname === '/favicon.ico') {
            response.writeHead(204);
            return response.end();
        }

        if (pathname === '/') {
            return send(response, 200, 'text/html; charset=utf-8', healthPage());
        }

        return send(response, 404, 'text/plain; charset=utf-8', 'Not found');
    });

    server.on('error', (error) => {
        console.error('[Health] HTTP server error:', error.message);
        process.exit(1);
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`[Health] Status page listening on 0.0.0.0:${port}`);
    });

    return server;
}

module.exports = { startHealthServer, setWhatsAppStatus };
