import type { Options } from 'k6/options';

export { setup, default } from './scenarios/main.ts';

// Load: the expected everyday traffic. Starting numbers, to be tuned after real runs.
const LOAD_VUS = 10; // concurrent customers at the plateau
const RAMP_UP = '30s'; // from 0 to LOAD_VUS
const HOLD = '1m'; // plateau at LOAD_VUS
const RAMP_DOWN = '30s'; // from LOAD_VUS to 0

// Strict limits: under normal load the app must stay healthy. checks is rate>0.99, not ==1 as in
// smoke: with hundreds of iterations a single known server flake should not fail the run.
// Errors abort the run early (after 10 s of samples): with a broken app the rest of the run says
// nothing new. A slow p(95) does not abort, the whole run is still worth seeing.
const MAX_FAILED_RATE = 0.01;
const MIN_CHECKS_RATE = 0.99;
const MAX_P95_MS = 1000;

export const options: Options = {
  stages: [
    { duration: RAMP_UP, target: LOAD_VUS },
    { duration: HOLD, target: LOAD_VUS },
    { duration: RAMP_DOWN, target: 0 },
  ],
  thresholds: {
    http_req_failed: [
      { threshold: `rate<${MAX_FAILED_RATE}`, abortOnFail: true, delayAbortEval: '10s' },
    ],
    checks: [{ threshold: `rate>${MIN_CHECKS_RATE}`, abortOnFail: true, delayAbortEval: '10s' }],
    http_req_duration: [`p(95)<${MAX_P95_MS}`],
    // Also makes the summary show p(95) of the login separately
    'http_req_duration{name:GET /login/:user/:pass}': [`p(95)<${MAX_P95_MS}`],
  },
};
