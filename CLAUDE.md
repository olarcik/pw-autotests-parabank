# CLAUDE.md

End-to-end UI/API test automation for **ParaBank** using Playwright + TypeScript. By default tests run against a local ParaBank in Docker (image `parasoft/parabank`, pinned by digest in `docker-compose.yml`). The public demo is available with `ENV=demo`, but it is a shared third-party service: don’t run the full suite against it.
The framework is built incrementally: folders exist up front (kept with `.gitkeep`), and code is added as tests are written.

## Commands

```bash
npm test                                   # playwright test: all projects — 3 browsers + api (needs a running app)
npx playwright test --project=chromium     # single browser
npx playwright test --project=api          # API tests only (no browser)
npx playwright test src/tests/e2e          # single folder
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
│   │   ├── exchangeLog.ts     # Exchange type, masking of secrets, attachExchanges: attachment files of failed tests
│   │   └── endpoints.ts       # all request paths (REST paths and the register.htm URL)
│   ├── data/
│   │   ├── setup.ts    # loads .env and env/<ENV>.env; ENV, BASE_URL, URLS (app, api)
│   │   └── testData.ts # shared static test values
│   ├── interfaces/     # types shared by several domains (no barrel files)
│   ├── utils/          # shared generators and helpers
│   │   └── matchers.ts # schemaMatchers: custom expect matcher toMatchSchema
│   ├── integrations/
│   │   └── external-service/  # external services (placeholder, kept with .gitkeep)
│   └── domains/<domain>/   # only data about objects: interfaces.ts, data.ts, schemas.ts
├── services/           # Service Objects, one file per ParaBank resource: <resource>Service.ts
├── pages/              # <feature>Page.ts: mainPage (header, login, left panel), registerPage, accountsOverviewPage, updateProfilePage
├── fixtures/
│   ├── base.ts         # pagesMap, servicesMap: page-object and service fixtures generated from them; connects the fixtures below; exports `test`
│   ├── apiFixture.ts   # `api` fixture: RequestHandler on `request`, attaches the exchange log of failed tests
│   └── customerFixtures.ts # `registeredCustomer` fixture and its type RegisteredCustomer
└── tests/
    ├── baseTest.ts     # the only entry for specs: `test` from fixtures/base.ts, `expect` extended with schemaMatchers, `qase`
    ├── api/            # API tests, Playwright project `api` (no browser)
    └── e2e/            # E2E tests, projects chromium / firefox / webkit
env/                    # <ENV>.env per environment (local, demo): BASE_URL, no secrets, committed
files/uploads/          # input files for upload tests
files/downloads/        # download output (git-ignored)
storageStates/          # saved auth sessions, created at runtime (git-ignored)
LICENSE                 # MIT
```

## Conventions

### Tests

