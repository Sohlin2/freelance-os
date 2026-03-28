---
phase: 07-tech-debt-cleanup
plan: 01
subsystem: documentation-config
tags: [tech-debt, frontmatter, requirements-traceability, plugin-config, mcp-config]
dependency_graph:
  requires: [02-02, 02-03, 03-03, 03-05, 06-01]
  provides: [requirements-traceability, corrected-plugin-config, configurable-mcp-url]
  affects:
    - .planning/phases/02-mcp-server-core/02-02-SUMMARY.md
    - .planning/phases/02-mcp-server-core/02-03-SUMMARY.md
    - .planning/phases/03-full-tool-suite/03-03-SUMMARY.md
    - .planning/phases/03-full-tool-suite/03-05-SUMMARY.md
    - .planning/phases/06-critical-integration-fixes/06-01-SUMMARY.md
    - .mcp.json
    - .claude-plugin/plugin.json
tech_stack:
  added: []
  patterns:
    - requirements-completed YAML field in SUMMARY frontmatter for traceability
    - user_config.VAR_NAME pattern in .mcp.json for user-configurable server URL
    - Array glob format for plugin.json skills field
key_files:
  created: []
  modified:
    - .planning/phases/02-mcp-server-core/02-02-SUMMARY.md
    - .planning/phases/02-mcp-server-core/02-03-SUMMARY.md
    - .planning/phases/03-full-tool-suite/03-03-SUMMARY.md
    - .planning/phases/03-full-tool-suite/03-05-SUMMARY.md
    - .planning/phases/06-critical-integration-fixes/06-01-SUMMARY.md
    - .mcp.json
    - .claude-plugin/plugin.json
decisions:
  - "requirements-completed field placed at end of frontmatter (before closing ---) as an additive non-breaking change to existing SUMMARY format"
  - "FREELANCEOS_SERVER_URL added to both .mcp.json (as user_config reference) and plugin.json userConfig (for install-time prompt) to keep them in sync"
metrics:
  duration: 125s
  completed_date: "2026-03-28"
  tasks_completed: 2
  files_created: 0
  files_modified: 7
requirements-completed: []
---

# Phase 07 Plan 01: Tech Debt Cleanup Summary

**One-liner:** Added requirements-completed traceability to 5 SUMMARY files (phases 02/03/06) and fixed two plugin config issues — hardcoded MCP URL replaced with user_config variable, and skills string changed to array glob format.

## What Was Built

### Task 1: requirements-completed Frontmatter

Added `requirements-completed` YAML field to the frontmatter of 5 SUMMARY files that were missing it. These files represented completed work whose requirement IDs were only tracked in ROADMAP.md and REQUIREMENTS.md but not in the SUMMARY artifacts themselves.

| File | Requirements Added |
|------|--------------------|
| 02-02-SUMMARY.md | [CRM-01, CRM-03, CRM-04] |
| 02-03-SUMMARY.md | [CRM-02, CRM-04] |
| 03-03-SUMMARY.md | [TIME-01, TIME-02] |
| 03-05-SUMMARY.md | [FLLW-01, FLLW-03] |
| 06-01-SUMMARY.md | [INFRA-01, INFRA-03] |

The field was appended after the `metrics` block in each frontmatter section, consistent with the SUMMARY template format.

### Task 2: .mcp.json and plugin.json Config Fixes

**`.mcp.json` URL fix:**

Replaced the hardcoded `https://mcp.freelanceos.dev/mcp` URL with `${user_config.FREELANCEOS_SERVER_URL}`. This removes the reference to an undeployed server and makes the URL configurable at install time. The existing `Authorization: Bearer ${user_config.FREELANCEOS_API_KEY}` header pattern was already correct — this brings the URL field into alignment with the same pattern.

**`plugin.json` skills field fix:**

Changed `"skills": "./skills/"` (string) to `"skills": ["./skills/*/SKILL.md"]` (array glob). Per the Claude Code plugin spec, the skills field must be an array of glob patterns pointing to SKILL.md files, not a bare directory path string.

**`plugin.json` userConfig addition:**

Added `FREELANCEOS_SERVER_URL` entry to `userConfig` so the install-time prompt collects the server URL from the user, consistent with how `FREELANCEOS_API_KEY` is collected. The field is `sensitive: false` since it's a URL (not a secret).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are documentation/config corrections with no behavioral impact on code.

## Self-Check: PASSED

- 02-02-SUMMARY.md contains `requirements-completed: [CRM-01, CRM-03, CRM-04]`: CONFIRMED
- 02-03-SUMMARY.md contains `requirements-completed: [CRM-02, CRM-04]`: CONFIRMED
- 03-03-SUMMARY.md contains `requirements-completed: [TIME-01, TIME-02]`: CONFIRMED
- 03-05-SUMMARY.md contains `requirements-completed: [FLLW-01, FLLW-03]`: CONFIRMED
- 06-01-SUMMARY.md contains `requirements-completed: [INFRA-01, INFRA-03]`: CONFIRMED
- .mcp.json url = `${user_config.FREELANCEOS_SERVER_URL}`: CONFIRMED
- plugin.json skills = `["./skills/*/SKILL.md"]`: CONFIRMED
- plugin.json userConfig.FREELANCEOS_SERVER_URL exists: CONFIRMED
- Commit 744c1c9 (Task 1): FOUND
- Commit f3ebd24 (Task 2): FOUND
