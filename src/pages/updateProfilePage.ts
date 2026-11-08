import { expect, Locator, Page } from '@playwright/test';
import { Customer } from '@src/common/domains/customer/interfaces';

// "Update Contact Info" in the left panel (updateprofile.htm). The form is filled by a REST request
// after the page loads, so tests wait for expectFormValues before changing fields
export class UpdateProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly updateProfileButton: Locator;
  readonly errorMessages: Locator;
  readonly profileUpdatedHeading: Locator;
  readonly successMessage: Locator;
  readonly requiredFields: { name: string; input: Locator }[];

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Update Profile', exact: true });
    // Form labels are plain table cells not linked to the inputs, so getByLabel can't find them — use input ids
    this.firstNameInput = page.locator('[id="customer.firstName"]');
    this.lastNameInput = page.locator('[id="customer.lastName"]');
    this.addressInput = page.locator('[id="customer.address.street"]');
    this.cityInput = page.locator('[id="customer.address.city"]');
    this.stateInput = page.locator('[id="customer.address.state"]');
    this.zipCodeInput = page.locator('[id="customer.address.zipCode"]');
    this.phoneInput = page.locator('[id="customer.phoneNumber"]');
    this.updateProfileButton = page.getByRole('button', { name: 'Update Profile', exact: true });
    // Validation messages are plain spans with no role, always in the page and shown by the client-side
    // check; only the shown ones count
    this.errorMessages = page.locator('form[name="contact"] span.error:visible');
    this.profileUpdatedHeading = page.getByRole('heading', {
      name: 'Profile Updated',
      exact: true,
    });
    this.successMessage = page.getByText(
      'Your updated address and phone number have been added to the system.',
    );
    // Required fields in form order; Phone # is optional
    this.requiredFields = [
      { name: 'First Name', input: this.firstNameInput },
      { name: 'Last Name', input: this.lastNameInput },
      { name: 'Address', input: this.addressInput },
      { name: 'City', input: this.cityInput },
      { name: 'State', input: this.stateInput },
      { name: 'Zip Code', input: this.zipCodeInput },
    ];
  }

  async fillForm(customer: Customer) {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.addressInput.fill(customer.address.street);
    await this.cityInput.fill(customer.address.city);
    await this.stateInput.fill(customer.address.state);
    await this.zipCodeInput.fill(customer.address.zipCode);
    await this.phoneInput.fill(customer.phoneNumber);
  }

  async clearRequiredFields() {
    for (const { input } of this.requiredFields) {
      await input.clear();
    }
  }

  async submit() {
    await this.updateProfileButton.click();
  }

  // Checks every field of the form (it has no SSN, username or password)
  async expectFormValues(customer: Customer) {
    await expect(this.firstNameInput).toHaveValue(customer.firstName);
    await expect(this.lastNameInput).toHaveValue(customer.lastName);
    await expect(this.addressInput).toHaveValue(customer.address.street);
    await expect(this.cityInput).toHaveValue(customer.address.city);
    await expect(this.stateInput).toHaveValue(customer.address.state);
    await expect(this.zipCodeInput).toHaveValue(customer.address.zipCode);
    await expect(this.phoneInput).toHaveValue(customer.phoneNumber);
  }
}
