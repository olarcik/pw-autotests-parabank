import { test, expect, qase } from '../baseTest';
import { generateUser } from '../../common/domains/customer/data';
import {
  ACCOUNT_SERVICES,
  CASE_MISMATCHED_PASSWORDS,
  NEW_CUSTOMER_BALANCE,
  PAGE_TITLES,
  REGISTER_ERRORS,
} from '../../common/data/test';

test.describe('Registration', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.open();
  });

  test('Open Register page from Home page', async ({ page, mainPage, registerPage }) => {
    qase.id(1);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });

    await test.step('Click the "Register" link in the left panel of the Home page', async () => {
      await mainPage.openRegisterPage();
      await expect(page).toHaveURL(/register\.htm/);
      await expect(page).toHaveTitle(PAGE_TITLES.register);
    });

    await test.step('Check the page content', async () => {
      await expect(registerPage.heading).toBeVisible();
      await expect(registerPage.introText).toBeVisible();
    });
  });

  test('Register form shows all fields', async ({ mainPage, registerPage }) => {
    qase.id(2);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });

    await test.step('Open the Register page', async () => {
      await mainPage.openRegisterPage();
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

  test('Password and Confirm fields mask input', async ({ mainPage, registerPage }) => {
    qase.id(3);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page', async () => {
      await mainPage.openRegisterPage();
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

  test('Successful registration with valid data', async ({ page, mainPage, registerPage }) => {
    qase.id(4);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page', async () => {
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Fill in all fields with valid data', async () => {
      await registerPage.fillForm(user);
      await registerPage.expectFormValues(user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(user.password);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(PAGE_TITLES.customerCreated);
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
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.register(user);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toBeVisible();
    });

    await test.step('Click "Log Out"', async () => {
      await mainPage.logout();
      await expect(page).toHaveTitle(PAGE_TITLES.home);
      await expect(mainPage.loginHeading).toBeVisible();
      await expect(mainPage.loginButton).toBeVisible();
    });

    await test.step('Log in with the new username and password', async () => {
      await mainPage.login(user);
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
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
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.register(user);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
      await expect(registerPage.successMessage).toBeVisible();
    });

    await test.step('Open "Accounts Overview"', async () => {
      await mainPage.openAccountsOverview();
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
      await expect(mainPage.accountRows).toHaveCount(1);
    });

    await test.step('Check the account balance', async () => {
      // Cells: account number, Balance, Available Amount
      await expect(mainPage.accountRows.getByRole('cell')).toHaveText([
        /^\d+$/,
        NEW_CUSTOMER_BALANCE,
        NEW_CUSTOMER_BALANCE,
      ]);
      await expect(mainPage.accountsTotalRow.getByRole('cell').nth(1)).toHaveText(
        NEW_CUSTOMER_BALANCE,
      );
    });
  });

  test('Empty form shows all required-field errors', async ({ page, mainPage, registerPage }) => {
    qase.id(7);
    qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });

    await test.step('Open the Register page', async () => {
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step('Click "Register" without filling any field', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(PAGE_TITLES.register);
      await expect(registerPage.heading).toBeVisible();
      await expect(mainPage.loginHeading).toBeVisible();
    });

    await test.step('Check validation messages', async () => {
      await expect(registerPage.errorMessages).toHaveText(
        registerPage.requiredFields.map(({ name }) => REGISTER_ERRORS.required[name]),
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
    // 10 full Home -> Register -> submit cycles in one test don't fit the default timeout
    test.slow();

    for (const { name, input } of registerPage.requiredFields) {
      await test.step(`Leave ${name} empty and submit`, async () => {
        await mainPage.open();
        await mainPage.openRegisterPage();
        await expect(registerPage.heading).toBeVisible();
        await registerPage.fillForm(generateUser());
        await input.clear();
        await registerPage.registerButton.click();
        await expect(page).toHaveTitle(PAGE_TITLES.register);
        await expect(mainPage.loginHeading).toBeVisible();
        await expect(registerPage.errorMessages).toHaveText([REGISTER_ERRORS.required[name]]);
      });
    }
  });

  test('Entered values are kept after failed submit', async ({ page, mainPage, registerPage }) => {
    qase.id(9);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();
    const mismatchedPassword = generateUser().password;

    await test.step('Open the Register page and fill all fields with valid data, but enter a different value in Confirm', async () => {
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.fillForm(user);
      await registerPage.confirmPasswordInput.fill(mismatchedPassword);
      await registerPage.expectFormValues(user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(mismatchedPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(page).toHaveTitle(PAGE_TITLES.register);
      await expect(registerPage.errorMessages).toHaveText([REGISTER_ERRORS.passwordsMismatch]);
    });

    await test.step('Check field values', async () => {
      await registerPage.expectFormValues(user);
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
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.fillForm(user);
      await registerPage.expectFormValues(user);
    });

    await test.step('Enter different values in Password and Confirm', async () => {
      await registerPage.passwordInput.fill(user.password);
      await registerPage.confirmPasswordInput.fill(mismatchedPassword);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(mismatchedPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(registerPage.confirmPasswordError).toHaveText(REGISTER_ERRORS.passwordsMismatch);
      await expect(page).toHaveTitle(PAGE_TITLES.register);
      await expect(mainPage.loginHeading).toBeVisible();
    });
  });

  test('Password confirmation is case-sensitive', async ({ page, mainPage, registerPage }) => {
    qase.id(11);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });
    const { password, confirmPassword } = CASE_MISMATCHED_PASSWORDS;
    const user = generateUser({ password });

    await test.step('Open the Register page and fill all fields with valid data', async () => {
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.fillForm(user);
      await registerPage.expectFormValues(user);
    });

    await test.step('Enter passwords that differ only in letter case', async () => {
      await registerPage.passwordInput.fill(password);
      await registerPage.confirmPasswordInput.fill(confirmPassword);
      await expect(registerPage.passwordInput).toHaveValue(password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(confirmPassword);
    });

    await test.step('Click "Register"', async () => {
      await registerPage.registerButton.click();
      await expect(registerPage.confirmPasswordError).toHaveText(REGISTER_ERRORS.passwordsMismatch);
      await expect(page).toHaveTitle(PAGE_TITLES.register);
      await expect(mainPage.loginHeading).toBeVisible();
    });
  });

  test('Enter key submits the Register form', async ({ page, mainPage, registerPage }) => {
    qase.id(12);
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const user = generateUser();

    await test.step('Open the Register page and fill all fields with valid data and a unique username', async () => {
      await mainPage.openRegisterPage();
      await expect(registerPage.heading).toBeVisible();
      await registerPage.fillForm(user);
      await registerPage.expectFormValues(user);
      await expect(registerPage.passwordInput).toHaveValue(user.password);
      await expect(registerPage.confirmPasswordInput).toHaveValue(user.password);
    });

    await test.step('Focus the Confirm field and press Enter', async () => {
      await registerPage.submitByEnter();
      await expect(page).toHaveTitle(PAGE_TITLES.customerCreated);
      await expect(registerPage.welcomeHeading).toHaveText(`Welcome ${user.username}`);
    });
  });
});
