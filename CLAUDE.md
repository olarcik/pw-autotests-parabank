# CLAUDE.md

End-to-end UI/API test automation for **ParaBank** using Playwright + TypeScript. Tests run against a local ParaBank in Docker (image `parasoft/parabank`, pinned by digest in `docker-compose.yml`), not the public demo site.
The framework is built incrementally: folders exist up front (kept with `.gitkeep`), and code is added as tests are written.

## Commands

```bash
npm test                                   # playwright test: all tests, all browsers (needs a running app)
npx playwright test --project=chromium     # single browser
npx playwright test src/tests/client       # single folder
npx playwright test -g "login"             # by test title
npm run lint                               # ESLint (typescript-eslint + eslint-plugin-playwright + eslint-config-prettier)
npm run typecheck                          # tsc --noEmit
npm run format                             # prettier --write .
npm run format:check                       # prettier --check .
npm run report                             # open last HTML report
npm run docker:up                          # start ParaBank in Compose and wait until healthy
npm run docker:down                        # stop and remove containers (incl. the tests profile)
npm run docker:logs                        # follow ParaBank logs
npm run docker:test                        # build the test image, run the suite in Compose, clean up
npm run test:host-docker                   # docker:up + playwright test on the host
```

Before committing, run `npm run lint`, `npm run typecheck` and `npm run format:check`. The Husky pre-commit hook runs all three and blocks the commit on failure — never bypass it with `--no-verify`.

## Project structure

```
src/
├── common/
│   ├── api/            # shared API transport (base.ts), re-exported from index.ts
│   ├── data/
│   │   ├── setup.ts    # ENV, TENANT, BASE_URL, URLS — read from process.env
│   │   └── test.ts     # shared static test values
│   ├── interfaces/     # types shared by several domains (no barrel files)
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
- Tests navigate as a user: start on the Home page (`test.beforeEach` with `mainPage.open()`) and reach the target page through visible steps (e.g. `mainPage.openRegisterPage()`) inside the test. A direct `goto` to an inner page is allowed only when the test checks exactly that (e.g. a direct link).
- Link each test to its Qase case with `qase.id(<id>)` as the first line of the test body (`qase` is exported from `baseTest.ts`). The ID in `qase.id()` always equals the case ID in Qase. Don't use the `qase(id, 'title')` title wrapper — it fails the `playwright/valid-title` lint rule. Optional metadata: `qase.fields({ severity, priority, layer })`, `qase.suite()`, `qase.attach()`, `qase.ignore()`.

### Page objects

- One class per page/feature: `src/pages/<area>/<feature>Page.ts`, class name `<Feature>Page`.
- Standalone classes (no base class): take `page: Page` in the constructor and declare `page` and locators as `readonly` fields initialised there.
- Follow the structure template strictly — don't add folders, base classes, or helpers that aren't in it.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Avoid CSS/XPath unless there is no alternative.
- Page objects expose actions (`login(user)`, `openAccount(type)`). Assertions belong in tests; the only exception is a composite `expect…` method that checks the state of one page (e.g. `RegisterPage.expectFormValues(user)`). Single checks stay in tests.
- Register every new page object by adding it to `pagesMap` in `baseTest.ts` — fixtures and their types are generated from it.

### Data & configuration

- Environment values come from `.env` (loaded by `playwright.config.ts` via dotenv). Access them through `src/common/data/setup.ts`, never `process.env` directly in tests or pages.
- When adding a variable, update `.env.example`, `setup.ts`, the `playwright-tests` service `environment:` in `docker-compose.yml`, and the `env:` block of the `ui` job in `.github/workflows/playwright-tests.yml`.
- Never commit credentials or `.env`. The only CI secret is `QASE_TESTOPS_API_TOKEN` (GitHub Actions secrets).
- Generate unique data (usernames, emails) with helpers in `src/common/utils/`, not hard-coded values.
- Shared static values (page titles, validation messages, expected amounts, fixed inputs) live in `src/common/data/test.ts`, grouped and commented; specs keep no module-level constants.

### Environment variables (`.env.example`)

- `ENV`, `TENANT` — environment name and tenant (`setup.ts`; defaults `dev`, `parabank`).
- `BASE_URL` — app URL for tests on the host (default `http://localhost:8080/parabank`).
- `PARABANK_PORT` — host port of the ParaBank container (default `8080`; Compose only). Keep `BASE_URL` in sync.
- `QASE_MODE` (`off` | `testops` | `report`), `QASE_TESTOPS_PROJECT`, `QASE_TESTOPS_API_TOKEN`, `QASE_TESTOPS_RUN_TITLE` — Qase reporter only, read in `playwright.config.ts` or by the reporter, not in `setup.ts`.
- `CI` — set by the CI runner (retries, single worker, `forbidOnly`).