- Import `test` and `expect` from `src/tests/baseTest.ts` (`@src/tests/baseTest`), **not** from `@playwright/test`.
- Fixtures with logic live in `src/fixtures/`, one file per fixture group (`apiFixture.ts`, `customerFixtures.ts`), exported as functions with explicit parameter types; `src/fixtures/base.ts` connects them; `src/tests/baseTest.ts` gives specs `test`, `expect` and `qase`. `src/tests/` holds only the `api/` and `e2e/` specs and `baseTest.ts`. Fixture files never import `base.ts` or `baseTest.ts` (circular import); they use `expect` from `@playwright/test`.
- File names: `<feature>.spec.ts` (camelCase, e.g. `customerProfile.spec.ts`, like all other files), placed in `src/tests/e2e/` (E2E) or `src/tests/api/` (API).
- Use page-object and service fixtures (`async ({ mainPage, customerService }) => ...`) instead of `new XPage(page)` or `new XService(api)` inside tests.
- Use web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout` or hard sleeps.
- Tests must be independent and runnable in parallel (`fullyParallel: true`). Create the data a test needs; don't rely on another test's state.
- Parameterized tests (one scenario on several data sets): loop over the data and register a separate test per row with a unique title (as in Playwright test-parameterize), not a loop inside one test; hooks stay outside the loop. Tests of one Qase case get the same `qase.id()` and different `qase.parameters()`. Example: the required-field test in `src/tests/e2e/register.spec.ts`.
- No test data in specs: the rows of a parameterized test (their names and the values that differ between rows), expected texts, URLs and fixed inputs are never written inside a spec. Static values go to `src/common/data/testData.ts`; rows built with generators or from a prepared object go to the domain's `data.ts` (their type to `interfaces.ts`). Parameterized rows that need a type live in the domain's `data.ts` even when their values are static, plain texts and values in `testData.ts`. The spec only loops over the imported rows; the row name is the title suffix and the `qase.parameters()` value. A value generated for one test (`generateCustomer()` or `generateCustomer({ ... })` for that test's own scenario) may stay in the test body. Example: the required-field test in `src/tests/e2e/register.spec.ts`.
- Use `test.step()` for multi-step flows to keep reports readable (steps are also sent to Qase).
- Tests navigate as a user: start on the Home page (`test.beforeEach` with `mainPage.open()`) and reach the target page through visible steps (e.g. `mainPage.openRegisterPage()`) inside the test. A direct `goto` to an inner page is allowed only when the test checks exactly that (e.g. a direct link).
- Link each test to its Qase case with `qase.id(<id>)` as the first line of the test body (`qase` is exported from `baseTest.ts`). The ID in `qase.id()` always equals the case ID in Qase. Don't use the `qase(id, 'title')` title wrapper — it fails the `playwright/valid-title` lint rule. Optional metadata: `qase.fields({ severity, priority, layer })`, `qase.parameters()` (e.g. the data row of a parameterized test), `qase.suite()`, `qase.attach()`, `qase.ignore()`.

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
  - Services import `test` from `@playwright/test`, not from `baseTest.ts` or `src/fixtures/` (they import services, so that would be a circular import).
  - Register every new service by adding it to `servicesMap` in `src/fixtures/base.ts` — fixtures and their types are generated from it.
- Step names in tests describe meaning — a user or system action (`Register a new customer`, `Log in as the new customer`) — without the method or endpoint; HTTP details are shown by the handler's nested steps.
- Test data can be prepared through API fixtures: `registeredCustomer` (`src/fixtures/customerFixtures.ts`) registers a new customer through the form, logs in via REST to get the id and gives `{ data, response }`: `registeredCustomer.data` is the test data (`Customer`), `registeredCustomer.response.id` comes from the REST response (`CustomerResponse`). It asserts registration and login itself. It is lazy (only tests that ask for it register one) and has no retries inside. Registration tests don't use it — they check registration themselves. In E2E tests note that it uses the `request` context, not the browser: the page is not logged in.
- Check JSON bodies with `expect(body).toMatchSchema(<Zod schema>)` (from `baseTest.ts`), then compare values; amounts are JSON numbers (`515.5`, not `'515.50'`).

### Page objects

- One class per page/feature: `src/pages/<feature>Page.ts`, class name `<Feature>Page`.
- Standalone classes (no base class): take `page: Page` in the constructor and declare `page` and locators as `readonly` fields initialised there.
- Follow the structure template strictly — don't add folders, base classes, or helpers that aren't in it.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Avoid CSS/XPath unless there is no alternative.
- Page objects expose actions (`login(customer)`, `openAccount(type)`). Assertions belong in tests; the only exception is a composite `expect…` method that checks the state of one page (e.g. `RegisterPage.expectFormValues(customer)`). Single checks stay in tests.
- The left panel of a logged-in customer (welcome text, Account Services menu, Log Out) is on every page after login. It stays in `MainPage`; don't create a separate class or repeat it in other page objects.
- Register every new page object by adding it to `pagesMap` in `src/fixtures/base.ts` — fixtures and their types are generated from it.

### Data & configuration

- Environment values are loaded by `src/common/data/setup.ts` itself (dotenv, never overwriting a set value), so the precedence is: shell / CI / Compose > `.env` > `env/<ENV>.env`. `playwright.config.ts` imports `setup.ts` first. Access values through `setup.ts`, never `process.env` directly in tests or pages.
- `setup.ts` throws if `BASE_URL` is still unset; a missing `env/<ENV>.env` alone is not an error (the Docker image has no `env/`, Compose sets `BASE_URL`).
- When adding a variable: a per-environment value (URL, etc.) goes into every `env/<ENV>.env`; a personal or secret value goes into `.env.example`. Then update `setup.ts`, and if the tests in Docker need it, the `playwright-tests` service `environment:` in `docker-compose.yml` and the `env:` block of the `ui` job in `.github/workflows/playwright-tests.yml`.
- When adding an environment, add `env/<name>.env` with at least `BASE_URL`.
- Never commit credentials or `.env`. The only CI secret is `QASE_TESTOPS_API_TOKEN` (GitHub Actions secrets).
- Generate unique data (usernames, emails) with generators in the domain's `data.ts` (`generateCustomer` in `src/common/domains/customer/data.ts`), not hard-coded values.
- Shared static values (page titles, validation messages, expected amounts, fixed inputs) live in `src/common/data/testData.ts`, grouped and commented; specs keep no module-level constants.

### Environment variables

The ones in `.env.example` are `ENV` and the three `QASE_*` below; the others are optional and set only when needed.

- `ENV` — environment name, selects `env/<ENV>.env`: `local` (default, Docker app) or `demo` (public site). Fixed to `local` in `docker-compose.yml`.
- `BASE_URL` — app URL; comes from `env/<ENV>.env`. Not in `.env.example`: set it in `.env` or the shell only to override (e.g. another port). In Compose it is `http://parabank:8080/parabank`.
- `PARABANK_PORT` — optional, not in `.env.example`: host port of the ParaBank container (default `8080`; Compose only). If you change it, set `BASE_URL` in `.env` to match.
- `QASE_MODE` (`off` | `testops` | `report`), `QASE_TESTOPS_PROJECT`, `QASE_TESTOPS_API_TOKEN` — Qase reporter only, read in `playwright.config.ts` or by the reporter, not in `setup.ts`.
- `QASE_TESTOPS_RUN_TITLE` — optional, not in `.env.example`: run name in Qase (a default name is used when empty); in CI it is set by the workflow.
- `CI` — set by the CI runner (retries, single worker, `forbidOnly`).

