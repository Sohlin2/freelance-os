import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

beforeAll(() => {
  // Ensure build output is fresh before running tests
  execSync('node scripts/build-plugin.js', { cwd: ROOT, stdio: 'pipe' });
});

// ─── plugin.json manifest (INFRA-04) ───────────────────────────────────────

describe('plugin.json manifest (INFRA-04)', () => {
  it('plugin.json exists at .claude-plugin/plugin.json and is valid JSON', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    expect(existsSync(path)).toBe(true);
    expect(() => JSON.parse(readFileSync(path, 'utf8'))).not.toThrow();
  });

  it('plugin.json name field equals "freelance-os"', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest.name).toBe('freelance-os');
  });

  it('plugin.json has skills field set to "./skills/"', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest.skills).toBe('./skills/');
  });

  it('plugin.json does NOT contain mcpServers key (lives in .mcp.json)', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest).not.toHaveProperty('mcpServers');
  });

  it('plugin.json does NOT contain hooks key (per D-03)', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest).not.toHaveProperty('hooks');
  });
});

// ─── userConfig API key (INFRA-05) ────────────────────────────────────────

describe('userConfig API key (INFRA-05)', () => {
  it('userConfig.FREELANCEOS_API_KEY exists', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest.userConfig).toBeDefined();
    expect(manifest.userConfig.FREELANCEOS_API_KEY).toBeDefined();
  });

  it('userConfig.FREELANCEOS_API_KEY.sensitive is exactly true', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest.userConfig.FREELANCEOS_API_KEY.sensitive).toBe(true);
  });

  it('userConfig.FREELANCEOS_API_KEY.description is a non-empty string', () => {
    const path = join(ROOT, '.claude-plugin', 'plugin.json');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const desc = manifest.userConfig.FREELANCEOS_API_KEY.description;
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });
});

// ─── .mcp.json server config (INFRA-04, INFRA-05) ─────────────────────────

describe('.mcp.json server config (INFRA-04, INFRA-05)', () => {
  it('.mcp.json exists at package root and is valid JSON', () => {
    const path = join(ROOT, '.mcp.json');
    expect(existsSync(path)).toBe(true);
    expect(() => JSON.parse(readFileSync(path, 'utf8'))).not.toThrow();
  });

  it('mcpServers["freelance-os"].type equals "http"', () => {
    const path = join(ROOT, '.mcp.json');
    const config = JSON.parse(readFileSync(path, 'utf8'));
    expect(config.mcpServers['freelance-os'].type).toBe('http');
  });

  it('mcpServers["freelance-os"].url is a string starting with "https://"', () => {
    const path = join(ROOT, '.mcp.json');
    const config = JSON.parse(readFileSync(path, 'utf8'));
    const url = config.mcpServers['freelance-os'].url;
    expect(typeof url).toBe('string');
    expect(url.startsWith('https://')).toBe(true);
  });

  it('Authorization header contains "${user_config.FREELANCEOS_API_KEY}" (exact substitution syntax)', () => {
    const path = join(ROOT, '.mcp.json');
    const config = JSON.parse(readFileSync(path, 'utf8'));
    const authHeader = config.mcpServers['freelance-os'].headers?.Authorization;
    expect(authHeader).toContain('${user_config.FREELANCEOS_API_KEY}');
  });

  it('Authorization header starts with "Bearer " prefix', () => {
    const path = join(ROOT, '.mcp.json');
    const config = JSON.parse(readFileSync(path, 'utf8'));
    const authHeader = config.mcpServers['freelance-os'].headers?.Authorization;
    expect(typeof authHeader).toBe('string');
    expect(authHeader.startsWith('Bearer ')).toBe(true);
  });
});

// ─── build output (INFRA-04) ─────────────────────────────────────────────

describe('build output (INFRA-04)', () => {
  it('skills/ directory exists after build', () => {
    const skillsDir = join(ROOT, 'skills');
    expect(existsSync(skillsDir)).toBe(true);
  });

  it('skills/ contains exactly 5 subdirectories', () => {
    const skillsDir = join(ROOT, 'skills');
    const entries = readdirSync(skillsDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory());
    expect(dirs.length).toBe(5);
  });

  const expectedSkills = [
    'freelance-proposals',
    'freelance-followups',
    'freelance-scope',
    'freelance-invoices',
    'freelance-time',
  ];

  for (const skill of expectedSkills) {
    it(`skills/${skill} directory exists`, () => {
      const skillDir = join(ROOT, 'skills', skill);
      expect(existsSync(skillDir)).toBe(true);
    });

    it(`skills/${skill}/SKILL.md file exists`, () => {
      const skillMd = join(ROOT, 'skills', skill, 'SKILL.md');
      expect(existsSync(skillMd)).toBe(true);
    });
  }
});

// ─── secret scanning (INFRA-04) ──────────────────────────────────────────

