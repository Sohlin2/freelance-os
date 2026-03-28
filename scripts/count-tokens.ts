import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

/**
 * Extract the text content of each registerTool config block (the second argument object)
 * from a .ts source file. This captures tool name, description, and parameter describe strings.
 */
function extractRegisterToolBlocks(source: string): string[] {
  const blocks: string[] = [];
  // Find each occurrence of server.registerTool(
  const callPattern = /server\.registerTool\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = callPattern.exec(source)) !== null) {
    // Starting after the opening paren, find the tool name (first arg) and config object (second arg)
    const startIdx = match.index + match[0].length;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let i = startIdx;
    let argCount = 0; // 0 = in first arg (tool name), 1 = in second arg (config)
    let configStart = -1;
    let configEnd = -1;

    while (i < source.length) {
      const ch = source[i];

      if (inString) {
        if (ch === '\\') {
          i += 2; // skip escaped char
          continue;
        }
        if (ch === stringChar && stringChar !== '`') {
          inString = false;
        } else if (ch === '`' && stringChar === '`') {
          inString = false;
        }
        i++;
        continue;
      }

      if (ch === "'" || ch === '"' || ch === '`') {
        inString = true;
        stringChar = ch;
        i++;
        continue;
      }

      if (ch === '{' || ch === '(' || ch === '[') {
        if (argCount === 1 && configStart === -1 && ch === '{') {
          configStart = i;
        }
        depth++;
        i++;
        continue;
      }

      if (ch === '}' || ch === ')' || ch === ']') {
        depth--;
        if (argCount === 1 && ch === '}' && depth === 0 && configStart !== -1) {
          configEnd = i;
          break;
        }
        if (depth < 0) break; // past the registerTool call closing paren
        i++;
        continue;
      }

      if (ch === ',' && depth === 0) {
        argCount++;
        i++;
        continue;
      }

      i++;
    }

    if (configStart !== -1 && configEnd !== -1) {
      blocks.push(source.slice(configStart, configEnd + 1));
    }
  }

  return blocks;
}

/**
 * countManifestTokens() — counts total tokens from:
 * - All tool description strings and parameter describes from src/tools/*.ts
 * - All SKILL.md body content from .claude/skills/*\/SKILL.md
 *
 * Token estimate: Math.ceil(totalChars / 4)
 */
export async function countManifestTokens(): Promise<number> {
  const toolsDir = join(projectRoot, 'src', 'tools');
  const skillsDir = join(projectRoot, '.claude', 'skills');

  // Count tool description/parameter content
  let toolChars = 0;
  if (existsSync(toolsDir)) {
    const tsFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.ts'));
    for (const file of tsFiles) {
      const source = readFileSync(join(toolsDir, file), 'utf-8');
      const blocks = extractRegisterToolBlocks(source);
      for (const block of blocks) {
        toolChars += block.length;
      }
    }
  }

  // Count skill body content
  let skillChars = 0;
  if (existsSync(skillsDir)) {
    const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const skillName of skillDirs) {
      const skillFile = join(skillsDir, skillName, 'SKILL.md');
      if (existsSync(skillFile)) {
        const content = readFileSync(skillFile, 'utf-8');
        // Strip YAML frontmatter (between first --- and second ---)
        const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
        const body = frontmatterMatch ? frontmatterMatch[1] : content;
        skillChars += body.length;
      }
    }
  }

  const toolTokens = Math.ceil(toolChars / 4);
  const skillTokens = Math.ceil(skillChars / 4);
  const total = toolTokens + skillTokens;

  console.log(`Tool descriptions: ~${toolTokens} tokens`);
  console.log(`Skill bodies: ~${skillTokens} tokens`);
  console.log(`Total: ~${total} tokens (limit: 15,000)`);

  return total;
}

/**
 * extractRegisteredToolNames(toolsDir) — reads all .ts files in the given directory,
 * extracts tool names from server.registerTool( calls. Returns a Set of all registered tool names.
 */
export function extractRegisteredToolNames(toolsDir: string): Set<string> {
  const names = new Set<string>();

  if (!existsSync(toolsDir)) {
    return names;
  }

  const tsFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.ts'));

  for (const file of tsFiles) {
    const source = readFileSync(join(toolsDir, file), 'utf-8');
    // Match tool names: the first string argument to server.registerTool(
    // Pattern: server.registerTool(\n?  'tool_name',
    const pattern = /server\.registerTool\s*\(\s*\n?\s*'([a-z][a-z0-9_]*)'\s*,/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      names.add(match[1]);
    }
  }

  return names;
}

/**
 * validateSkillToolRefs(skillsDir, registeredTools) — scans all SKILL.md files for
 * backtick-quoted snake_case identifiers that look like tool names, and checks each
 * against the registeredTools set.
 */
export function validateSkillToolRefs(
  skillsDir: string,
  registeredTools: Set<string>
): { valid: boolean; invalidRefs: Array<{ skill: string; ref: string }> } {
  const invalidRefs: Array<{ skill: string; ref: string }> = [];

  if (!existsSync(skillsDir)) {
    return { valid: true, invalidRefs: [] };
  }

  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // Tool name prefixes that indicate a backtick-quoted identifier is a tool reference
  const toolPrefixes = [
    'create_',
    'get_',
    'list_',
    'update_',
    'archive_',
    'accept_',
    'log_',
    'check_',
    'mark_',
    'aggregate_',
  ];

  const backtickPattern = /`([a-z][a-z0-9_]+)`/g;

  for (const skillName of skillDirs) {
    const skillFile = join(skillsDir, skillName, 'SKILL.md');
    if (!existsSync(skillFile)) continue;

    const content = readFileSync(skillFile, 'utf-8');
    let match: RegExpExecArray | null;

    while ((match = backtickPattern.exec(content)) !== null) {
      const identifier = match[1];
      // Only check identifiers that look like tool names (have underscore + match a known prefix)
      const looksLikeTool =
        identifier.includes('_') &&
        toolPrefixes.some((prefix) => identifier.startsWith(prefix));

      if (looksLikeTool && !registeredTools.has(identifier)) {
        invalidRefs.push({ skill: skillName, ref: identifier });
      }
    }
  }

  return {
    valid: invalidRefs.length === 0,
    invalidRefs,
  };
}
