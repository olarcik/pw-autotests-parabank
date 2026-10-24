# CLAUDE.md

End-to-end UI/API test automation for **ParaBank** (https://parabank.parasoft.com/parabank) using Playwright + TypeScript.
The framework is built incrementally: folders exist up front (kept with `.gitkeep`), and code is added as tests are written.

## Commands

```bash
npm test                                   # all tests, all browsers
npx playwright test --project=chromium     # single browser
npx playwright test src/tests/client       # single folder
npx playwright test -g "login"             # by test title
npm run lint                               # ESLint (typescript-eslint + eslint-plugin-playwright)
npm run typecheck                          # tsc --noEmit
npm run report                             # open last HTML report
```

Before finishing any change, run `npm run lint` and `npm run typecheck`. The Husky pre-commit hook runs both and blocks the commit on failure — never bypass it with `--no-verify`.

## Project structure

```
src/
├── common/
│   ├── api/            # shared API transport (base.ts), re-exported from index.ts
│   ├── data/
│   │   ├── setup.ts    # ENV, TENANT, URLS, ROLES — read from process.env
│   │   └── test.ts     # shared static test values
│   ├── interfaces/     # shared TypeScript types
│   ├── utils/          # shared generators and helpers
│   ├── integrations/   # email/OTP and other external services
│   └── domains/<domain>/   # api.ts, data.ts, interfaces.ts, utils.ts per business domain
├── pages/
│   └── client/         # <feature>Page.ts
└── tests/
    ├── baseTest.ts     # extended `test` with page-object fixtures (generated from pagesMap)
    └── client/
files/uploads/          # input files for upload tests
files/downloads/        # download output (git-ignored)
storageStates/          # saved auth sessions, created at runtime (git-ignored)
```

## Conventions

### Tests

- Import `test` and `expect` from `src/tests/baseTest.ts`, **not** from `@playwright/test`.
- File names: `<feature>.spec.ts` (kebab-case), placed in the folder matching the app area.
- Use page-object fixtures (`async ({ mainPage }) => ...`) instead of `new XPage(page)` inside tests.
- Use web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout` or hard sleeps.
- Tests must be independent and runnable in parallel (`fullyParallel: true`). Create the data a test needs; don't rely on another test's state.
- Use `test.step()` for multi-step flows to keep reports readable (steps are also sent to Qase).
- Link each test to its Qase case with `qase.id(<id>)` as the first line of the test body (`qase` is exported from `baseTest.ts`). Don't use the `qase(id, 'title')` title wrapper — it fails the `playwright/valid-title` lint rule. Optional metadata: `qase.fields({ severity, priority, layer })`, `qase.suite()`, `qase.attach()`, `qase.ignore()`.

### Qase TestOps reporting

- Reporter `playwright-qase-reporter` is configured in `playwright.config.ts`, alongside `list` and `html`.
- Controlled by env: `QASE_MODE` (`off` by default; `testops` sends results, `report` writes a local JSON report to `build/qase-report/`), `QASE_TESTOPS_PROJECT`, `QASE_TESTOPS_API_TOKEN`. Any other `QASE_*` variable (e.g. `QASE_TESTOPS_RUN_TITLE`, `QASE_TESTOPS_PLAN_ID`) is read by the reporter directly.
- These are reporter-only, so they're not in `setup.ts`; keep `.env.example` and the CI `env:` block in sync.
- CI: set repo variables `QASE_MODE=testops` and `QASE_TESTOPS_PROJECT`, and secret `QASE_TESTOPS_API_TOKEN`.
- Claude Code: the `playwright` MCP server (`@playwright/mcp`, headed Chrome, output in `.playwright-mcp/`) with the `playwright-skill` skill is for exploring pages, building locators and debugging; finished work is always plain specs verified with `npx playwright test`.
- Claude Code: the `qase` MCP server (`.mcp.json`, reuses `QASE_TESTOPS_API_TOKEN` from `.env`) and the `qase-skill` skill (`.claude/skills/qase-skill/SKILL.md`) manage cases, runs and defects directly.

### Page objects

- One class per page/feature: `src/pages/<area>/<feature>Page.ts`, class name `<Feature>Page`.
- Standalone classes (no base class): take `page: Page` in the constructor and declare `page` and locators as `readonly` fields initialised there.
- Follow the structure template strictly — don't add folders, base classes, or helpers that aren't in it.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Avoid CSS/XPath unless there is no alternative.
- Page objects expose actions (`login(user)`, `openAccount(type)`) — assertions belong in tests.
- Register every new page object by adding it to `pagesMap` in `baseTest.ts` — fixtures and their types are generated from it.

### Data & configuration

- Environment values come from `.env` (loaded by `playwright.config.ts` via dotenv). Access them through `src/common/data/setup.ts`, never `process.env` directly in tests or pages.
- When adding a variable, update `.env.example`, `setup.ts`, the `playwright-tests` service `environment:` in `docker-compose.yml`, and the `env:` block of the `ui` job in `.github/workflows/playwright-tests.yml`.
- Never commit credentials or `.env`. Secrets in CI come from GitHub Actions secrets: `CLIENT_USERNAME`, `CLIENT_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `QASE_TESTOPS_API_TOKEN`.
- Generate unique data (usernames, emails) with helpers in `src/common/utils/`, not hard-coded values.

### Code style

- TypeScript strict mode; no `any` unless justified.
- Shared types go in `src/common/interfaces/`; domain-specific types in `src/common/domains/<domain>/interfaces.ts`.
- Keep files LF line endings (enforced by `.gitattributes`).

## CI

GitHub Actions — `.github/workflows/playwright-tests.yml` runs on push/PR to `main` and manually, with two parallel jobs:

- `checks`: `npm ci` → lint → typecheck.
- `ui`: `npm run docker:test` (same as locally: builds the `Dockerfile` image, starts ParaBank in Compose, runs the suite in the `playwright-tests` container) → upload `playwright-report/` and `test-results/` as an artifact (always).

The `Dockerfile` base image version must equal `@playwright/test` in `package-lock.json`; bump both together.

## Git

- Default branch: `main`; remote: https://github.com/olarcik/pw-autotests-parabank
- Create feature branches for new work (`feature/<short-name>`), open a PR to `main`.
- Commit messages: imperative mood, short summary line (e.g. `Add login page object and auth fixture`).