describe('secret scanning (INFRA-04)', () => {
  it('build script exits non-zero when a file containing "service_role" is planted in skills/', () => {
    // Plant temp file in SOURCE directory — build script copies .claude/skills/ to skills/
    // so a secret in the source is what triggers the scan failure
    const tempFile = join(ROOT, '.claude', 'skills', 'freelance-proposals', 'TEMP_SECRET_TEST.md');
    writeFileSync(tempFile, 'service_role key here');
    let threw = false;
    try {
      execSync('node scripts/build-plugin.js', { cwd: ROOT, stdio: 'pipe' });
    } catch {
      threw = true;
    } finally {
      // Clean up temp file from source
      if (existsSync(tempFile)) unlinkSync(tempFile);
      // Re-run clean build to restore state
      execSync('node scripts/build-plugin.js', { cwd: ROOT, stdio: 'pipe' });
    }
    expect(threw).toBe(true);
  });

  it('build script exits non-zero when a file containing an eyJ JWT pattern is planted in skills/', () => {
    // Plant temp file in SOURCE directory — build script copies .claude/skills/ to skills/
    const tempFile = join(ROOT, '.claude', 'skills', 'freelance-proposals', 'TEMP_JWT_TEST.md');
    // Plant a realistic-looking base64 JWT token (eyJ prefix + 20+ base64 chars)
    writeFileSync(tempFile, 'token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0');
    let threw = false;
    try {
      execSync('node scripts/build-plugin.js', { cwd: ROOT, stdio: 'pipe' });
    } catch {
      threw = true;
    } finally {
      // Clean up temp file from source
      if (existsSync(tempFile)) unlinkSync(tempFile);
      // Re-run clean build to restore state
      execSync('node scripts/build-plugin.js', { cwd: ROOT, stdio: 'pipe' });
    }
    expect(threw).toBe(true);
  });
});

// ─── package.json publishing (INFRA-04) ──────────────────────────────────

describe('package.json publishing (INFRA-04)', () => {
  it('package.json does NOT have "private": true', () => {
    const path = join(ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    expect(pkg.private).not.toBe(true);
  });

  it('package.json has "files" array containing ".claude-plugin/", "skills/", ".mcp.json", "README.md"', () => {
    const path = join(ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain('.claude-plugin/');
    expect(pkg.files).toContain('skills/');
    expect(pkg.files).toContain('.mcp.json');
    expect(pkg.files).toContain('README.md');
  });

  it('package.json has license "MIT"', () => {
    const path = join(ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    expect(pkg.license).toBe('MIT');
  });

  it('package.json scripts.prepublishOnly equals "npm run build"', () => {
    const path = join(ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    expect(pkg.scripts?.prepublishOnly).toBe('npm run build');
  });
});

// ─── npm pack contents (INFRA-04) ────────────────────────────────────────

describe('npm pack contents (INFRA-04)', () => {
  let packFiles: string[] = [];

  beforeAll(() => {
    // Use --json flag for reliable parsing
    const output = execSync('npm pack --dry-run --json', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(output);
    // npm pack --json returns array; first element has files array
    const packResult = Array.isArray(parsed) ? parsed[0] : parsed;
    packFiles = (packResult.files as Array<{ path: string }>).map(f => f.path);
  });

  it('npm pack output includes .claude-plugin/plugin.json', () => {
    expect(packFiles.some(f => f.includes('.claude-plugin/plugin.json') || f.includes('.claude-plugin\\plugin.json'))).toBe(true);
  });

  it('npm pack output includes .mcp.json', () => {
    expect(packFiles.some(f => f === '.mcp.json' || f.endsWith('/.mcp.json') || f.endsWith('\\.mcp.json'))).toBe(true);
  });

  it('npm pack output includes skills/ files', () => {
    expect(packFiles.some(f => f.includes('skills/'))).toBe(true);
  });

  it('npm pack output includes README.md', () => {
    expect(packFiles.some(f => f === 'README.md' || f.endsWith('/README.md'))).toBe(true);
  });

  it('npm pack output does NOT include src/ files', () => {
    expect(packFiles.some(f => f.startsWith('src/'))).toBe(false);
  });

  it('npm pack output does NOT include supabase/ files', () => {
    expect(packFiles.some(f => f.startsWith('supabase/'))).toBe(false);
  });

  it('npm pack output does NOT include tests/ files', () => {
    expect(packFiles.some(f => f.startsWith('tests/'))).toBe(false);
  });

  it('npm pack output does NOT include scripts/ files', () => {
    expect(packFiles.some(f => f.startsWith('scripts/'))).toBe(false);
  });

  it('npm pack output does NOT include .planning/ files', () => {
    expect(packFiles.some(f => f.startsWith('.planning/'))).toBe(false);
  });

  it('npm pack output does NOT include .env files', () => {
    expect(packFiles.some(f => f === '.env' || f.endsWith('/.env'))).toBe(false);
  });
});
