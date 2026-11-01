import { Locator, Page } from '@playwright/test';

export class AccountsOverviewPage {
  readonly page: Page;
  readonly accountsOverviewHeading: Locator;
  readonly accountRows: Locator;
  readonly accountsTotalRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountsOverviewHeading = page.getByRole('heading', {
      name: 'Accounts Overview',
      exact: true,
    });
    // The table has no accessible name; account rows link to the account activity
    const accountTable = page.locator('#accountTable');
    this.accountRows = accountTable.getByRole('row').filter({ has: page.getByRole('link') });
    this.accountsTotalRow = accountTable.getByRole('row').filter({ hasText: 'Total' });
  }
}
