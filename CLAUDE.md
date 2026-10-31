# CLAUDE.md

End-to-end UI/API test automation for **ParaBank** using Playwright + TypeScript. Tests run against a local ParaBank in Docker (image `parasoft/parabank`, pinned by digest in `docker-compose.yml`), not the public demo site.
The framework is built incrementally: folders exist up front (kept with `.gitkeep`), and code is added as tests are written.

## Commands

```bash
npm test                                   # playwright test: all projects — 3 browsers + api (needs a running app)
npx playwright test --project=chromium     # single browser
npx playwright test --project=api          # API tests only (no browser)
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
│   ├── api/
│   │   ├── requestHandler.ts  # RequestHandler: new builder per request, report steps, exchange log
│   │   ├── exchangeLog.ts     # Exchange type, masking of secrets, attachment files of failed tests
│   │   └── endpoints.ts       # all request paths (REST paths and the register.htm URL)
│   ├── data/
│   │   ├── setup.ts    # ENV, TENANT, BASE_URL, URLS (client, admin, api) — read from process.env
│   │   └── test.ts     # shared static test values
│   ├── interfaces/     # types shared by several domains (no barrel files)
│   ├── utils/          # shared generators and helpers
│   ├── integrations/   # email/OTP and other external services
│   └── domains/<domain>/   # only data about objects: interfaces.ts, data.ts, schemas.ts
├── services/           # Service Objects, one file per ParaBank resource: <resource>Service.ts
├── pages/
│   └── client/         # <feature>Page.ts
└── tests/
    ├── baseTest.ts     # extended `test`: page-object and service fixtures (generated from pagesMap and servicesMap), `api` and `registeredCustomer` fixtures; `expect` with toMatchSchema
    ├── api/            # API tests, Playwright project `api` (no browser)
    └── client/         # UI tests, projects chromium / firefox / webkit
files/uploads/          # input files for upload tests
files/downloads/        # download output (git-ignored)
storageStates/          # saved auth sessions, created at runtime (git-ignored)
```

## Conventions

### Tests

