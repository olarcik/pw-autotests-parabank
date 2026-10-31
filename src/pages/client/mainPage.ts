import { Locator, Page } from '@playwright/test';
import { URLS } from '../../common/data/setup';
import { Customer } from '../../common/domains/customer/interfaces';

export class MainPage {
  readonly page: Page;
  readonly aboutUsItem: Locator;
  readonly servicesItem: Locator;
  readonly productsItem: Locator;
  readonly locationsItem: Locator;
  readonly adminPage: Locator;
  readonly registerLink: Locator;
  readonly loginHeading: Locator;
  readonly loginUsernameInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly customerWelcome: Locator;
  readonly accountServicesHeading: Locator;
  readonly accountServicesLinks: Locator;
  readonly accountsOverviewLink: Locator;
  readonly logOutLink: Locator;
  readonly accountsOverviewHeading: Locator;
  readonly accountRows: Locator;
  readonly accountsTotalRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aboutUsItem = page.getByRole('link', { name: 'About Us', exact: true });
    this.servicesItem = page.getByRole('link', { name: 'Services', exact: true });
    this.productsItem = page.getByRole('link', { name: 'Products', exact: true });
    this.locationsItem = page.getByRole('link', { name: 'Locations', exact: true });
    this.adminPage = page.getByRole('link', { name: 'Admin Page', exact: true });
    this.registerLink = page.getByRole('link', { name: 'Register', exact: true });
    this.loginHeading = page.getByRole('heading', { name: 'Customer Login', exact: true });
    // Login labels are plain paragraphs not linked to the inputs, so getByLabel can't find them
    this.loginUsernameInput = page.locator('#loginPanel input[name="username"]');
    this.loginPasswordInput = page.locator('#loginPanel input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In', exact: true });
    // Left panel of a logged-in customer: "Welcome <First> <Last>" and the Account Services menu
    this.customerWelcome = page.locator('#leftPanel').getByText(/^Welcome /);
    this.accountServicesHeading = page.getByRole('heading', {
      name: 'Account Services',
      exact: true,
    });
    this.accountServicesLinks = page.locator('#leftPanel').getByRole('link');
    this.accountsOverviewLink = page.getByRole('link', { name: 'Accounts Overview', exact: true });
    this.logOutLink = page.getByRole('link', { name: 'Log Out', exact: true });
    // Accounts Overview table has no accessible name; account rows link to the account activity
    this.accountsOverviewHeading = page.getByRole('heading', {
      name: 'Accounts Overview',
      exact: true,
    });
    const accountTable = page.locator('#accountTable');
    this.accountRows = accountTable.getByRole('row').filter({ has: page.getByRole('link') });
    this.accountsTotalRow = accountTable.getByRole('row').filter({ hasText: 'Total' });
  }

  async open() {
    await this.page.goto(URLS.client);
  }

  async openRegisterPage() {
    await this.registerLink.click();
  }

  async openAccountsOverview() {
    await this.accountsOverviewLink.click();
  }

  async logout() {
    await this.logOutLink.click();
  }

  async login(customer: Customer) {
    await this.loginUsernameInput.fill(customer.username);
    await this.loginPasswordInput.fill(customer.password);
    await this.loginButton.click();
  }
}
