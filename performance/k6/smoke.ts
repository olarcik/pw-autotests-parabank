import { sleep } from 'k6';
import type { Options } from 'k6/options';
import { registerCustomer, type PerfCustomer } from './lib/customer.ts';
import { customerFlow } from './scenarios/customerFlow.ts';

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

// Runs once before the iterations; the customer is passed to every VU
export function setup(): PerfCustomer {
  return registerCustomer();
}

export default function (customer: PerfCustomer): void {
  customerFlow(customer);
  // Think time. It also keeps the run long enough for the web dashboard: k6 skips the HTML report
  // when the run gives fewer than 2 snapshots ("not enough data"), and a warm smoke lasts ~50 ms.
  sleep(1);
}
