# pw-autotests-parabank

[![Playwright Tests](https://github.com/olarcik/pw-autotests-parabank/actions/workflows/playwright-tests.yml/badge.svg?branch=main)](https://github.com/olarcik/pw-autotests-parabank/actions/workflows/playwright-tests.yml)

## Running locally with Docker

The tests can run against a local ParaBank started from the official
[`parasoft/parabank`](https://hub.docker.com/r/parasoft/parabank) image, instead of the shared public demo.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with the Compose plugin), running
- Node.js LTS and dependencies installed: `npm ci`, then `npx playwright install`
- Port `8080` free on the host, or another one set in `PARABANK_PORT` (see Troubleshooting)
- A `.env` file created from the template: `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`).
  It sets `BASE_URL=http://localhost:8080/parabank`, which the tests use for every URL.

### Commands

```bash
npm run docker:up      # start ParaBank and wait until it is ready
npm test               # run the tests against it
npm run docker:logs    # follow the application logs (Ctrl+C to stop)
npm run docker:down    # stop and remove the containers
npm run test:host-docker  # docker:up + playwright test in one command
```

Extra Playwright arguments go after `--`, e.g. `npm run test:host-docker -- --project=chromium`.

`docker:up` returns only when the container is `healthy`. A fresh ParaBank has an empty database and redirects
every page to `initializeDB.htm`; the healthcheck in `docker-compose.yml` triggers that initialization once,
so the app is ready (with the demo user `john` / `demo`) as soon as the command finishes, usually in 15–20 seconds.
The database lives in the container, so `docker:down` + `docker:up` gives a clean app.

The image is pinned by digest in `docker-compose.yml`; the comment there shows how to update it.

### Checking that it works

1. `npm run docker:up` ends without errors, and `docker compose ps` shows the container as `(healthy)`.
2. http://localhost:8080/parabank opens the ParaBank home page in a browser.
3. `npm test` passes in all browsers.

### Troubleshooting

- **`docker:up` reports `unhealthy`** — check `npm run docker:logs` for Tomcat errors.
- **Port 8080 is already in use** — find the process with
  `Get-NetTCPConnection -LocalPort 8080 -State Listen` (PowerShell) or `lsof -i :8080` (macOS/Linux).
  Another server may hold only the IPv4 address while Docker still gets IPv6; then some browsers reach ParaBank
  and others (Firefox) get a foreign `404 Not Found`. Stop that server, or set another host port in `.env`:
  `PARABANK_PORT=8081` and `BASE_URL=http://localhost:8081/parabank` (keep both in sync).
  `npm run docker:test` does not need the host port at all — the tests reach ParaBank inside the Compose network.

## Running tests in Docker

The tests themselves can also run in a container, so the only requirement on the host is Docker
(Node.js is needed just to call the npm script):

```bash
npm run docker:test
```

It builds the test image from `Dockerfile` (based on `mcr.microsoft.com/playwright`, with all browsers),
starts ParaBank, waits until it is `healthy`, runs the whole suite in the `playwright-tests` service, and then removes
the containers (`docker compose down`). The command exits with the tests' result: `0` when they pass, `1` otherwise.

- The `playwright-tests` service is in the Compose profile `tests`, so `npm run docker:up` still starts ParaBank alone.
- Inside the Compose network the tests use `BASE_URL=http://parabank:8080/parabank`: `localhost` there would be
  the test container itself, while `parabank` is the service name that Compose DNS resolves to the app container.
  `BASE_URL` from `.env` is ignored; the other variables (`QASE_*`, credentials) are passed through from `.env`.
- `playwright-report/` and `test-results/` are mounted from the host, so after the run open the report with
  `npm run report`.
- To pass Playwright arguments, run the service directly, e.g.
  `docker compose --profile tests run --rm --build playwright-tests npx playwright test --project=chromium`
  (then `npm run docker:down`).

The base image version in `Dockerfile` must equal the `@playwright/test` version in `package-lock.json`.
When upgrading Playwright, bump `PLAYWRIGHT_VERSION` in `Dockerfile` too; the image build fails if they differ.

## CI

[`.github/workflows/playwright-tests.yml`](.github/workflows/playwright-tests.yml) runs on every pull request and push to `main`
(and manually from the Actions tab), with two parallel jobs:

- **Lint and type check** — `npm ci`, `npm run lint`, `npm run typecheck`.
- **Playwright tests in Docker** — `npm run docker:test`, the same command as locally. The HTML report and
  test results are uploaded as the `playwright-report` artifact even when tests fail.

A new push to the same branch cancels the run still in progress. The workflow has read-only repository permissions.

Optional configuration (Settings → Secrets and variables → Actions):

- variables: `ENV`, `TENANT`, `QASE_MODE` (`testops` to send results to Qase), `QASE_TESTOPS_PROJECT`;
- secrets: `CLIENT_USERNAME`, `CLIENT_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `QASE_TESTOPS_API_TOKEN`.
