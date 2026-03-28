import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { apiKeyAuthMiddleware } from './middleware/auth.js';
import { registerClientTools } from './tools/clients.js';

export function buildServer(userId: string): McpServer {
  const server = new McpServer(
    { name: 'freelance-os', version: '0.1.0' },
    { capabilities: { logging: {} } }
  );
  registerClientTools(server, userId);
  // registerProjectTools(server, userId);  — Phase 2 Plan 03
  return server;
}

const app = express();
app.use(express.json());
app.post('/mcp', apiKeyAuthMiddleware, async (req, res) => {
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
});

app.get('/mcp', (_req, res) => { res.status(405).end(); });
app.delete('/mcp', (_req, res) => { res.status(405).end(); });

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`FreelanceOS MCP server listening on port ${PORT}`);
});
