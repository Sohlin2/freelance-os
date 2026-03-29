import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import cors from 'cors';
import { apiKeyAuthMiddleware } from './middleware/auth.js';
import { billingMiddleware } from './middleware/billing.js';
import { registerClientTools } from './tools/clients.js';
import { registerProjectTools } from './tools/projects.js';
import { registerProposalTools } from './tools/proposals.js';
import { registerInvoiceTools } from './tools/invoices.js';
import { registerTimeEntryTools } from './tools/time-entries.js';
import { registerScopeTools } from './tools/scope.js';
import { registerFollowUpTools } from './tools/follow-ups.js';
import { handleCheckout } from './routes/checkout.js';
import { handleStripeWebhook } from './routes/webhook.js';
import { handlePortalSession } from './routes/portal.js';
import { serverCard } from './server-card.js';

// Fail fast if required env vars are missing
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_MONTHLY',
  'STRIPE_PRICE_ID_LIFETIME',
] as const;

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

export function buildServer(userId: string): McpServer {
  const server = new McpServer(
    { name: 'freelance-os', version: '0.1.0' },
    { capabilities: { logging: {} } }
  );
  registerClientTools(server, userId);
  registerProjectTools(server, userId);
  registerProposalTools(server, userId);
  registerInvoiceTools(server, userId);
  registerTimeEntryTools(server, userId);
  registerScopeTools(server, userId);
  registerFollowUpTools(server, userId);
  return server;
}

const app = express();

// CORS — required for browser-based MCP scanners (e.g. Smithery)
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Accept'],
  exposedHeaders: ['Content-Type'],
}));

