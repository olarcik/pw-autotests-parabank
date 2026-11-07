# ParaBank REST API

Research notes on the ParaBank REST API of the local Docker image, made before writing API tests.
Everything below was checked against the running container (image pinned in `docker-compose.yml`),
not only read from the specification.

## 1. Purpose and how to update

- Single reference for API tests, the HTTP layer in `src/common/api/` and services in `src/services/`:
  which endpoints exist, how they really behave, and which ones tests must never call.
- Update it when the ParaBank image digest in `docker-compose.yml` changes:
  1. `npm run docker:up`.
  2. Re-download the spec (see [section 3](#3-specification)) and check `git diff docs/parabank-openapi.yaml`.
  3. Re-check the requests in sections 5–8 that the diff touches, then update this file.

## 2. Environment

| Where                        | App base URL (`BASE_URL`)        | REST base                                      |
| ---------------------------- | -------------------------------- | ---------------------------------------------- |
| Host (`npm run docker:up`)   | `http://localhost:8080/parabank` | `http://localhost:8080/parabank/services/bank` |
| Compose (`playwright-tests`) | `http://parabank:8080/parabank`  | `http://parabank:8080/parabank/services/bank`  |

- REST base = `${BASE_URL}/services/bank` (the spec's `servers.url` is the relative `/parabank/services/bank`).
- **Always send `Accept: application/json`.** Without it (or with `Accept: */*`) every endpoint answers
  `application/xml`; `Accept: text/html` gives `406`. A wrong HTTP method (POST on a GET path or the
  other way round) gives `405`.
- **No authentication.** There are no tokens or sessions in the REST API: any client can read any
  customer by id. The only "login" is `GET /login/{username}/{password}`, which takes the credentials in
  the URL path and returns the customer. URL-encode both parts; the server logs them in plain text.
- Registration is not part of the REST API — it goes through the web form (see [section 5](#5-registration)).
- **The web UI uses a proxy, not this base.** The pages call the same API at
  `${BASE_URL}/services_proxy/bank/...` with the browser session cookie. Without a logged-in session the
  proxy answers `401 {"message":"User login required","status":401}`. It checks only that someone is
  logged in, not that the data belongs to them: a logged-in customer can read another customer's
  accounts and transactions through it (and in the UI, e.g. `activity.htm?id=<other account>`). Its
  errors are JSON bodies such as
  `{"title":"Bad Request","status":400,"detail":"Required parameter 'amount' is not present.",...}`
  where the direct REST call answers `500` or `404`.

## 3. Specification

- Swagger UI: `${BASE_URL}/api-docs/index.html`. It loads the spec from `<context>/services/bank/openapi.yaml`.
- Spec: `${BASE_URL}/services/bank/openapi.yaml` (also served as `openapi.json`), OpenAPI 3.0.1,
  "The ParaBank REST API" version 3.0.0.
- Copy in the repo: [`docs/parabank-openapi.yaml`](parabank-openapi.yaml), byte-for-byte as served
  (excluded from Prettier in `.prettierignore`). Refresh it with:

  ```bash
  curl -s http://localhost:8080/parabank/services/bank/openapi.yaml -o docs/parabank-openapi.yaml
  ```

- The spec documents only a `default` response for every operation — no error codes or error bodies.
  Real errors are described in [section 8](#8-known-issues).

## 4. Endpoint map

Paths are relative to the REST base. "Tests" column: **stage 1** — planned for the first API tests,
**later** — changes data of our own test users, planned after stage 1, **never** — see [section 7](#7-dangerous-methods).

### Customers

| Method | Path                                | Purpose                                            | Tests   |
| ------ | ----------------------------------- | -------------------------------------------------- | ------- |
| GET    | `/login/{username}/{password}`      | Find a customer by credentials, returns `Customer` | stage 1 |
| GET    | `/customers/{customerId}`           | Customer details                                   | stage 1 |
| POST   | `/customers/update/{customerId}`    | Update customer data (all fields as query params)  | later   |
| GET    | `/customers/{customerId}/positions` | Customer's stock positions                         | later   |

There is **no endpoint that creates a customer**.

### Accounts

| Method | Path                               | Purpose                                                           | Tests   |
| ------ | ---------------------------------- | ----------------------------------------------------------------- | ------- |
| GET    | `/customers/{customerId}/accounts` | Customer's accounts                                               | stage 1 |
| GET    | `/accounts/{accountId}`            | Account by id                                                     | stage 1 |
| POST   | `/createAccount`                   | Open an account (`customerId`, `newAccountType`, `fromAccountId`) | later   |

`newAccountType` is a number: `0` `CHECKING`, `1` `SAVINGS`, `2` `LOAN` (the UI offers only the first
two). Names (`CHECKING`) give `404`, other numbers (`5`, `-1`) give `500`, a missing value means `0`.
Opening always moves `100.00` from `fromAccountId` into the new account: a `Debit` "Funds Transfer
Sent" on the source and a `Credit` "Funds Transfer Received" on the new account. The `minimumBalance`
setting is also `100.00`, but the balance of the source is not checked: a source with `15.50` ends at
`-84.50`. The response reports `"balance":0`, while `GET /accounts/{id}` then shows `100.00`.

### Transfers and payments

| Method | Path        | Purpose                                             | Tests |
| ------ | ----------- | --------------------------------------------------- | ----- |
| POST   | `/transfer` | Transfer (`fromAccountId`, `toAccountId`, `amount`) | later |
| POST   | `/deposit`  | Deposit (`accountId`, `amount`)                     | later |
| POST   | `/withdraw` | Withdraw (`accountId`, `amount`)                    | later |
| POST   | `/billpay`  | Pay a bill (`accountId`, `amount`, body `Payee`)    | later |

### Transactions

| Method | Path                                                                     | Purpose                                                                                      | Tests   |
| ------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------- |
| GET    | `/accounts/{accountId}/transactions`                                     | All transactions of an account                                                               | stage 1 |
| GET    | `/transactions/{transactionId}`                                          | Transaction by id                                                                            | stage 1 |
| GET    | `/accounts/{accountId}/transactions/onDate/{onDate}`                     | Filter by date (`MM-dd-yyyy`)                                                                | later   |
| GET    | `/accounts/{accountId}/transactions/fromDate/{fromDate}/toDate/{toDate}` | Filter by date range (`MM-dd-yyyy`)                                                          | later   |
| GET    | `/accounts/{accountId}/transactions/month/{month}/type/{type}`           | Filter by month and type (`All` works for both)                                              | later   |
| GET    | `/accounts/{accountId}/transactions/amount/{amount}`                     | Filter by amount (the spec's summary "Create transactions by amount" is wrong: it is a read) | later   |

### Loans and positions

| Method | Path                                            | Purpose                | Tests |
| ------ | ----------------------------------------------- | ---------------------- | ----- |
| POST   | `/requestLoan`                                  | Request a loan         | later |
| POST   | `/customers/{customerId}/buyPosition`           | Buy shares             | later |
| POST   | `/customers/{customerId}/sellPosition`          | Sell shares            | later |
| GET    | `/positions/{positionId}`                       | Position by id         | later |
| GET    | `/positions/{positionId}/{startDate}/{endDate}` | Position price history | later |

### Service

| Method | Path                           | Purpose                                  | Tests |
| ------ | ------------------------------ | ---------------------------------------- | ----- |
| POST   | `/cleanDB`                     | Delete all data                          | never |
| POST   | `/initializeDB`                | Reset the database to the demo data      | never |
| POST   | `/setParameter/{name}/{value}` | Change application settings for everyone | never |
| POST   | `/startupJmsListener`          | Start the JMS listener                   | never |
| POST   | `/shutdownJmsListener`         | Stop the JMS listener                    | never |

## 5. Registration

The REST API has no create-customer method (confirmed in the spec and on the running app), so a new
customer can only be created through the web form `register.htm`. The flow below was run with `curl`.

### Request sequence

1. `GET ${BASE_URL}/register.htm` — **required**: it creates the session and stores the form object in it
   (`@SessionAttributes`). Keep the `JSESSIONID` cookie.
2. `POST ${BASE_URL}/register.htm` with the same cookie, `Content-Type: application/x-www-form-urlencoded`:

   | Form field                 | `Customer` field (`src/common/domains/customer`) | Required |
   | -------------------------- | ------------------------------------------------ | -------- |
   | `customer.firstName`       | `firstName`                                      | yes      |
   | `customer.lastName`        | `lastName`                                       | yes      |
   | `customer.address.street`  | `address.street`                                 | yes      |
   | `customer.address.city`    | `address.city`                                   | yes      |
   | `customer.address.state`   | `address.state`                                  | yes      |
   | `customer.address.zipCode` | `address.zipCode`                                | yes      |
   | `customer.phoneNumber`     | `phoneNumber`                                    | no       |
   | `customer.ssn`             | `ssn`                                            | yes      |
   | `customer.username`        | `username`                                       | yes      |
   | `customer.password`        | `password`                                       | yes      |
   | `repeatedPassword`         | `password` (confirmation)                        | yes      |

3. The new customer is logged in on that session. Get its id through REST:
   `GET /login/{username}/{password}` → `Customer.id`.
4. `GET /customers/{id}/accounts` → exactly one `CHECKING` account with balance `515.50`.

### Result is in the HTML, not in the status code

Success and every validation error answer `200 text/html` without a redirect. Tell them apart by the body:

| Outcome                           | Signs in the HTML response                                                                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Success                           | `<title>ParaBank \| Customer Created</title>`, `<h1>Welcome {username}</h1>`, "Your account was created successfully. You are now logged in."                                                   |
| Validation error                  | `<title>ParaBank \| Register for Free Online Account Access</title>` and one `<span id="{field}.errors" class="error">…</span>` per invalid field                                               |
| Duplicate username                | as above, `customer.username.errors` = "This username already exists."                                                                                                                          |
| Passwords differ                  | as above, `repeatedPassword.errors` = "Passwords did not match."                                                                                                                                |
| No session (POST without the GET) | `500`, `<title>ParaBank \| Error</title>`, "Error! An internal error has occurred…"; the server logs `IllegalStateException: Expected session attribute 'customerForm'`; no customer is created |

Messages for empty required fields are the same as in the UI (see `REGISTER_ERRORS` in
`src/common/data/testData.ts`).

## 6. Data models

Real responses with `Accept: application/json`. Ids are JSON numbers (`int32`). Amounts in `Account` and
`Transaction` bodies are JSON numbers written with two decimals; other responses do not always follow
this: `POST /createAccount` returns `"balance":0`, `POST /billpay` returns `"amount":25`. Model names
are from the spec; in code the bodies are `<Name>Response` (`CustomerResponse`, `AccountResponse`),
while `Customer` is the test data.

`Customer` (from `GET /login/...` and `GET /customers/{id}`; never contains username or password):

```json
{
  "id": 210902,
  "firstName": "Api",
  "lastName": "Probe",
  "address": { "street": "1 Test St", "city": "Austin", "state": "TX", "zipCode": "73301" },
  "phoneNumber": "5551234",
  "ssn": "123-45-6789"
}
```

`Address` — nested in `Customer` (and `Payee`), all fields are strings:

```json
{ "street": "1 Test St", "city": "Austin", "state": "TX", "zipCode": "73301" }
```

`Account` (`GET /accounts/{id}`; `GET /customers/{id}/accounts` returns an array); `type` is
`CHECKING`, `SAVINGS` or `LOAN`:

<!-- prettier-ignore -->
```json
{ "id": 212034, "customerId": 210902, "type": "CHECKING", "balance": 515.50 }
```

The raw body is `"balance":515.50`; after `JSON.parse` it is the number `515.5`. Compare amounts as
numbers (or format them), not as strings.

`Transaction` (`GET /transactions/{id}`; the list endpoints return arrays). Example from the demo
customer `john` (`id` 12212), read only; `type` is `Credit` or `Debit`:

<!-- prettier-ignore -->
```json
{
  "id": 12145,
  "accountId": 12345,
  "type": "Credit",
  "date": 1765411200000,
  "amount": 300.00,
  "description": "Check # 1111"
}
```

`date` is **epoch milliseconds** of midnight UTC in JSON (`2025-12-11T00:00:00.000Z` in XML). A new
customer's default account has **no transactions**: the starting `515.50` is not recorded as one. New
transactions get the server's current date (midnight UTC; the container runs in UTC).

### Demo data

The demo data (`insert.sql` in the image, loaded when the database is initialized) is not fixed in time:

- Transaction dates are relative to the day of initialization. The two checks of account `12345`
  (`12145`, `12256`) are on December 11 and 12 of the **previous** year
  (`CONCAT(YEAR(CURRENT_DATE - '1' YEAR),'-12-11')`), so the example above changes every year. All other
  demo transactions are `CURRENT_DATE` minus 3, 8, 10, 11 or 15 days.
- Besides `john/demo` (`12212`) there is a second customer `parasoft/demo` (`12323`, one `CHECKING`
  account `13455` with `2014.76`). Both are shared and read-only for tests.
- Settings: `initialBalance=515.50`, `minimumBalance=100.00`, `loanProvider=ws`, `loanProcessor=funds`,
  `loanProcessorThreshold=20`.
- New customers, accounts and transactions get ids from global sequences that grow in steps of `111`
  (first new customer `12434`, account `13566`, transaction `14476`).

## 7. Dangerous methods

Tests and services never call these: they change the shared app for everyone (other workers, other
browsers, the healthcheck) and some cannot be undone.

- `POST /cleanDB` — deletes all data.
- `POST /initializeDB` — resets the database to the demo data. The Compose healthcheck calls the
  `initializeDB.htm` page once on a fresh container; nothing else may.
- `POST /setParameter/{name}/{value}` — changes global application settings (the ones on the Admin
  page) for every user of the app.
- `POST /startupJmsListener`, `POST /shutdownJmsListener` — switch the JMS listener.
- Any mutating call on data that is not ours: the demo customer `john/demo` (`12212`) and its accounts
  are shared and read-only for tests. Mutating calls ("later" in [section 4](#4-endpoint-map)) are only
  made on customers the test registered itself.
- The server does not check that an account belongs to the customer: `POST /createAccount`,
  `POST /transfer` and `POST /requestLoan` take money from **any** existing account id
  (`fromAccountId`), and a loan account goes to whatever `customerId` is sent. Because ids are
  sequential, a wrong id changes another customer's data (another test's customer, or `john`) instead of
  failing. Always use ids returned for the test's own customer.
- Amounts with more than two decimals (`1.005`) are accepted and **permanently break** the account (see
  [section 8](#8-known-issues)).

## 8. Known issues

Spec vs. reality and other surprises:

| Topic                              | Spec                                    | Reality                                                                                                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default format                     | JSON or XML                             | XML unless `Accept: application/json`; `Accept: text/html` → `406`                                                                                                                                                                                                          |
| Not found / invalid login          | only `default` response                 | `400 text/plain` with a message, not `404` JSON (table below)                                                                                                                                                                                                               |
| Invalid path parameter             | `integer/int32`                         | Non-numeric id or id above int32 → `404` with an empty body. `0`, negative ids and ids up to `2147483647` that don't exist → `400` "Could not find …"                                                                                                                       |
| Non-numeric query value            | `integer` / `number`                    | `amount=abc`, `customerId=abc` → `404` with an empty body                                                                                                                                                                                                                   |
| Login path                         | plain `string`                          | Case-sensitive. Trailing spaces in username or password are accepted (`/login/john%20/demo` → `200`), leading ones are not. `%2F` in a part → `400` HTML page from Tomcat                                                                                                   |
| `Transaction.date`                 | `string`, `date-time`                   | JSON: number (epoch ms); XML: ISO string                                                                                                                                                                                                                                    |
| Date path params                   | plain `string`                          | `MM-dd-yyyy`, parsed leniently: other formats give no error (`2025-12-11` → `200 []`), out-of-range parts roll over (`09-55-2026` = `10-25-2026`), trailing text is ignored (`10-25-2026x`). `/` in the date → `404`. Only unparsable text → `400` "Unable to parse date …" |
| `.../month/{month}/type/{type}`    | plain `string`                          | `month`: English month name in any case, or a prefix of it (`Oct`, `N`); numbers and unknown values are ignored (all months). `type`: exactly `All`, `Credit` or `Debit`; any other value or case (`credit`) → `500` HTML error page                                        |
| Filters on an unknown account      | —                                       | All four filters → `200 []` (the plain `/accounts/{id}/transactions` → `400`)                                                                                                                                                                                               |
| `.../transactions/amount/{amount}` | summary "Create transactions by amount" | A read-only filter                                                                                                                                                                                                                                                          |
| `newAccountType`                   | `integer`                               | `0` / `1` / `2` only ([section 4](#accounts))                                                                                                                                                                                                                               |
| Mutating responses                 | `string`                                | `deposit`, `withdraw`, `transfer`, `customers/update`: `Content-Type: application/json`, but the body is plain text (`Successfully deposited $100 to account #13677`), not valid JSON                                                                                       |
| Customer creation                  | —                                       | No REST method; form only ([section 5](#5-registration))                                                                                                                                                                                                                    |

Error responses (all `text/plain;charset=UTF-8`):

| Request                                                     | Status | Body                                                                                  |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `GET /login/{user}/{wrongPassword}`                         | 400    | `Invalid username and/or password`                                                    |
| `GET /login/{unknownUser}/{any}`                            | 400    | `Invalid username and/or password`                                                    |
| `GET /customers/999999999` (also `0`, `-1`)                 | 400    | `Could not find customer #999999999`                                                  |
| `GET /customers/999999999/accounts`                         | 400    | `Could not find customer #999999999`                                                  |
| `GET /accounts/999999999`                                   | 400    | `Could not find account #999999999`                                                   |
| `GET /accounts/999999999/transactions`                      | 400    | `Could not find transactions for account #999999999`                                  |
| `GET /transactions/999999999`                               | 400    | `Could not find transaction #999999999`                                               |
| `GET /customers/abc`, `/customers/9999999999`, unknown path | 404    | empty                                                                                 |
| `POST /createAccount` with an unknown customer or account   | 400    | `Could not create new account for customer {customerId} from account {fromAccountId}` |
| `POST /deposit`, `/withdraw` with an unknown account        | 400    | `Could not find account number {accountId}`                                           |
| `POST /transfer` with an unknown account                    | 400    | `Could not find account number {fromAccountId} and/or {toAccountId}`                  |
| `POST /requestLoan` with an unknown `fromAccountId`         | 400    | `Could not find account #{fromAccountId}`                                             |

A missing parameter counts as `0` in these messages (`Could not find account number 0`).

Errors that are not `400 text/plain`:

| Request                                                                                    | Status | Body                                                                                       |
| ------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------ |
| `deposit`, `withdraw`, `transfer`, `billpay` without `amount` (or `amount=`)               | 500    | HTML error page `ParaBank \| Error`, "An internal error has occurred and has been logged." |
| `POST /billpay` with an unknown or missing `accountId`, or without a body                  | 500    | HTML error page                                                                            |
| `POST /billpay` with a body that is not valid `Payee` JSON (unknown field, `"abc"` number) | 500    | empty                                                                                      |
| `POST /customers/update/{id}` with missing parameters (nothing is changed)                 | 500    | HTML error page                                                                            |
| `POST /customers/update/{id}` with a username another customer has                         | 500    | HTML error page; the server logs a unique constraint violation on `CUSTOMER`               |
| `POST /createAccount` with `newAccountType` other than `0`–`2`                             | 500    | HTML error page                                                                            |
| `POST /requestLoan` without `amount` or `downPayment`                                      | 400    | `text/plain` with a Java exception message (`Cannot read field "intCompact" …`)            |

Other:

- **False "This username already exists."** on registration (see Known issues in `CLAUDE.md`): seen in
  about 0.3–1.3% of UI registrations. With plain HTTP form posts (`GET` + `POST`, one session each,
  sequential) it did not appear in 300 registrations — not proof that HTTP is unaffected (at 0.3% that
  happens about one time in three), so API registration is treated the same way as UI: only `retries`
  in `playwright.config.ts`, no retries in services, fixtures or tests.
- Registration without the preceding `GET register.htm` fails with `500` (section 5).
- **Amounts with more than two decimals break the account for good.** `POST /deposit` or
  `POST /transfer` with `amount=1.005` answers `200` ("Successfully deposited $1.005 …") and stores the
  value; after that `GET /accounts/{id}`, `/accounts/{id}/transactions` and
  `/customers/{customerId}/accounts` answer `500` (server log: `ArithmeticException: Rounding necessary`
  in `JdbcAccountDao$AccountMapper`), and the customer's pages in the UI show the error page. Only
  `/customers/{customerId}` still works. A transfer breaks both accounts.
- The server log prints usernames and passwords of REST logins in plain text.

## 9. Coverage plan

Stage 1 (read-only API, each test registers its own customer through the form):

- Registration: `CustomerService.registerCustomer()` (`GET` + `POST register.htm`) with `generateCustomer()`, success detected by the title;
  then `GET /login/{username}/{password}` for the customer id.
- `GET /customers/{id}`, `/customers/{id}/accounts`, `/accounts/{id}`, `/accounts/{id}/transactions`:
  status, `application/json`, model shape (section 6), values match the registered customer
  (`515.50` `CHECKING` account, empty transaction list).
- Error cases from section 8 (wrong password, unknown ids, invalid id format).

Later:

- Mutating endpoints on the test's own customer: `createAccount`, `transfer`, `deposit`, `withdraw`,
  `billpay`, `customers/update`, then transaction filters (dates, month/type, amount) on the data
  the test created.
- Loans and positions (not explored yet; tests take the app settings as they are and never change them).

Never: the service methods in section 7.
