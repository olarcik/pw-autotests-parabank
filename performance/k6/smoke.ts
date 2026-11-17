import type { Options } from 'k6/options';

export { setup, default } from './scenarios/main.ts';

// Smoke: one VU, one iteration. Checks that the scripts and the app work, not how fast they are.
export const options: Options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    // Per-request thresholds also make the summary show p(95) per request name
    'http_req_duration{name:GET /register.htm}': ['p(95)<1000'],
    'http_req_duration{name:POST /register.htm}': ['p(95)<1000'],
    'http_req_duration{name:GET /login/:user/:pass}': ['p(95)<1000'],
    checks: ['rate==1'],
  },
};