### Formatting

- VS Code fixes formatting on save (Prettier, settings in `.vscode/`; install the recommended `esbenp.prettier-vscode` extension).
- The pre-commit hook and the CI `checks` job only check (`npm run format:check`) and never rewrite files.
- If the check fails, run `npm run format` and commit the result.

### Code style

- Formatting is owned by Prettier (`.prettierrc`: single quotes, semicolons, trailing commas, width 100, 2 spaces, LF; exclusions in `.prettierignore`). Run `npm run format` instead of formatting by hand; ESLint style rules that conflict with it are disabled by `eslint-config-prettier`.
- TypeScript strict mode; no `any` unless justified.
- ESLint rule `@typescript-eslint/no-floating-promises` is on: every async call (service and page methods, `expect`, `test.step`) is awaited.
- Domain types live in `src/common/domains/<domain>/interfaces.ts` and are imported directly from there. Zod schemas of API responses live in `schemas.ts` next to it; their types are declared in `interfaces.ts` as `z.infer<typeof …Schema>`, not written by hand. `src/common/interfaces/` is only for types shared by several domains. Don't create re-export (barrel) files; the only allowed entry point is `src/tests/baseTest.ts`, because it adds the custom matchers to `expect` and exports `qase`.
- Imports from another folder use the `@src/*` alias from `tsconfig.json` (`@src/common/data/setup`, `@src/pages/mainPage`); imports of a file in the same folder stay relative (`./schemas`). No `../` paths.
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
- `ui` (named “Tests”): `npm run docker:test` (same as locally; runs all projects, the `api` project included) → upload `playwright-report/` and `test-results/` as an artifact (always).

