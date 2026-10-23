# pw-autotests-parabank

## Running locally with Docker

The tests can run against a local ParaBank started from the official
[`parasoft/parabank`](https://hub.docker.com/r/parasoft/parabank) image, instead of the shared public demo.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with the Compose plugin), running
- Node.js LTS and dependencies installed: `npm ci`, then `npx playwright install`
- Port `8080` free on the host
- A `.env` file created from the template: `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`).
  It sets `BASE_URL=http://localhost:8080/parabank`, which the tests use for every URL.

### Commands

```bash
npm run docker:up      # start ParaBank and wait until it is ready
npm test               # run the tests against it
npm run docker:logs    # follow the application logs (Ctrl+C to stop)
npm run docker:down    # stop and remove the container
npm run test:docker    # docker:up + playwright test in one command
```

Extra Playwright arguments go after `--`, e.g. `npm run test:docker -- --project=chromium`.

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
  and others (Firefox) get a foreign `404 Not Found`. Stop that server, or change the host port in
  `docker-compose.yml` (`"8081:8080"`) and `BASE_URL` in `.env` to match.
