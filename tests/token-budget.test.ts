import { describe, it, expect } from 'vitest';
import { countManifestTokens, extractRegisteredToolNames, validateSkillToolRefs } from '../scripts/count-tokens.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

describe('Token budget (SKLL-03)', () => {
  it('total tool manifest + skill files must be under 15,000 tokens', async () => {
    const tokens = await countManifestTokens();
    console.log(`Current manifest size: ${tokens} tokens`);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(15_000);
  });

  it('skill files must only reference registered tool names', () => {
    const toolsDir = resolve(projectRoot, 'src', 'tools');
    const skillsDir = resolve(projectRoot, '.claude', 'skills');
    const registeredTools = extractRegisteredToolNames(toolsDir);

    // Verify we found all 37 tools
    expect(registeredTools.size).toBe(37);

    const result = validateSkillToolRefs(skillsDir, registeredTools);
    if (!result.valid) {
      console.log('Invalid tool references:', result.invalidRefs);
    }
    expect(result.valid).toBe(true);
  });
});
