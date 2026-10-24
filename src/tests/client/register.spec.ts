import { test, expect, qase } from '../baseTest';
import { generateUser } from '../../common/domains/user/data';
import { RegisterPage } from '../../pages/client/registerPage';
import type { Locator } from '@playwright/test';

type RegisterLocator = {
  [Key in keyof RegisterPage]: RegisterPage[Key] extends Locator ? Key : never;
}[keyof RegisterPage];

const REGISTER_PAGE_TITLE = 'ParaBank | Register for Free Online Account Access';

// Required fields in form order with their validation messages; Phone # is optional
const REQUIRED_FIELDS: { field: string; input: RegisterLocator; error: string }[] = [
  { field: 'First Name', input: 'firstNameInput', error: 'First name is required.' },
  { field: 'Last Name', input: 'lastNameInput', error: 'Last name is required.' },
  { field: 'Address', input: 'addressInput', error: 'Address is required.' },
  { field: 'City', input: 'cityInput', error: 'City is required.' },
  { field: 'State', input: 'stateInput', error: 'State is required.' },
  { field: 'Zip Code', input: 'zipCodeInput', error: 'Zip Code is required.' },
  { field: 'SSN', input: 'ssnInput', error: 'Social Security Number is required.' },
  { field: 'Username', input: 'usernameInput', error: 'Username is required.' },
  { field: 'Password', input: 'passwordInput', error: 'Password is required.' },
  { field: 'Confirm', input: 'confirmPasswordInput', error: 'Password confirmation is required.' },
];

test.describe('Registration', () => {
  test('Open Register page from Home page', async ({ page, mainPage, registerPage }) => {
    qase.id(1);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });

    await mainPage.open();

    await test.step('Click the "Register" link in the left panel of the Home page', async () => {
      await mainPage.openRegisterPage();
      await expect(page).toHaveURL(/register\.htm/);
      await expect(page).toHaveTitle('ParaBank | Register for Free Online Account Access');
    });

    await test.step('Check the page content', async () => {
      await expect(registerPage.heading).toBeVisible();
      await expect(registerPage.introText).toBeVisible();
    });
  });

  test('Register form shows all fields', async ({ registerPage }) => {
    qase.id(2);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });

    await test.step('Open the Register page', async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Check the form fields', async () => {
      for (const input of [
        registerPage.firstNameInput,
        registerPage.lastNameInput,
        registerPage.addressInput,
        registerPage.cityInput,
        registerPage.stateInput,
        registerPage.zipCodeInput,
        registerPage.phoneInput,
        registerPage.ssnInput,
        registerPage.usernameInput,
        registerPage.passwordInput,
        registerPage.confirmPasswordInput,
      ]) {
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
      }
    });

    await test.step('Check the submit button', async () => {
      await expect(registerPage.registerButton).toBeVisible();
      await expect(registerPage.registerButton).toBeEnabled();
    });
  });

  test('Password and Confirm fields mask input', async ({ registerPage }) => {
    qase.id(3);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page', async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Type any text into Password and Confirm', async () => {
      await registerPage.passwordInput.fill(user.password);
      await registerPage.confirmPasswordInput.fill(user.password);
      await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
      await expect(registerPage.confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    await test.step('Type any text into another field, e.g. First Name', async () => {
      await registerPage.firstNameInput.fill(user.firstName);
      await expect(registerPage.firstNameInput).toHaveAttribute('type', 'text');
      await expect(registerPage.firstNameInput).toHaveValue(user.firstName);
    });
  });

  test('Empty form shows all required-field errors', async ({ page, mainPage, registerPage }) => {
    qase.id(7);
    qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });

    await test.step('Open the Register page', async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Click "Register" without filling any field', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(REGISTER_PAGE_TITLE);
      await expect(registerPage.heading).toBeVisible();
      await expect(mainPage.loginHeading).toBeVisible();
    });

    await test.step('Check validation messages', async () => {
      await expect(registerPage.errorMessages).toHaveText(
        REQUIRED_FIELDS.map(({ error }) => error),
      );
    });

    await test.step('Check Phone # field', async () => {
      await expect(registerPage.phoneNumberError).toBeHidden();
    });
  });

  test('Single missing required field shows only its error', async ({
    page,
    mainPage,
    registerPage,
  }) => {
    qase.id(8);
    qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });

    for (const { field, input, error } of REQUIRED_FIELDS) {
      await test.step(`Leave ${field} empty and submit`, async () => {
        await registerPage.open();
        await registerPage.fillForm(generateUser());
        await registerPage[input].clear();
        await registerPage.registerButton.click();
        await expect(page).toHaveTitle(REGISTER_PAGE_TITLE);
        await expect(mainPage.loginHeading).toBeVisible();
        await expect(registerPage.errorMessages).toHaveText([error]);
      });
    }
  });
});
