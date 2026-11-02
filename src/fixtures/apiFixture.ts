import { APIRequestContext, TestInfo } from '@playwright/test';
import { attachExchanges } from '@src/common/api/exchangeLog';
import { RequestHandler } from '@src/common/api/requestHandler';
import { URLS } from '@src/common/data/setup';

// HTTP client on the REST base; built on `request`, so one test keeps its session cookies and
// tests never share them
export async function apiFixture(
  { request }: { request: APIRequestContext },
  use: (api: RequestHandler) => Promise<void>,
  testInfo: TestInfo,
): Promise<void> {
  const api = new RequestHandler(request, URLS.api);
  await use(api);
  await attachExchanges(testInfo, api.log);
}
