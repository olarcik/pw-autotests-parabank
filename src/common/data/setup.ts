import dotenv from 'dotenv';
import path from 'path';

// Environment values are loaded here, in the module that reads them, so they are always loaded
// before use, whoever imports this file first (playwright.config.ts or a test worker).
// dotenv never overwrites a variable that is already set, so the order of precedence is:
// shell / CI / Compose > .env > env/<ENV>.env. A missing file is not an error: the Docker image
// has no env/ folder, BASE_URL comes from docker-compose.yml there.
const ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

export const ENV = process.env.ENV || 'local';
dotenv.config({ path: path.join(ROOT, 'env', `${ENV}.env`), quiet: true });

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error(
    `BASE_URL is not set for ENV="${ENV}". Set ENV to an environment with a file in env/ ` +
      '(local, demo) or set BASE_URL directly in the shell or .env.',
  );
}
export const BASE_URL = baseUrl;

export const URLS = {
  app: BASE_URL,
  // REST API base (docs/parabank-api.md)
  api: `${BASE_URL}/services/bank`,
};