- Import `test` and `expect` from `src/tests/baseTest.ts`, **not** from `@playwright/test`.
- File names: `<feature>.spec.ts` (kebab-case), placed in the folder matching the app area.
- Use page-object and service fixtures (`async ({ mainPage, customerService }) => ...`) instead of `new XPage(page)` or `new XService(api)` inside tests.
- Use web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout` or hard sleeps.
- Tests must be independent and runnable in parallel (`fullyParallel: true`). Create the data a test needs; don't rely on another test's state.
- Use `test.step()` for multi-step flows to keep reports readable (steps are also sent to Qase).
- Tests navigate as a user: start on the Home page (`test.beforeEach` with `mainPage.open()`) and reach the target page through visible steps (e.g. `mainPage.openRegisterPage()`) inside the test. A direct `goto` to an inner page is allowed only when the test checks exactly that (e.g. a direct link).
- Link each test to its Qase case with `qase.id(<id>)` as the first line of the test body (`qase` is exported from `baseTest.ts`). The ID in `qase.id()` always equals the case ID in Qase. Don't use the `qase(id, 'title')` title wrapper — it fails the `playwright/valid-title` lint rule. Optional metadata: `qase.fields({ severity, priority, layer })`, `qase.suite()`, `qase.attach()`, `qase.ignore()`.

### API tests

- Reference: [`docs/parabank-api.md`](docs/parabank-api.md) (endpoints, real behaviour, methods tests must never call) and the spec copy `docs/parabank-openapi.yaml`.
- Specs live in `src/tests/api/` and run only in the Playwright project `api` (browser projects ignore `api/**`).
- Tests send requests through service fixtures (`customerService`, `accountService`), built on the `api` fixture (`RequestHandler` from `src/common/api/requestHandler.ts`). It is built on the built-in `request` fixture: cookies are kept between requests of one test and never shared between tests.
  - The handler holds no request state. Every `api.path(...)` / `api.url(...)` call returns a new builder (`.params()`, `.headers()`, `.form()`, `.body()`, then `.get()` / `.post()` — ParaBank has only GET and POST), so nothing leaks between requests or tests and nothing needs resetting.
  - `path()` is REST: relative to `URLS.api`, sends `Accept: application/json` (without it ParaBank answers XML). `url()` takes a full address and sends only the headers set on it — used for the `register.htm` form. Paths come from `endpoints` in `src/common/api/endpoints.ts`.
  - Terminal methods return the raw `APIResponse`: no status checks, no parsing, no retries. Everything is asserted in the test.
  - Each request is a technical report step `METHOD /path` (no query; pathname for `url()`). The handler also keeps a log of exchanges for diagnostics only; it never affects how requests are built.
  - Request and response files are attached only when the test (attempt) fails: `<NN> <METHOD> <path> request.json` and `<NN> <METHOD> <path> response.<json|html|txt>`, where `NN` is the exchange's position in the log from `01`, so repeated requests don't overwrite each other (the Qase reporter saves attachments by name). Built in `src/common/api/exchangeLog.ts`.
  - Secrets are always masked as `***` in step titles and file contents: the password in the login path and every field whose name contains `password`.
  - File names are made safe from the path: `***` → `masked`, `\ / : * ? " < > |` → `_`, repeated `_` collapsed, leading `_` dropped. `GET /login/qa_x/***` → `01 GET login_qa_x_masked request.json`. Step titles and file contents keep `/` and `***`.
- Registration has no REST method: it is the `register.htm` form, `GET` before `POST` in the same session.
- Services live in `src/services/<resource>Service.ts`, class name `<Resource>Service`, one per ParaBank resource: a standalone class (no base class) that takes `api: RequestHandler` in the constructor.
  - One method is one HTTP request and returns the raw `APIResponse`. No checks (`expect`), parsing or retries inside services; tests and fixtures assert. Single methods are not wrapped in `test.step`: `RequestHandler` already makes the request steps.
  - The only composite method is `CustomerService.registerCustomer(customer)`: `GET` and `POST` of the form inside `test.step('Register a new customer')`, returns the `POST` response, no checks. Tests that check registration itself call `openRegisterForm()` and `submitRegisterForm(customer)` separately.
  - Services import `test` from `@playwright/test`, not from `baseTest.ts` (it imports them, so that would be a circular import).
  - Register every new service by adding it to `servicesMap` in `baseTest.ts` — fixtures and their types are generated from it.
- Step names in tests describe meaning — a user or system action (`Register a new customer`, `Log in as the new customer`) — without the method or endpoint; HTTP details are shown by the handler's nested steps.
- Test data can be prepared through API fixtures: `registeredCustomer` registers a new customer through the form, logs in via REST to get the id and gives `{ data, response }`: `registeredCustomer.data` is the test data (`Customer`), `registeredCustomer.response.id` comes from the REST response (`CustomerResponse`). It asserts registration and login itself. It is lazy (only tests that ask for it register one) and has no retries inside. Registration tests don't use it — they check registration themselves. In UI tests note that it uses the `request` context, not the browser: the page is not logged in.
- Check JSON bodies with `expect(body).toMatchSchema(<Zod schema>)` (from `baseTest.ts`), then compare values; amounts are JSON numbers (`515.5`, not `'515.50'`).

### Page objects

- One class per page/feature: `src/pages/<area>/<feature>Page.ts`, class name `<Feature>Page`.
- Standalone classes (no base class): take `page: Page` in the constructor and declare `page` and locators as `readonly` fields initialised there.
- Follow the structure template strictly — don't add folders, base classes, or helpers that aren't in it.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Avoid CSS/XPath unless there is no alternative.
- Page objects expose actions (`login(customer)`, `openAccount(type)`). Assertions belong in tests; the only exception is a composite `expect…` method that checks the state of one page (e.g. `RegisterPage.expectFormValues(customer)`). Single checks stay in tests.
- Register every new page object by adding it to `pagesMap` in `baseTest.ts` — fixtures and their types are generated from it.

### Data & configuration

- Environment values come from `.env` (loaded by `playwright.config.ts` via dotenv). Access them through `src/common/data/setup.ts`, never `process.env` directly in tests or pages.
- When adding a variable, update `.env.example`, `setup.ts`, the `playwright-tests` service `environment:` in `docker-compose.yml`, and the `env:` block of the `ui` job in `.github/workflows/playwright-tests.yml`.
- Never commit credentials or `.env`. The only CI secret is `QASE_TESTOPS_API_TOKEN` (GitHub Actions secrets).
- Generate unique data (usernames, emails) with generators in the domain's `data.ts` (`generateCustomer` in `src/common/domains/customer/data.ts`), not hard-coded values.
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
- Domain types live in `src/common/domains/<domain>/interfaces.ts` and are imported directly from there (relative path). Zod schemas of API responses live in `schemas.ts` next to it; their types are declared in `interfaces.ts` as `z.infer<typeof …Schema>`, not written by hand. `src/common/interfaces/` is only for types shared by several domains. Don't create re-export (barrel) files.
- Naming: REST response bodies are `<Name>Response`, their schemas `<Name>ResponseSchema`. The type `Customer` in the customer domain is the test data of a customer (with credentials), not a REST response.
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
- `ui`: `npm run docker:test` (same as locally; runs all projects, the `api` project included) → upload `playwright-report/` and `test-results/` as an artifact (always).

Qase mode in `ui`: `QASE_MODE=testops` only when repo variable `QASE_MODE` is `testops` **and** variable `QASE_TESTOPS_PROJECT` and secret `QASE_TESTOPS_API_TOKEN` are both set; otherwise `off`. Optional variables `ENV`, `TENANT`.

## Qase and Claude Code tooling

- Reporter `playwright-qase-reporter` is configured in `playwright.config.ts`, alongside `list` and `html`. `QASE_MODE=report` writes a local JSON report to `build/qase-report/`.
- The reporter adds the Playwright project name as the result parameter `Project` (`chromium`, `firefox`, `webkit` or `api`).
- Qase project `PB` suites: `E2E` (UI tests, `src/tests/client/`) and `API` (`src/tests/api/`), each with feature suites inside (e.g. `E2E / Registration`, `API / Registration`). The case field **Layer** matches: `e2e` or `api`, also set in `qase.fields({ layer })`.
- MCP servers are defined in `.mcp.json`:
  - `qase` (`@qase/mcp-server`, reuses `QASE_TESTOPS_API_TOKEN` from `.env`) with the `qase-skill` skill (`.claude/skills/qase-skill/SKILL.md`) — manage cases, runs and defects.
  - `playwright` (`@playwright/mcp`, headed Chrome, output in `.playwright-mcp/`) with the `playwright-skill` skill (`.claude/skills/playwright-skill/SKILL.md`) — explore pages, build locators, debug. Finished work is always plain specs verified with `npx playwright test`.

## Known issues

- ParaBank sometimes (about 0.3–1.3% of successful registrations) falsely answers "This username already exists." and creates no customer. The cause is on the server side: it is not a race between tests (reproduces with one worker) and not a browser POST retry (Chromium net log shows a single POST). Reproduces in chromium and firefox, and also with the earlier direct-`goto` navigation.
- In the API test the same bug sometimes shows up one step later: the form answers "Customer Created", but the server logs `Username … already exists in database` for that user and `GET /login/...` returns `400 Invalid username and/or password`.
- It is absorbed by `retries` in `playwright.config.ts` (1 locally, 2 on CI). Don't add hidden retries (loops, re-submits) inside registration tests.

## Git

- Default branch: `main`; remote: https://github.com/olarcik/pw-autotests-parabank
- Create feature branches for new work (`feature/<short-name>`), open a PR to `main`.
- Commit messages: imperative mood, short summary line (e.g. `Add login page object and auth fixture`).
