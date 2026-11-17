import type { Options } from 'k6/options';

export { setup, default } from './scenarios/main.ts';

// Spike: a sudden burst on top of a quiet baseline, then back. Shows whether the app survives the
// jump and recovers after it. Starting numbers, to be tuned after real runs.
const BASE_VUS = 2; // quiet traffic before and after the spike
const SPIKE_VUS = 50; // VUs at the top of the spike
const BASE_HOLD = '30s'; // baseline before the spike and recovery after it
const SPIKE_RAMP = '10s'; // jump up to SPIKE_VUS and drop back to BASE_VUS
const SPIKE_HOLD = '30s'; // time at SPIKE_VUS

// Soft limits and no abortOnFail, as in stress.ts: errors during a spike are information about the
// app, and the recovery part after it is only seen when the run is not aborted.
const MAX_FAILED_RATE = 0.05;
const MIN_CHECKS_RATE = 0.95;
const MAX_P95_MS = 3000;

export const options: Options = {
  // Used as startVUs of the stages: the run starts at the baseline, not at 0
  vus: BASE_VUS,
  stages: [
    { duration: BASE_HOLD, target: BASE_VUS },
    { duration: SPIKE_RAMP, target: SPIKE_VUS },
    { duration: SPIKE_HOLD, target: SPIKE_VUS },
    { duration: SPIKE_RAMP, target: BASE_VUS },
    { duration: BASE_HOLD, target: BASE_VUS },
  ],
  thresholds: {
    http_req_failed: [`rate<${MAX_FAILED_RATE}`],
    checks: [`rate>${MIN_CHECKS_RATE}`],
    http_req_duration: [`p(95)<${MAX_P95_MS}`],
    // Also makes the summary show p(95) of the login separately
    'http_req_duration{name:GET /login/:user/:pass}': [`p(95)<${MAX_P95_MS}`],
  },
};
