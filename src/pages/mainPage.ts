import { Locator, Page } from '@playwright/test';
import { URLS } from '@src/common/data/setup';
import { Customer } from '@src/common/domains/customer/interfaces';

export class MainPage {
  readonly page: Page;
  readonly aboutUsItem: Locator;
  readonly servicesItem: Locator;
  readonly productsItem: Locator;
  readonly locationsItem: Locator;
  readonly adminPage: Locator;
  readonly registerLink: Locator;
  readonly forgotLoginInfoLink: Locator;
  readonly loginHeading: Locator;
  readonly loginUsernameInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly errorHeading: Locator;
  readonly errorMessage: Locator;
  readonly customerWelcome: Locator;
  readonly accountServicesHeading: Locator;
  readonly accountServicesLinks: Locator;
  readonly accountsOverviewLink: Locator;
  readonly updateContactInfoLink: Locator;
  readonly logOutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aboutUsItem = page.getByRole('link', { name: 'About Us', exact: true });
    this.servicesItem = page.getByRole('link', { name: 'Services', exact: true });
    this.productsItem = page.getByRole('link', { name: 'Products', exact: true });
    this.locationsItem = page.getByRole('link', { name: 'Locations', exact: true });
    this.adminPage = page.getByRole('link', { name: 'Admin Page', exact: true });
    this.registerLink = page.getByRole('link', { name: 'Register', exact: true });
    this.forgotLoginInfoLink = page.getByRole('link', { name: 'Forgot login info?', exact: true });
    this.loginHeading = page.getByRole('heading', { name: 'Customer Login', exact: true });
    // Login labels are plain paragraphs not linked to the inputs, so getByLabel can't find them
    this.loginUsernameInput = page.locator('#loginPanel input[name="username"]');
    this.loginPasswordInput = page.locator('#loginPanel input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Log In', exact: true });
    // Error page of a failed login (login.htm): the login form stays in the left panel
    this.errorHeading = page.getByRole('heading', { name: 'Error!', exact: true });
    // The message is a plain <p class="error"> with no role and a varying text, so CSS is the only hook
    this.errorMessage = page.locator('#rightPanel p.error');
    // Left panel of a logged-in customer: "Welcome <First> <Last>" and the Account Services menu.
    // It is on every page after login; tests reach it through MainPage (CLAUDE.md, Page objects)
    this.customerWelcome = page.locator('#leftPanel').getByText(/^Welcome /);
    this.accountServicesHeading = page.getByRole('heading', {
      name: 'Account Services',
      exact: true,
    });
    this.accountServicesLinks = page.locator('#leftPanel').getByRole('link');
    this.accountsOverviewLink = page.getByRole('link', { name: 'Accounts Overview', exact: true });
    this.updateContactInfoLink = page.getByRole('link', {
      name: 'Update Contact Info',
      exact: true,
    });
    this.logOutLink = page.getByRole('link', { name: 'Log Out', exact: true });
  }

  async open() {
    await this.page.goto(URLS.app);
  }

  async openRegisterPage() {
    await this.registerLink.click();
  }

  async openAccountsOverview() {
    await this.accountsOverviewLink.click();
  }

  async openUpdateContactInfo() {
    await this.updateContactInfoLink.click();
  }

  async logout() {
    await this.logOutLink.click();
  }

  async fillLoginForm(customer: Customer) {
    await this.loginUsernameInput.fill(customer.username);
    await this.loginPasswordInput.fill(customer.password);
  }

  async login(customer: Customer) {
    await this.fillLoginForm(customer);
    await this.loginButton.click();
  }

  async submitLoginByEnter() {
    await this.loginPasswordInput.press('Enter');
  }
}
