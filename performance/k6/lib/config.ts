// The only place k6 code reads the environment (k6 has no Node process.env or dotenv, so the
// Playwright setup.ts cannot be used). In Compose BASE_URL is http://parabank:8080/parabank.
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/parabank';

// Load is never sent to the shared public demo, only to the local Docker app
if (BASE_URL.includes('parabank.parasoft.com')) {
  throw new Error(
    `Performance tests run only against the local ParaBank, got BASE_URL=${BASE_URL}`,
  );
}

export const API_URL = `${BASE_URL}/services/bank`;

// Without it ParaBank answers XML (docs/parabank-api.md, section 2)
export const JSON_HEADERS = { Accept: 'application/json' };
