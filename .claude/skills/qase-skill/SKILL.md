---
name: qase-skill
description: Work with Qase TestOps test cases, suites, runs and defects through the Qase MCP server, and keep them linked to Playwright specs via qase.id(). Use when the user mentions Qase, a test case ID, "case 42", automating a case, creating/updating cases from specs, checking run results or failed tests in Qase, or filing a defect.
---

# Qase workflow

Tools come from the `qase` MCP server (`mcp__qase__*`). If they're missing, check `QASE_TESTOPS_API_TOKEN` is set in `.env` and restart Claude Code (see "Setup" below) — don't fall back to raw HTTP calls.

## Project code

Every tool needs `code` (the Qase project code). Read it from `QASE_TESTOPS_PROJECT` in `.env` with `grep '^QASE_TESTOPS_PROJECT=' .env` — read only that line, never print the rest of `.env`. If it's empty, ask the user once.

On first use in a session call `qase_project_context` (`code`) to learn suites, custom fields, environments and users before creating anything.

## Rules

- **Read freely, write carefully.** Lookups (`qase_get`, `qql_search`, `qase_project_context`) need no confirmation. Before any create/update, show what will be written (title, suite, steps) and get a yes. Before any delete, bulk create, or run completion, always confirm — these change shared team data.
- Unsure of a tool's parameters? Call `qase_tool_help` instead of guessing. For QQL syntax call `qql_help` (`topic: "examples"`).
- Never put the API token in code, commits, or chat.

## Automate an existing case ("automate case 42")

1. `qase_get` with `entity: "case"`, `code`, `id: 42` — read title, preconditions, steps, expected results, suite.
2. Write the spec following `CLAUDE.md` conventions; the folder depends on the case field **Layer**: `e2e` → `src/tests/e2e/<feature>.spec.ts` with page-object fixtures; `api` → `src/tests/api/<feature>.spec.ts` with service fixtures (`customerService`, etc.) and `layer: 'api'` in `qase.fields`.
3. First line of the test body: `qase.id(42);`. Map each Qase step to a `test.step('<step action>', ...)` and assert its expected result inside it.
4. Run lint + typecheck, then the spec on chromium.
5. Offer to set the case's `automation` to automated with `qase_case_upsert` (`id: 42`) — confirm first.

## Create cases for specs without IDs

1. Find tests with no `qase.id(` call under `src/tests/`.
2. For each scenario, propose one case (not one per row of a parameterized test): title = test title without the `: <row>` suffix, steps = its `test.step` titles with expected results, `automation` = automated. Use cases 8, 13, 14 and 21 as the model for format: API steps carry the request (method, path, inputs) in the step data; the description of a parameterized case starts with "For each step: …" and it has one step per row.
3. Suite: `API / <Feature>` or `E2E / <Feature>`, named by the suite rule in `CLAUDE.md` (ask if none fits); a new suite gets a one-line description.
4. After confirmation create with `qase_case_upsert` (one) or `qase_case_bulk_create` (many), then insert `qase.id(<new id>);` as the first line of each test; the rows of a parameterized test share the id and send their row with `qase.parameters({ <Name>: <row name> })`.

## Audit links

Collect every `qase.id(...)` in `src/tests/`, check they exist with `qql_search` (or `qase_get` per ID), and report: missing cases, duplicate IDs across tests (the same `qase.id` on rows of one parameterized test with different `qase.parameters` is not a duplicate), cases marked automated that no spec references.

## Results and defects

- Results are uploaded by the Playwright reporter (`QASE_MODE=testops`), not by this skill — don't record results manually with `qase_result_record` / `qase_ci_report` unless the user asks.
- "What failed in the last run?" → `qql_search` for the latest runs/results, summarise failures with case IDs and the matching spec files.
- Filing a bug from a failure → `qase_triage_defect` with title, actual result (error + failing step) and severity; confirm first.

## Setup (for the user)

- `.mcp.json` runs `@qase/mcp-server` (devDependency) with `node --env-file-if-exists=.env`, reusing the reporter's `QASE_TESTOPS_API_TOKEN` from `.env` as `QASE_API_TOKEN`. EU/enterprise: add `QASE_API_DOMAIN=api-eu.qase.io` to `.env`.
- Token: https://app.qase.io/user/api/token. After changing `.env`, restart Claude Code so the server reloads it.
