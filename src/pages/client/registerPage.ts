import { expect, Locator, Page } from '@playwright/test';
import { User } from '../../common/domains/user/interfaces';

export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly introText: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly ssnInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessages: Locator;
  readonly phoneNumberError: Locator;
  readonly confirmPasswordError: Locator;
  readonly welcomeHeading: Locator;
  readonly successMessage: Locator;
  readonly requiredFields: { name: string; input: Locator }[];

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Signing up is easy!', exact: true });
    this.introText = page.getByText(
      'If you have an account with us you can sign-up for free instant online access.',
    );
    // Form labels are plain table cells not linked to the inputs, so getByLabel can't find them — use input ids
    this.firstNameInput = page.locator('[id="customer.firstName"]');
    this.lastNameInput = page.locator('[id="customer.lastName"]');
    this.addressInput = page.locator('[id="customer.address.street"]');
    this.cityInput = page.locator('[id="customer.address.city"]');
    this.stateInput = page.locator('[id="customer.address.state"]');
    this.zipCodeInput = page.locator('[id="customer.address.zipCode"]');
    this.phoneInput = page.locator('[id="customer.phoneNumber"]');
    this.ssnInput = page.locator('[id="customer.ssn"]');
    this.usernameInput = page.locator('[id="customer.username"]');
    this.passwordInput = page.locator('[id="customer.password"]');
    this.confirmPasswordInput = page.locator('#repeatedPassword');
    this.registerButton = page.getByRole('button', { name: 'Register', exact: true });
    // Validation messages are plain spans with no role, rendered next to each input as <input id>.errors
    this.errorMessages = page.locator('#customerForm span.error');
    this.phoneNumberError = page.locator('[id="customer.phoneNumber.errors"]');
    this.confirmPasswordError = page.locator('[id="repeatedPassword.errors"]');
    this.welcomeHeading = page.getByRole('heading', { name: /^Welcome / });
    this.successMessage = page.getByText(
      'Your account was created successfully. You are now logged in.',
    );
    // Required fields in form order; Phone # is optional
    this.requiredFields = [
      { name: 'First Name', input: this.firstNameInput },
      { name: 'Last Name', input: this.lastNameInput },
      { name: 'Address', input: this.addressInput },
      { name: 'City', input: this.cityInput },
      { name: 'State', input: this.stateInput },
      { name: 'Zip Code', input: this.zipCodeInput },
      { name: 'SSN', input: this.ssnInput },
      { name: 'Username', input: this.usernameInput },
      { name: 'Password', input: this.passwordInput },
      { name: 'Confirm', input: this.confirmPasswordInput },
    ];
  }

  async fillForm(user: User) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.addressInput.fill(user.address.street);
    await this.cityInput.fill(user.address.city);
    await this.stateInput.fill(user.address.state);
    await this.zipCodeInput.fill(user.address.zipCode);
    await this.phoneInput.fill(user.phoneNumber);
    await this.ssnInput.fill(user.ssn);
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.password);
  }

  async register(user: User) {
    await this.fillForm(user);
    await this.registerButton.click();
  }

  async submitByEnter() {
    await this.confirmPasswordInput.press('Enter');
  }

  // Checks every non-password field; password fields are asserted by each test as they differ
  async expectFormValues(user: User) {
    await expect(this.firstNameInput).toHaveValue(user.firstName);
    await expect(this.lastNameInput).toHaveValue(user.lastName);
    await expect(this.addressInput).toHaveValue(user.address.street);
    await expect(this.cityInput).toHaveValue(user.address.city);
    await expect(this.stateInput).toHaveValue(user.address.state);
    await expect(this.zipCodeInput).toHaveValue(user.address.zipCode);
    await expect(this.phoneInput).toHaveValue(user.phoneNumber);
    await expect(this.ssnInput).toHaveValue(user.ssn);
    await expect(this.usernameInput).toHaveValue(user.username);
  }
}
