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
    {
      name: 'freelance-os',
      version: '0.1.0',
      description: 'AI-powered freelance business manager. Manage clients, proposals, invoices, time tracking, scope, and follow-ups — 37 tools covering the full freelance lifecycle from lead to payment.',
      websiteUrl: 'https://github.com/Sohlin2/freelance-os',
      icons: [{ src: 'https://raw.githubusercontent.com/Sohlin2/freelance-os/main/logo.svg', mimeType: 'image/svg+xml' }],
      title: 'FreelanceOS',
    },
    { capabilities: { logging: {}, prompts: {}, resources: {} } }
  );
  registerClientTools(server, userId);
  registerProjectTools(server, userId);
  registerProposalTools(server, userId);
  registerInvoiceTools(server, userId);
  registerTimeEntryTools(server, userId);
  registerScopeTools(server, userId);
  registerFollowUpTools(server, userId);

  // Prompts — give Smithery something to discover
  server.prompt('freelance-onboarding', 'Step-by-step guide to set up your freelance business in FreelanceOS. Walks through creating your first client, project, proposal, and invoice.', () => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: 'Help me set up my freelance business in FreelanceOS. Walk me through creating my first client, then a project, a proposal, and finally an invoice. Ask me questions along the way to fill in the details.' },
    }],
  }));

  server.prompt('weekly-review', 'Generate a weekly summary of time logged, invoices due, and follow-ups needed across all active projects.', () => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: 'Give me a weekly review of my freelance business. Show me: 1) Total hours logged this week by project, 2) Any overdue or upcoming invoices, 3) Follow-ups I need to send. Use my FreelanceOS data.' },
    }],
  }));

  // Resources — expose useful read-only data
  server.resource('business-summary', 'freelance://summary', { description: 'High-level overview of your freelance business: total clients, active projects, pending invoices, and recent activity.', mimeType: 'text/plain' }, async () => ({
    contents: [{ uri: 'freelance://summary', text: 'Use the clients.records.list, projects.records.list, invoices.records.list, and time.entries.list tools to build a comprehensive business summary.' }],
  }));

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

