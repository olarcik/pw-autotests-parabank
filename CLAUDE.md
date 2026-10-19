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
│   ├── helperBase.ts   # base class for all page objects
│   ├── admin/          # <feature>Page.ts
│   ├── client/         # <feature>Page.ts
│   └── onboarding/     # <feature>Page.ts
└── tests/
    ├── baseTest.ts     # extended `test` with page-object and auth fixtures
    ├── admin/{bank-menu-items,compliance-menu-items,top-bottom-menu-items}/
    ├── client/
    ├── cross-app/      # flows spanning several apps
    └── onboarding/
files/uploads/          # input files for upload tests
files/downloads/        # download output (git-ignored)
storageStates/          # saved auth sessions, created at runtime (git-ignored)
```

## Conventions

### Tests
- Import `test` and `expect` from `src/tests/baseTest.ts`, **not** from `@playwright/test`.
- File names: `<feature>.spec.ts` (kebab-case), placed in the folder matching the app area.
- Use page-object fixtures (`async ({ mainPage, loginPage }) => ...`) instead of `new XPage(page)` inside tests.
- Use web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout` or hard sleeps.
- Tests must be independent and runnable in parallel (`fullyParallel: true`). Create the data a test needs; don't rely on another test's state.
- Use `test.step()` for multi-step flows to keep reports readable.

### Page objects
- One class per page/feature: `src/pages/<area>/<feature>Page.ts`, class name `<Feature>Page`.
- Extend `HelperBase`; declare locators as `readonly` fields initialised in the constructor.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. Avoid CSS/XPath unless there is no alternative.
- Page objects expose actions (`login(user)`, `openAccount(type)`) — assertions belong in tests.
- Register every new page object as a fixture in `baseTest.ts`.

### Data & configuration
- Environment values come from `.env` (loaded by `playwright.config.ts` via dotenv). Access them through `src/common/data/setup.ts`, never `process.env` directly in tests or pages.
- When adding a variable, update `.env.example`, `setup.ts`, and the `env:` block in `.github/workflows/playwright.yml`.
- Never commit credentials or `.env`. Secrets in CI come from GitHub Actions secrets: `CLIENT_USERNAME`, `CLIENT_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
- Generate unique data (usernames, emails) with helpers in `src/common/utils/`, not hard-coded values.

### Code style
- TypeScript strict mode; no `any` unless justified.
- Shared types go in `src/common/interfaces/`; domain-specific types in `src/common/domains/<domain>/interfaces.ts`.
- Keep files LF line endings (enforced by `.gitattributes`).

## CI

GitHub Actions — `.github/workflows/playwright.yml` runs on push/PR to `main` and manually:
`npm ci` → lint → typecheck → install browsers → `playwright test` → upload `playwright-report/` and `test-results/` as an artifact.

## Git

- Default branch: `main`; remote: https://github.com/olarcik/pw-autotests-parabank
- Create feature branches for new work (`feature/<short-name>`), open a PR to `main`.
- Commit messages: imperative mood, short summary line (e.g. `Add login page object and auth fixture`).
