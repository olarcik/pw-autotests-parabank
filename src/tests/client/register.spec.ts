import { test, expect, qase } from '../baseTest';
import { generateUser } from '../../common/domains/user/data';
import { RegisterPage } from '../../pages/client/registerPage';
import { User } from '../../common/interfaces/interface';
import type { Locator } from '@playwright/test';

type RegisterLocator = {
  [Key in keyof RegisterPage]: RegisterPage[Key] extends Locator ? Key : never;
}[keyof RegisterPage];

const REGISTER_PAGE_TITLE = 'ParaBank | Register for Free Online Account Access';
const CUSTOMER_CREATED_TITLE = 'ParaBank | Customer Created';
const ACCOUNT_SERVICES = [
  'Open New Account',
  'Accounts Overview',
  'Transfer Funds',
  'Bill Pay',
  'Find Transactions',
  'Update Contact Info',
  'Request Loan',
  'Log Out',
];

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

// Checks every non-password field; password fields are asserted by each test as they differ
const expectFormToKeepUserData = async (registerPage: RegisterPage, user: User) => {
  await expect(registerPage.firstNameInput).toHaveValue(user.firstName);
  await expect(registerPage.lastNameInput).toHaveValue(user.lastName);
  await expect(registerPage.addressInput).toHaveValue(user.address.street);
  await expect(registerPage.cityInput).toHaveValue(user.address.city);
  await expect(registerPage.stateInput).toHaveValue(user.address.state);
  await expect(registerPage.zipCodeInput).toHaveValue(user.address.zipCode);
  await expect(registerPage.phoneInput).toHaveValue(user.phoneNumber);
  await expect(registerPage.ssnInput).toHaveValue(user.ssn);
  await expect(registerPage.usernameInput).toHaveValue(user.username);
};

const swapCase = (value: string) =>
  [...value]
    .map((char) => (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()))
    .join('');

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

  test('Entered values are kept after failed submit', async ({ page, registerPage }) => {
    qase.id(9);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();
    const mismatchedPassword = generateUser().password;

    await test.step('Open the Register page and fill all fields with valid data, but enter a different value in Confirm', async () => {
      await registerPage.open();
      await registerPage.fillForm(user);
      await registerPage.confirmPasswordInput.fill(mismatchedPassword);
      await expectFormToKeepUserData(registerPage, user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(mismatchedPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(REGISTER_PAGE_TITLE);
      await expect(registerPage.errorMessages).toHaveText(['Passwords did not match.']);
    });

    await test.step('Check field values', async () => {
      await expectFormToKeepUserData(registerPage, user);
      await expect(registerPage.passwordInput).toBeEmpty();
      await expect(registerPage.confirmPasswordInput).toBeEmpty();
    });
  });

  test('Mismatched passwords show error', async ({ page, mainPage, registerPage }) => {
    qase.id(10);
    qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    const user = generateUser();
    const mismatchedPassword = generateUser().password;

    await test.step('Open the Register page and fill all fields with valid data', async () => {
      await registerPage.open();
      await registerPage.fillForm(user);
      await expectFormToKeepUserData(registerPage, user);
    });

    await test.step('Enter different values in Password and Confirm', async () => {
      await registerPage.passwordInput.fill(user.password);
      await registerPage.confirmPasswordInput.fill(mismatchedPassword);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(mismatchedPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(registerPage.confirmPasswordError).toHaveText('Passwords did not match.');
      await expect(page).toHaveTitle(REGISTER_PAGE_TITLE);
      await expect(mainPage.loginHeading).toBeVisible();
    });
  });

  test('Password confirmation is case-sensitive', async ({ page, mainPage, registerPage }) => {
    qase.id(11);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    const user = generateUser();
    // The prefix guarantees letters, so the case-swapped confirmation always differs
    const password = `Pw${user.password}`;
    const confirmPassword = swapCase(password);

    await test.step('Open the Register page and fill all fields with valid data', async () => {
      await registerPage.open();
      await registerPage.fillForm(user);
      await expectFormToKeepUserData(registerPage, user);
    });

    await test.step('Enter passwords that differ only in letter case', async () => {
      await registerPage.passwordInput.fill(password);
      await registerPage.confirmPasswordInput.fill(confirmPassword);
      await expect(registerPage.passwordInput).toHaveValue(password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(confirmPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(registerPage.confirmPasswordError).toHaveText('Passwords did not match.');
      await expect(page).toHaveTitle(REGISTER_PAGE_TITLE);
      await expect(mainPage.loginHeading).toBeVisible();
    });
  });

  test('Successful registration with valid data', async ({ page, mainPage, registerPage }) => {
    qase.id(4);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page', async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Fill in all fields with valid data', async () => {
      await registerPage.fillForm(user);
      await expectFormToKeepUserData(registerPage, user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(user.password);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(CUSTOMER_CREATED_TITLE);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toBeVisible();
    });

    await test.step('Check the left panel', async () => {
      await expect(mainPage.customerWelcome).toHaveText(
        `Welcome ${user.firstName} ${user.lastName}`,
      );
      await expect(mainPage.accountServicesHeading).toBeVisible();
      await expect(mainPage.accountServicesLinks).toHaveText(ACCOUNT_SERVICES);
    });
  });

  test('Registered user can log in', async ({ page, mainPage, registerPage }) => {
    qase.id(5);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    const user = generateUser();

    await test.step('Register a new user with valid data and a unique username', async () => {
      await registerPage.open();
      await registerPage.register(user);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toBeVisible();
    });

    await test.step('Click "Log Out"', async () => {
      await mainPage.logout();
      await expect(page).toHaveTitle('ParaBank | Welcome | Online Banking');
      await expect(mainPage.loginHeading).toBeVisible();
      await expect(mainPage.loginButton).toBeVisible();
    });

    await test.step('Log in with the new username and password', async () => {
      await mainPage.login(user);
      await expect(page).toHaveTitle('ParaBank | Accounts Overview');
      await expect(mainPage.accountsOverviewHeading).toBeVisible();
      await expect(mainPage.customerWelcome).toHaveText(
        `Welcome ${user.firstName} ${user.lastName}`,
      );
    });
  });

  test('New customer gets a default account', async ({ page, mainPage, registerPage }) => {
    qase.id(6);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    const user = generateUser();

    await test.step('Register a new user with valid data and a unique username', async () => {
      await registerPage.open();
      await registerPage.register(user);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toBeVisible();
    });

    await test.step('Open "Accounts Overview"', async () => {
      await mainPage.openAccountsOverview();
      await expect(page).toHaveTitle('ParaBank | Accounts Overview');
      await expect(mainPage.accountRows).toHaveCount(1);
    });

    await test.step('Check the account balance', async () => {
      // Cells: account number, Balance, Available Amount
      await expect(mainPage.accountRows.getByRole('cell')).toHaveText([
        /^\d+$/,
        '$515.50',
        '$515.50',
      ]);
      await expect(mainPage.accountsTotalRow.getByRole('cell').nth(1)).toHaveText('$515.50');
    });
  });

  test('Enter key submits the Register form', async ({ page, registerPage }) => {
    qase.id(12);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page and fill all fields with valid data and a unique username', async () => {
      await registerPage.open();
      await registerPage.fillForm(user);
      await expectFormToKeepUserData(registerPage, user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(user.password);
    });

    await test.step('Focus the Confirm field and press Enter', async () => {
      await registerPage.submitByEnter();
      await expect(page).toHaveTitle(CUSTOMER_CREATED_TITLE);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
    });
  });
});