### Formatting

- VS Code fixes formatting on save (Prettier, settings in `.vscode/`; install the recommended `esbenp.prettier-vscode` extension).
- The pre-commit hook and the CI `checks` job only check (`npm run format:check`) and never rewrite files.
- If the check fails, run `npm run format` and commit the result.

### Code style

- Formatting is owned by Prettier (`.prettierrc`: single quotes, semicolons, trailing commas, width 100, 2 spaces, LF; exclusions in `.prettierignore`). Run `npm run format` instead of formatting by hand; ESLint style rules that conflict with it are disabled by `eslint-config-prettier`.
- TypeScript strict mode; no `any` unless justified.
- Domain types live in `src/common/domains/<domain>/interfaces.ts` and are imported directly from there (relative path). `src/common/interfaces/` is only for types shared by several domains. Don't create re-export (barrel) files.
- Keep files LF line endings (enforced by `.gitattributes` and Prettier).

## Docker

See [`docker-compose.yml`](docker-compose.yml), [`Dockerfile`](Dockerfile) and README sections [Running tests in Docker](README.md#running-tests-in-docker) and [CI](README.md#ci).

- `parabank` — the app, published on host port `${PARABANK_PORT:-8080}`; its healthcheck initializes the DB once, so `docker compose up --wait` returns a ready app.
- `playwright-tests` — the test runner built from `Dockerfile`, in Compose profile `tests` (started only by `docker:test` / `--profile tests`). Inside the Compose network it uses `BASE_URL=http://parabank:8080/parabank`; `BASE_URL` from `.env` is ignored. Reports are mounted to `playwright-report/` and `test-results/`.
- `PLAYWRIGHT_VERSION` in `Dockerfile` must equal `@playwright/test` in `package-lock.json`; bump both together (the image build fails on a mismatch).
- Updating the pinned ParaBank image: `docker pull parasoft/parabank:latest`, get the digest with `docker inspect --format "{{index .RepoDigests 0}}" parasoft/parabank:latest`, and replace the `image:` digest in `docker-compose.yml`.

## CI

GitHub Actions — `.github/workflows/playwright-tests.yml` runs on push/PR to `main` and manually, with two parallel jobs:

- `checks`: `npm ci` → lint → typecheck → format:check.
- `ui`: `npm run docker:test` (same as locally) → upload `playwright-report/` and `test-results/` as an artifact (always).

Qase mode in `ui`: `QASE_MODE=testops` only when repo variable `QASE_MODE` is `testops` **and** variable `QASE_TESTOPS_PROJECT` and secret `QASE_TESTOPS_API_TOKEN` are both set; otherwise `off`. Optional variables `ENV`, `TENANT`.

## Qase and Claude Code tooling

- Reporter `playwright-qase-reporter` is configured in `playwright.config.ts`, alongside `list` and `html`. `QASE_MODE=report` writes a local JSON report to `build/qase-report/`.
- MCP servers are defined in `.mcp.json`:
  - `qase` (`@qase/mcp-server`, reuses `QASE_TESTOPS_API_TOKEN` from `.env`) with the `qase-skill` skill (`.claude/skills/qase-skill/SKILL.md`) — manage cases, runs and defects.
  - `playwright` (`@playwright/mcp`, headed Chrome, output in `.playwright-mcp/`) with the `playwright-skill` skill (`.claude/skills/playwright-skill/SKILL.md`) — explore pages, build locators, debug. Finished work is always plain specs verified with `npx playwright test`.

## Known issues

- ParaBank sometimes (about 0.3–1.3% of successful registrations) falsely answers "This username already exists." and creates no customer. The cause is on the server side: it is not a race between tests (reproduces with one worker) and not a browser POST retry (Chromium net log shows a single POST). Reproduces in chromium and firefox, and also with the earlier direct-`goto` navigation.
- It is absorbed by `retries` in `playwright.config.ts` (1 locally, 2 on CI). Don't add hidden retries (loops, re-submits) inside registration tests.

## Git

- Default branch: `main`; remote: https://github.com/olarcik/pw-autotests-parabank
- Create feature branches for new work (`feature/<short-name>`), open a PR to `main`.
- Commit messages: imperative mood, short summary line (e.g. `Add login page object and auth fixture`).
