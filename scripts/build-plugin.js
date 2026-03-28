// scripts/build-plugin.js — Node ESM build script for FreelanceOS plugin packaging
// Copies skills from .claude/skills/ to top-level skills/, validates manifests,
// and scans for secrets before npm publish.

import { cp, rm, readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKILLS_SRC = join(ROOT, '.claude', 'skills');
const SKILLS_DEST = join(ROOT, 'skills');
const PLUGIN_DIR = join(ROOT, '.claude-plugin');
const PLUGIN_JSON = join(PLUGIN_DIR, 'plugin.json');
const MCP_JSON = join(ROOT, '.mcp.json');

// Secret patterns — any match in packaged files fails the build
const SECRET_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE/i,
  /eyJ[A-Za-z0-9+/=]{20,}/, // base64 JWT prefix (Supabase anon/service keys)
  /fos_live_[0-9a-f-]{36}/, // live FreelanceOS API key values
  /sb_[a-z]+_[A-Za-z0-9]{20,}/, // Supabase project reference keys
];

/**
 * Recursively scan all files in a directory for secret patterns.
 * Exits with code 1 if any pattern matches.
 */
async function scanForSecrets(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath ?? entry.path, entry.name);
    const content = await readFile(full, 'utf8').catch(() => '');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`SECRET DETECTED in ${full} — pattern: ${pattern}`);
        process.exit(1);
      }
    }
  }
}

async function build() {
  console.log('Building FreelanceOS plugin...');

  // 1. Remove stale skills/ output directory and copy fresh from .claude/skills/
  await rm(SKILLS_DEST, { recursive: true, force: true });
  await cp(SKILLS_SRC, SKILLS_DEST, { recursive: true });

  // 2. Validate plugin.json exists and is valid JSON
  const pluginContent = await readFile(PLUGIN_JSON, 'utf8').catch(() => {
    console.error(`ERROR: plugin.json not found at ${PLUGIN_JSON}`);
    process.exit(1);
  });
  try {
    JSON.parse(pluginContent);
  } catch (e) {
    console.error(`ERROR: plugin.json is invalid JSON: ${e.message}`);
    process.exit(1);
  }

  // 3. Validate .mcp.json exists and is valid JSON
  const mcpContent = await readFile(MCP_JSON, 'utf8').catch(() => {
    console.error(`ERROR: .mcp.json not found at ${MCP_JSON}`);
    process.exit(1);
  });
  try {
    JSON.parse(mcpContent);
  } catch (e) {
    console.error(`ERROR: .mcp.json is invalid JSON: ${e.message}`);
    process.exit(1);
  }

  // 4. Secret scan — skills/ directory
  await scanForSecrets(SKILLS_DEST);

  // 5. Secret scan — .claude-plugin/ directory
  await scanForSecrets(PLUGIN_DIR);

  // 6. Secret scan — .mcp.json content
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(mcpContent)) {
      console.error(`SECRET DETECTED in .mcp.json — pattern: ${pattern}`);
      process.exit(1);
    }
  }

  // 7. Verify minimum skill count
  const entries = await readdir(SKILLS_DEST, { withFileTypes: true });
  const skills = entries.filter(e => e.isDirectory()).map(e => e.name);
  if (skills.length < 5) {
    console.error(`Expected at least 5 skill dirs, found ${skills.length}: ${skills.join(', ')}`);
    process.exit(1);
  }

  console.log(`Build complete. ${skills.length} skills ready. No secrets detected.`);
  console.log(`  Skills: ${skills.join(', ')}`);
}

build().catch(e => {
  console.error(e);
  process.exit(1);
});
