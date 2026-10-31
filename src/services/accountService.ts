import { endpoints } from '../common/api/endpoints';
import { RequestHandler } from '../common/api/requestHandler';

// Methods only send requests and return the responses; tests assert them
export class AccountService {
  private readonly api: RequestHandler;

  constructor(api: RequestHandler) {
    this.api = api;
  }

  getAccounts(customerId: number) {
    return this.api.path(endpoints.customerAccounts(customerId)).get();
  }

  getAccount(accountId: number) {
    return this.api.path(endpoints.account(accountId)).get();
  }
}
