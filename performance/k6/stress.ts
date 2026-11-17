import type { Options } from 'k6/options';

export { setup, default } from './scenarios/main.ts';

// Stress: VUs grow step by step to find where the app starts to slow down or fail.
// Starting numbers, to be tuned after real runs.
const STEP_VUS = [10, 25, 50, 75]; // VUs of each step, reached by a linear ramp
const STEP_DURATION = '1m'; // length of each step
const RAMP_DOWN = '30s'; // from the last step to 0

// Soft limits and no abortOnFail: stress looks for the breaking point, so a red result is
// information about the app, not a defect of the script. The run always finishes to show the whole
// curve in the report (the exit code is still non-zero when a limit is crossed).
const MAX_FAILED_RATE = 0.05;
const MIN_CHECKS_RATE = 0.95;
const MAX_P95_MS = 3000;

export const options: Options = {
  stages: [
    ...STEP_VUS.map((target) => ({ duration: STEP_DURATION, target })),
    { duration: RAMP_DOWN, target: 0 },
  ],
  thresholds: {
    http_req_failed: [`rate<${MAX_FAILED_RATE}`],
    checks: [`rate>${MIN_CHECKS_RATE}`],
    http_req_duration: [`p(95)<${MAX_P95_MS}`],
    // Also makes the summary show p(95) of the login separately
    'http_req_duration{name:GET /login/:user/:pass}': [`p(95)<${MAX_P95_MS}`],
  },
};
