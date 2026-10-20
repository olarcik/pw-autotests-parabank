---
name: playwright-skill
description: Drive a real browser through the Playwright MCP server to explore ParaBank pages, build page objects with verified locators, write specs from a described scenario, and debug failing tests. Use when the user asks to explore/inspect a page, "create a page object for X", "write a test for this flow", find or fix a locator, or investigate why a Playwright test fails in the UI.
---

# Playwright MCP workflow

Tools come from the `playwright` MCP server (`mcp__playwright__browser_*`). It opens a headed Chrome with a fresh in-memory profile each session; snapshots and screenshots go to `.playwright-mcp/` (git-ignored).

The browser is for **discovery and debugging only**. Every result ends up as code that follows `CLAUDE.md` and is verified with `npx playwright test` — never treat "it worked in the MCP browser" as done.

## Basics

- Read the page with `browser_snapshot` (accessibility tree — roles, names, refs). Use `browser_take_screenshot` only when layout/visuals matter.
- Act with `browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_press_key` using refs from the latest snapshot. Each action response shows the Playwright code it ran — reuse it as a starting point for locators.
- Base URL: `BASE_URL` from `.env` (default `https://parabank.parasoft.com/parabank`).
- Call `browser_close` when finished.

## Create or extend a page object

1. Navigate to the page and take a snapshot.
2. Pick locators in this order: `getByRole` (+ `name`, `exact: true`), `getByLabel`, `getByText`, `getByTestId`. CSS/XPath only if nothing else exists — say why.
3. **Check uniqueness.** ParaBank repeats links in header and footer (e.g. "About Us"). If a role+name appears more than once in the snapshot, scope it to its container (`page.locator('#headerPanel').getByRole(...)`) instead of using `.first()`.
4. Write `src/pages/client/<feature>Page.ts`: standalone class (no base class), `readonly page` and `readonly` locators set in the constructor, action methods (`login(user)`, `openAccount(type)`), no assertions.
5. Add it to `pagesMap` in `src/tests/baseTest.ts`.

## Write a spec from a scenario

1. Walk through the flow in the browser step by step, snapshotting after each step to confirm the expected result.
2. Turn it into `src/tests/client/<feature>.spec.ts`: import `test, expect, qase` from `../baseTest`, use page-object fixtures, one `test.step` per scenario step, web-first assertions (`toBeVisible`, `toHaveText`, `toHaveURL`), no `waitForTimeout`.
3. If the scenario has a Qase case, add `qase.id(<id>)` as the first line (see `qase-skill` — "automate case N" uses both).
4. Data: ParaBank is a shared public demo — register a fresh user with generated data (helpers in `src/common/utils/`) rather than relying on existing accounts. Credentials, if needed, come from `ROLES` in `src/common/data/setup.ts`; never hard-code them.
5. Run `npm run lint`, `npm run typecheck`, then `npx playwright test <spec> --project=chromium`. Fix until green.

## Debug a failing test

1. Read the failure (`test-results/**/error-context.md` has the error and page snapshot).
2. Reproduce the state in the MCP browser up to the failing step and snapshot it.
3. Compare the locator/assertion with what's actually on the page (duplicate matches, changed text, timing). Check `browser_console_messages` / `browser_network_requests` for app errors.
4. Fix the page object or test, rerun the spec. Report whether it was a test bug or an app bug.