// Stripe webhook needs raw body for signature verification — must come BEFORE express.json()
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// Landing page
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FreelanceOS — AI Freelance Business Manager for Claude Code</title>
  <meta name="description" content="Manage your entire freelance business from Claude Code. Proposals, invoices, time tracking, scope management, and follow-ups — all conversational. 37 MCP tools, 5 coaching skills.">
  <meta property="og:title" content="FreelanceOS — AI Freelance Manager for Claude Code">
  <meta property="og:description" content="Proposals, invoices, time tracking, scope management, and follow-ups — all from your terminal. 37 tools, 5 coaching skills, one install command.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://freelance-os-production.up.railway.app">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="FreelanceOS — AI Freelance Manager for Claude Code">
  <meta name="twitter:description" content="Manage your freelance business without leaving Claude Code. 37 MCP tools, 5 coaching skills, instant setup.">
  <link rel="canonical" href="https://freelance-os-production.up.railway.app">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .page{max-width:640px;width:100%}
    h1{font-size:36px;font-weight:700;color:#fff;margin-bottom:8px}
    .tagline{font-size:18px;color:#a3a3a3;margin-bottom:32px;line-height:1.6}
    .stats{display:flex;gap:24px;margin-bottom:32px;flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-size:28px;font-weight:700;color:#22c55e}
    .stat-label{font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.5px}
    .features{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px}
    .feat{background:#171717;border:1px solid #262626;border-radius:8px;padding:14px 16px;font-size:14px;color:#d4d4d4}
    .feat strong{color:#fff;display:block;margin-bottom:2px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
    .card{background:#171717;border:1px solid #262626;border-radius:12px;padding:24px;text-align:center}
    .card.pop{border-color:#22c55e}
    .price{font-size:32px;font-weight:700;color:#fff;margin:8px 0 4px}
    .price span{font-size:16px;font-weight:400;color:#a3a3a3}
    .label{font-size:13px;color:#a3a3a3;margin-bottom:16px}
    .btn{display:inline-block;width:100%;padding:12px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;text-align:center;cursor:pointer;border:none}
    .btn-primary{background:#22c55e;color:#000}
    .btn-primary:hover{background:#16a34a}
    .btn-secondary{background:#262626;color:#e5e5e5}
    .btn-secondary:hover{background:#333}
    .badge{display:inline-block;background:#14532d;color:#22c55e;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;margin-bottom:8px}
    .install{background:#171717;border:1px solid #262626;border-radius:8px;padding:16px;font-family:'SF Mono','Fira Code',monospace;font-size:14px;color:#22c55e;margin-bottom:24px;text-align:center;position:relative;cursor:pointer}
    .install:hover{border-color:#22c55e}
    .install::after{content:'click to copy';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:11px;color:#525252;font-family:-apple-system,sans-serif}
    .setup{background:#0c1222;border:1px solid #1e3a5f;border-radius:8px;padding:16px;font-size:13px;color:#93c5fd;line-height:1.8;margin-bottom:16px}
    code{background:#1e293b;padding:2px 6px;border-radius:4px;font-family:'SF Mono','Fira Code',monospace;font-size:12px}
    .footer{text-align:center;font-size:12px;color:#525252;margin-top:16px}
    .footer a{color:#a3a3a3;text-decoration:none}
    @media(max-width:480px){
      h1{font-size:28px}
      .tagline{font-size:16px}
      .features{grid-template-columns:1fr}
      .cards{grid-template-columns:1fr}
      .stats{justify-content:center}
      .install::after{display:none}
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>FreelanceOS</h1>
    <p class="tagline">Manage your entire freelance business from Claude Code.<br>Proposals, invoices, time tracking, scope management, and follow-ups — all conversational.</p>
    <div class="stats">
      <div class="stat"><div class="stat-num">37</div><div class="stat-label">MCP Tools</div></div>
      <div class="stat"><div class="stat-num">5</div><div class="stat-label">Coaching Skills</div></div>
      <div class="stat"><div class="stat-num">7</div><div class="stat-label">Entities</div></div>
    </div>
    <div class="install" onclick="navigator.clipboard.writeText('claude plugin install freelance-os').then(()=>{this.style.borderColor='#22c55e';this.innerHTML='Copied!';setTimeout(()=>{this.innerHTML='claude plugin install freelance-os';this.style.borderColor='#262626'},2000)})">claude plugin install freelance-os</div>
    <div class="features">
      <div class="feat"><strong>Proposals</strong>Draft, price, and send</div>
      <div class="feat"><strong>Invoices</strong>Generate and track payments</div>
      <div class="feat"><strong>Time Tracking</strong>Log hours, aggregate by project</div>
      <div class="feat"><strong>Scope</strong>Define boundaries, catch creep</div>
      <div class="feat"><strong>Follow-ups</strong>Overdue reminders, check-ins</div>
      <div class="feat"><strong>Clients</strong>Full CRM in your terminal</div>
    </div>
    <div class="cards">
      <div class="card">
        <div class="label">Monthly</div>
        <div class="price">$19<span>/mo</span></div>
        <div class="label">Cancel anytime</div>
        <a href="https://buy.stripe.com/bJefZi83Zg75dmu2A22Ji00" class="btn btn-secondary">Subscribe</a>
      </div>
      <div class="card pop">
        <div class="badge">BEST VALUE</div>
        <div class="label">Lifetime</div>
        <div class="price">$40</div>
        <div class="label">One-time payment, forever access</div>
        <a href="https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01" class="btn btn-primary">Buy Once</a>
      </div>
    </div>
    <div class="setup">
      <strong>Quick start:</strong><br>
      1. Buy above — get your API key instantly<br>
      2. <code>claude plugin install freelance-os</code><br>
      3. Paste your API key when prompted<br>
      4. Tell Claude: "Create a client for Acme Corp"
    </div>
    <div class="footer">
      <a href="/health">Status</a> &middot; <a href="https://www.npmjs.com/package/freelance-os">npm</a>
    </div>
  </div>
</body>
</html>`);
});

// MCP server card — allows scanners (e.g. Smithery) to discover capabilities without connecting
app.get('/.well-known/mcp/server-card.json', (_req, res) => {
  res.json(serverCard);
});

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// Stripe checkout session (public — no auth needed)
app.post('/checkout', handleCheckout);

// Customer portal (authenticated — lets users manage subscription)
app.post('/portal', apiKeyAuthMiddleware, handlePortalSession);

// MCP handler (auth + active subscription required)
const mcpHandler: express.RequestHandler = async (req, res) => {
  const userId = req.userId!;
  const server = buildServer(userId);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
};

// Mount MCP on both /mcp and / (Smithery posts to base URL)
app.post('/mcp', apiKeyAuthMiddleware, billingMiddleware, mcpHandler);
app.post('/', apiKeyAuthMiddleware, billingMiddleware, mcpHandler);

app.get('/mcp', (_req, res) => { res.status(405).end(); });
app.delete('/mcp', (_req, res) => { res.status(405).end(); });

// Catch-all: return JSON 404 for unknown routes.
// Prevents Express default HTML 404s that break MCP scanners (e.g. Smithery).
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`FreelanceOS MCP server listening on port ${PORT}`);
});