Qase mode in `ui`: `QASE_MODE=testops` only when repo variable `QASE_MODE` is `testops` **and** variable `QASE_TESTOPS_PROJECT` and secret `QASE_TESTOPS_API_TOKEN` are both set; otherwise `off`.

## Qase and Claude Code tooling

- Reporter `playwright-qase-reporter` is configured in `playwright.config.ts`, alongside `list` and `html`. `QASE_MODE=report` writes a local JSON report to `build/qase-report/`.
- The reporter adds the Playwright project name as the result parameter `Project` (`chromium`, `firefox`, `webkit` or `api`).
- Qase project `PB` suites: `E2E` (browser tests, `src/tests/e2e/`) and `API` (`src/tests/api/`), each with feature suites inside (e.g. `E2E / Registration`, `API / Registration`). The case field **Layer** matches: `e2e` or `api`, also set in `qase.fields({ layer })`. Suite per feature and layer, the same name on both layers, named after the app area (not how or where it runs), up to 4 words, up to 3 levels; each suite has a one-line description.
- MCP servers are defined in `.mcp.json`:
  - `qase` (`@qase/mcp-server`, reuses `QASE_TESTOPS_API_TOKEN` from `.env`) with the `qase-skill` skill (`.claude/skills/qase-skill/SKILL.md`) — manage cases, runs and defects.
  - `playwright` (`@playwright/mcp`, headed Chrome, output in `.playwright-mcp/`) with the `playwright-skill` skill (`.claude/skills/playwright-skill/SKILL.md`) — explore pages, build locators, debug. Finished work is always plain specs verified with `npx playwright test`.

## Known issues

- ParaBank sometimes (about 0.3–1.3% of successful registrations) falsely answers "This username already exists." and creates no customer. The cause is on the server side: it is not only a race between tests (it also reproduces with one worker), but it seems more frequent when registrations run in parallel; it is not a browser POST retry (Chromium net log shows a single POST). Reproduces in chromium and firefox, and also with the earlier direct-`goto` navigation.
- In the API test the same bug sometimes shows up one step later: the form answers "Customer Created", but the server logs `Username … already exists in database` for that user and `GET /login/...` returns `400 Invalid username and/or password`.
- It is absorbed by `retries` in `playwright.config.ts` (1 locally, 2 on CI). Don't add hidden retries (loops, re-submits) inside registration tests.
- Parallel logins through the login form are sometimes answered wrongly by the ParaBank server (seen in the E2E login specs). Symptoms: a valid login is rejected (the page `ParaBank | Error` with "The username and password could not be verified."), or, seen once, a wrong password is accepted and the Accounts Overview opens (the server log of that case was not checked). In the cases checked in the server log, two logins arrived within a few milliseconds and the valid one was rejected: once after the customer had been found, once with both requests getting `cutomer=null` from `AccessModeController`. The found customer seems to be kept in a field shared by all requests. It has been seen only when another login arrived at the same moment; it was not seen in REST logins (their `400` so far was always the registration issue above). Retries absorb it.
- How to treat these server-side flakes (this one and the registration ones): a test that fails once with one of these symptoms and passes on retry is a known ParaBank issue, not a test defect. Don't change tests or add retries or loops, don't set `workers: 1`, don't open defects or raise alerts; mention it in a report in one line as "known server flake". Investigate only when a test fails on every attempt or the symptom is different.

## Git

- Default branch: `main`; remote: https://github.com/olarcik/pw-autotests-parabank
- Create a branch for new work with a prefix: `feature/`, `refactor/` or `chore/` (e.g. `feature/<short-name>`), open a PR to `main`.
- Commit messages: imperative mood, short summary line (e.g. `Add login page object and auth fixture`).
