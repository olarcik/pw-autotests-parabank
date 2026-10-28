import { APIRequestContext, TestStepInfo, test } from '@playwright/test';

type Params = Record<string, string | number | boolean>;
type Headers = Record<string, string>;

// Longest response body kept in the report attachment
const MAX_BODY_LENGTH = 2000;

// Entry point of the HTTP layer (docs/parabank-api.md). It keeps no request state: every path() or
// url() call returns a new builder, so headers, params and bodies never leak between requests or tests.
// path() targets the REST base and sends Accept: application/json (without it ParaBank answers XML);
// url() takes a full address (e.g. the register.htm form) and sends only the headers set on it.
export class RequestHandler {
  private readonly request: APIRequestContext;
  private readonly baseUrl: string;

  constructor(request: APIRequestContext, baseUrl: string) {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  path(path: string) {
    return new RequestBuilder(this.request, `${this.baseUrl}${path}`, path, {
      Accept: 'application/json',
    });
  }

  url(url: string) {
    return new RequestBuilder(this.request, url, new URL(url).pathname, {});
  }
}

// One request. Terminal methods return the raw APIResponse: no status checks, no parsing, no retries —
// tests assert the response. Each request is a report step "METHOD /path" with request and response attached.
class RequestBuilder {
  private readonly request: APIRequestContext;
  private readonly url: string;
  // Path shown in the step title: relative to the REST base for path(), the URL pathname for url()
  private readonly title: string;
  private requestHeaders: Headers;
  private requestParams: Params = {};
  private formData?: Params;
  private jsonBody?: unknown;

  constructor(request: APIRequestContext, url: string, title: string, headers: Headers) {
    this.request = request;
    this.url = url;
    this.title = title;
    this.requestHeaders = headers;
  }

  params(params: Params) {
    this.requestParams = { ...this.requestParams, ...params };
    return this;
  }

  headers(headers: Headers) {
    this.requestHeaders = { ...this.requestHeaders, ...headers };
    return this;
  }

  // application/x-www-form-urlencoded body
  form(form: Params) {
    this.formData = form;
    return this;
  }

  // JSON body
  body(body: unknown) {
    this.jsonBody = body;
    return this;
  }

  get() {
    return this.send('GET');
  }

  post() {
    return this.send('POST');
  }

  private send(method: 'GET' | 'POST') {
    return test.step(`${method} ${this.title}`, async (step) => {
      const options = {
        headers: this.requestHeaders,
        params: this.requestParams,
        form: this.formData,
        data: this.jsonBody,
      };
      await attachJson(step, 'request', { method, url: this.url, ...options });

      const response =
        method === 'GET'
          ? await this.request.get(this.url, options)
          : await this.request.post(this.url, options);

      await attachJson(step, 'response', {
        status: response.status(),
        contentType: response.headers()['content-type'],
        body: truncate(await response.text()),
      });
      return response;
    });
  }
}

const attachJson = (step: TestStepInfo, name: string, value: unknown) =>
  step.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });

const truncate = (text: string) =>
  text.length > MAX_BODY_LENGTH
    ? `${text.slice(0, MAX_BODY_LENGTH)}… (${text.length} chars)`
    : text;