// Landing page (skip if MCP session header present — handled by MCP GET below)
app.get('/', (req, res, next) => {
  if (req.headers['mcp-session-id']) return next();
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FreelanceOS — AI Freelance Business Manager for Claude Code</title>
  <meta name="description" content="Stop context-switching between coding and admin. FreelanceOS turns Claude Code into your freelance business manager — proposals, invoices, time tracking, scope management, and follow-ups. 37 MCP tools, 5 coaching skills. One install command.">
  <meta property="og:title" content="FreelanceOS — Your Freelance Business, Inside Claude Code">
  <meta property="og:description" content="Proposals, invoices, time tracking, scope management, and follow-ups — all from your terminal. 37 tools, 5 coaching skills. Stop tab-switching, start shipping.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://freelance-os-production.up.railway.app">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="FreelanceOS — Your Freelance Business, Inside Claude Code">
  <meta name="twitter:description" content="37 MCP tools turn Claude into your freelance business manager. Proposals, invoices, time tracking — conversational. One install, no browser needed.">
  <link rel="canonical" href="https://freelance-os-production.up.railway.app">
  <meta name="keywords" content="freelance tools, claude code plugin, mcp server, freelance invoicing, freelance proposals, time tracking, scope management, ai freelance, claude code mcp">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FreelanceOS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Windows, macOS, Linux",
    "description": "AI-powered freelance business manager for Claude Code. 37 MCP tools covering proposals, invoices, time tracking, scope management, and follow-ups.",
    "url": "https://freelance-os-production.up.railway.app",
    "offers": [
      {
        "@type": "Offer",
        "price": "19.00",
        "priceCurrency": "USD",
        "description": "Monthly plan with 7-day free trial",
        "url": "https://buy.stripe.com/5kQdRagAv5sr5U20rU2Ji02"
      },
      {
        "@type": "Offer",
        "price": "40.00",
        "priceCurrency": "USD",
        "description": "Lifetime access, one-time payment",
        "url": "https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01"
      }
    ],
    "featureList": "Client CRM, Proposal Drafting, Invoice Generation, Time Tracking, Scope Management, Follow-up Automation, Coaching Skills"
  }
  </script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;padding:20px}
    .page{max-width:680px;width:100%;margin:0 auto;padding:48px 0}
    h1{font-size:42px;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-0.5px}
    .subtitle{font-size:15px;color:#22c55e;font-weight:600;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px}
    .tagline{font-size:20px;color:#a3a3a3;margin-bottom:12px;line-height:1.6}
    .hook{font-size:15px;color:#737373;margin-bottom:32px;line-height:1.6}
    .stats{display:flex;gap:24px;margin-bottom:32px;flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-size:28px;font-weight:700;color:#22c55e}
    .stat-label{font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:0.5px}
    .section-title{font-size:13px;font-weight:700;color:#525252;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px}
    .demo{background:#171717;border:1px solid #262626;border-radius:12px;padding:20px 24px;margin-bottom:32px;font-size:14px;line-height:1.8}
    .demo-prompt{color:#22c55e;font-family:'SF Mono','Fira Code',monospace;font-size:13px}
    .demo-response{color:#a3a3a3;font-size:13px;margin:4px 0 12px;padding-left:16px;border-left:2px solid #262626}
    .features{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:32px}
    .feat{background:#171717;border:1px solid #262626;border-radius:8px;padding:14px 16px;font-size:14px;color:#d4d4d4}
    .feat strong{color:#fff;display:block;margin-bottom:2px}
    .audience{background:#0c1222;border:1px solid #1e3a5f;border-radius:12px;padding:20px 24px;margin-bottom:32px;font-size:14px;color:#93c5fd;line-height:1.8}
    .audience strong{color:#fff}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
    .card{background:#171717;border:1px solid #262626;border-radius:12px;padding:24px;text-align:center}
    .card.pop{border-color:#22c55e;position:relative}
    .card.pop::before{content:'MOST POPULAR';position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#22c55e;color:#000;font-size:10px;font-weight:700;padding:2px 10px;border-radius:4px;letter-spacing:0.5px}
    .price{font-size:32px;font-weight:700;color:#fff;margin:8px 0 4px}
    .price span{font-size:16px;font-weight:400;color:#a3a3a3}
    .label{font-size:13px;color:#a3a3a3;margin-bottom:16px}
    .btn{display:inline-block;width:100%;padding:14px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;text-align:center;cursor:pointer;border:none;transition:all 0.2s}
    .btn-primary{background:#22c55e;color:#000}
    .btn-primary:hover{background:#16a34a;transform:translateY(-1px)}
    .btn-secondary{background:#262626;color:#e5e5e5}
    .btn-secondary:hover{background:#333;transform:translateY(-1px)}
    .badge{display:inline-block;background:#14532d;color:#22c55e;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;margin-bottom:8px}
    .install{background:#171717;border:1px solid #262626;border-radius:8px;padding:16px;font-family:'SF Mono','Fira Code',monospace;font-size:14px;color:#22c55e;margin-bottom:24px;text-align:center;position:relative;cursor:pointer;transition:border-color 0.2s}
    .install:hover{border-color:#22c55e}
    .install::after{content:'click to copy';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:11px;color:#525252;font-family:-apple-system,sans-serif}
    .setup{background:#171717;border:1px solid #262626;border-radius:8px;padding:16px;font-size:13px;color:#d4d4d4;line-height:1.8;margin-bottom:24px}
    .setup strong{color:#fff}
    code{background:#1e293b;padding:2px 6px;border-radius:4px;font-family:'SF Mono','Fira Code',monospace;font-size:12px}
    .trust{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}
    .trust-item{font-size:12px;color:#525252;display:flex;align-items:center;gap:4px}
    .trust-item svg{width:14px;height:14px;fill:#22c55e}
    .guarantee{text-align:center;background:#14532d22;border:1px solid #14532d;border-radius:8px;padding:12px;font-size:13px;color:#22c55e;margin-bottom:24px}
    .footer{text-align:center;font-size:12px;color:#525252;margin-top:16px}
    .footer a{color:#a3a3a3;text-decoration:none}
    @media(max-width:480px){
      h1{font-size:32px}
      .tagline{font-size:17px}
      .features{grid-template-columns:1fr}
      .cards{grid-template-columns:1fr}
      .stats{justify-content:center}
      .install::after{display:none}
      .card.pop::before{top:-9px}
    }
  </style>
</head>
<body>
  <div class="page">
    <p class="subtitle">Claude Code Plugin</p>
    <h1>FreelanceOS</h1>
    <p class="tagline">Stop tab-switching between coding and admin.<br>Manage your freelance business without leaving Claude Code.</p>
    <p class="hook">Proposals, invoices, time tracking, scope management, and follow-ups — tell Claude what you need in plain English. Expert coaching built in, not just data entry.</p>

    <div class="stats">
      <div class="stat"><div class="stat-num">37</div><div class="stat-label">MCP Tools</div></div>
      <div class="stat"><div class="stat-num">5</div><div class="stat-label">Coaching Skills</div></div>
      <div class="stat"><div class="stat-num">7</div><div class="stat-label">Entities</div></div>
    </div>

    <div class="install" onclick="navigator.clipboard.writeText('claude plugin install freelance-os').then(()=>{this.style.borderColor='#22c55e';this.innerHTML='Copied!';setTimeout(()=>{this.innerHTML='claude plugin install freelance-os';this.style.borderColor='#262626'},2000)})">claude plugin install freelance-os</div>

    <p class="section-title">See it in action</p>
    <div class="demo">
      <div class="demo-prompt">> "Draft a proposal for Acme Corp's website redesign at $150/hr"</div>
      <div class="demo-response">Claude drafts a professional proposal with pricing breakdown, revision limits, payment milestones, and scope boundaries — saved to your database.</div>
      <div class="demo-prompt">> "Show my uninvoiced hours this week and generate an invoice"</div>
      <div class="demo-response">Aggregates 23.5 hours across 2 projects, generates invoice with line items, tax, and payment terms. Status: draft.</div>
      <div class="demo-prompt">> "Invoice #42 is 2 weeks overdue. Draft a follow-up."</div>
      <div class="demo-response">Pulls client context, invoice history, and prior follow-ups. Drafts a firm but professional reminder with the exact amount and due date.</div>
    </div>

    <p class="section-title">Everything you need</p>
    <div class="features">
      <div class="feat"><strong>Proposals</strong>Draft with pricing strategy, scope, payment terms</div>
      <div class="feat"><strong>Invoices</strong>Line items, tax, status tracking, overdue alerts</div>
      <div class="feat"><strong>Time Tracking</strong>Log hours, aggregate by project for billing</div>
      <div class="feat"><strong>Scope</strong>Define boundaries, log changes, catch creep</div>
      <div class="feat"><strong>Follow-ups</strong>Context-aware reminders and check-ins</div>
      <div class="feat"><strong>Client CRM</strong>Contacts, rates, notes, project history</div>
    </div>

    <div class="audience">
      <strong>Built for freelance developers</strong> who already use Claude Code for work and want to stop context-switching to manage the business side. If you bill clients, write proposals, or track hours — this replaces 3-4 separate tools with one conversation.
    </div>

    <p class="section-title">Launch pricing</p>
    <div class="cards">
      <div class="card">
        <div class="badge">7-DAY FREE TRIAL</div>
        <div class="label">Monthly</div>
        <div class="price">$19<span>/mo</span></div>
        <div class="label">Try free for 7 days, cancel anytime</div>
        <a href="https://buy.stripe.com/5kQdRagAv5sr5U20rU2Ji02" class="btn btn-secondary">Start Free Trial</a>
      </div>
      <div class="card pop">
        <div class="badge">SAVE 80%+</div>
        <div class="label">Lifetime</div>
        <div class="price">$40</div>
        <div class="label">One payment, forever access</div>
        <a href="https://buy.stripe.com/00w4gAac7bQP2HQ1vY2Ji01" class="btn btn-primary">Buy Lifetime Access</a>
      </div>
    </div>

    <div class="guarantee">Lifetime deal locks in current pricing. As features grow, the price will too.</div>

    <div class="trust">
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>Per-user data isolation (RLS)</div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>API key in system keychain</div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>Stripe-secured billing</div>
    </div>

    <p class="section-title">Get started in 60 seconds</p>
    <div class="setup">
      <strong>1.</strong> Pick a plan above — your API key is delivered instantly<br>
      <strong>2.</strong> <code>claude plugin install freelance-os</code><br>
      <strong>3.</strong> Paste your API key when prompted<br>
      <strong>4.</strong> Say: <em>"Create a client for Acme Corp"</em> — you're live
    </div>

    <div class="footer">
      <a href="/health">Status</a> &middot; <a href="https://www.npmjs.com/package/freelance-os">npm</a> &middot; <a href="https://github.com/Sohlin2/freelance-os">GitHub</a>
    </div>
  </div>
</body>
</html>`);
});

// MCP server card — allows scanners (e.g. Smithery) to discover capabilities without connecting
app.get('/.well-known/mcp/server-card.json', (_req, res) => {
  res.json(serverCard);
});

// SEO: robots.txt
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /mcp
Disallow: /checkout
Disallow: /portal
Disallow: /stripe/

Sitemap: https://freelance-os-production.up.railway.app/sitemap.xml`);
});

// SEO: sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://freelance-os-production.up.railway.app</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://freelance-os-production.up.railway.app/health</loc>
    <changefreq>daily</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`);
});

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.2.0' });
});

// Stripe checkout session (public — no auth needed)
app.post('/checkout', handleCheckout);

// Customer portal (authenticated — lets users manage subscription)
app.post('/portal', apiKeyAuthMiddleware, handlePortalSession);

// MCP handler (auth + active subscription required)
// Session store: maps sessionId → { server, transport, userId, lastAccess }
import { randomUUID } from 'node:crypto';

const sessions = new Map<string, {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  userId: string;
  lastAccess: number;
}>();

// Clean up sessions older than 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.lastAccess < cutoff) {
      session.transport.close();
      session.server.close();
      sessions.delete(id);
    }
  }
}, 60_000);

const mcpPostHandler: express.RequestHandler = async (req, res) => {
  const userId = req.userId!;

  // Check for existing session
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    session.lastAccess = Date.now();
    try {
      await session.transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
    return;
  }

  // New session: create server + transport
  const server = buildServer(userId);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    // Store session for subsequent requests
    const newSessionId = transport.sessionId;
    if (newSessionId) {
      sessions.set(newSessionId, { server, transport, userId, lastAccess: Date.now() });
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
};

const mcpGetHandler: express.RequestHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Invalid or missing session ID' }, id: null });
    return;
  }
  const session = sessions.get(sessionId)!;
  session.lastAccess = Date.now();
  try {
    await session.transport.handleRequest(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
};

const mcpDeleteHandler: express.RequestHandler = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    session.transport.close();
    session.server.close();
    sessions.delete(sessionId);
  }
  res.status(200).end();
};

// Mount MCP on both /mcp and / (Smithery posts to base URL)
app.post('/mcp', apiKeyAuthMiddleware, billingMiddleware, mcpPostHandler);
app.post('/', apiKeyAuthMiddleware, billingMiddleware, mcpPostHandler);

app.get('/mcp', apiKeyAuthMiddleware, billingMiddleware, mcpGetHandler);
app.get('/', apiKeyAuthMiddleware, billingMiddleware, mcpGetHandler);

app.delete('/mcp', mcpDeleteHandler);
app.delete('/', mcpDeleteHandler);

// Catch-all: return JSON 404 for unknown routes.
// Prevents Express default HTML 404s that break MCP scanners (e.g. Smithery).
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`FreelanceOS MCP server listening on port ${PORT}`);
});
