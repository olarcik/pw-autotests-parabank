import { test, expect, qase } from '@src/tests/baseTest';
import { generateCustomer } from '@src/common/domains/customer/data';
import { ACCOUNT_SERVICES, LOGIN_ERRORS, PAGE_TITLES } from '@src/common/data/testData';

test.describe('Login', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.open();
  });

  test('Login form is displayed on Home page', async ({ mainPage }) => {
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });

    await test.step('Check the login form', async () => {
      await expect(mainPage.loginHeading).toBeVisible();
      for (const input of [mainPage.loginUsernameInput, mainPage.loginPasswordInput]) {
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
      }
      await expect(mainPage.loginButton).toBeVisible();
      await expect(mainPage.loginButton).toBeEnabled();
    });

    await test.step('Check the links "Register" and "Forgot login info?"', async () => {
      // On the first visit the server appends ";jsessionid=..." to the links, so only the start is checked
      await expect(mainPage.registerLink).toBeVisible();
      await expect(mainPage.registerLink).toHaveAttribute('href', /^register\.htm/);
      await expect(mainPage.forgotLoginInfoLink).toBeVisible();
      await expect(mainPage.forgotLoginInfoLink).toHaveAttribute('href', /^lookup\.htm/);
    });
  });

  test('Password field masks input', async ({ mainPage }) => {
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const customer = generateCustomer();

    await test.step('Type any text into Password', async () => {
      await mainPage.loginPasswordInput.fill(customer.password);
      await expect(mainPage.loginPasswordInput).toHaveAttribute('type', 'password');
    });

    await test.step('Type any text into Username', async () => {
      await mainPage.loginUsernameInput.fill(customer.username);
      await expect(mainPage.loginUsernameInput).toHaveAttribute('type', 'text');
      await expect(mainPage.loginUsernameInput).toHaveValue(customer.username);
    });
  });

  test('Successful login with valid credentials', async ({
    page,
    mainPage,
    accountsOverviewPage,
    registeredCustomer,
  }) => {
    qase.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });
    const customer = registeredCustomer.data;

    await test.step('Log in with the username and password of a registered customer', async () => {
      await mainPage.login(customer);
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
      await expect(accountsOverviewPage.accountsOverviewHeading).toBeVisible();
    });

    await test.step('Check the left panel', async () => {
      await expect(mainPage.customerWelcome).toHaveText(
        `Welcome ${customer.firstName} ${customer.lastName}`,
      );
      await expect(mainPage.accountServicesHeading).toBeVisible();
      await expect(mainPage.accountServicesLinks).toHaveText(ACCOUNT_SERVICES);
      await expect(mainPage.loginHeading).toBeHidden();
      await expect(mainPage.loginUsernameInput).toBeHidden();
    });
  });

  test('Enter key submits the login form', async ({
    page,
    mainPage,
    accountsOverviewPage,
    registeredCustomer,
  }) => {
    qase.fields({ severity: 'minor', priority: 'low', layer: 'e2e' });
    const customer = registeredCustomer.data;

    await test.step('Fill in the username and password of a registered customer', async () => {
      await mainPage.fillLoginForm(customer);
      await expect(mainPage.loginUsernameInput).toHaveValue(customer.username);
      await expect(mainPage.loginPasswordInput).toHaveValue(customer.password);
    });

    await test.step('Press Enter in the Password field', async () => {
      await mainPage.submitLoginByEnter();
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
      await expect(accountsOverviewPage.accountsOverviewHeading).toBeVisible();
      await expect(mainPage.customerWelcome).toHaveText(
        `Welcome ${customer.firstName} ${customer.lastName}`,
      );
    });
  });

  // One test per combination of empty fields; the server rejects the form before looking up the user
  for (const { row, customer } of [
    { row: 'both empty', customer: generateCustomer({ username: '', password: '' }) },
    { row: 'only username filled', customer: generateCustomer({ password: '' }) },
    { row: 'only password filled', customer: generateCustomer({ username: '' }) },
  ]) {
    test(`Empty fields show error: ${row}`, async ({ page, mainPage }) => {
      qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
      // The results of this case differ in Qase by this parameter
      qase.parameters({ Fields: row });

      await test.step(`Leave fields empty (${row}) and click "Log In"`, async () => {
        await mainPage.login(customer);
        await expect(page).toHaveTitle(PAGE_TITLES.error);
        await expect(mainPage.errorHeading).toBeVisible();
        await expect(mainPage.errorMessage).toHaveText(LOGIN_ERRORS.empty);
        await expect(mainPage.loginHeading).toBeVisible();
        await expect(mainPage.loginButton).toBeVisible();
      });
    });
  }

  test('Wrong password shows error', async ({ page, mainPage, registeredCustomer }) => {
    qase.fields({ severity: 'major', priority: 'high', layer: 'e2e' });
    const customer = { ...registeredCustomer.data, password: generateCustomer().password };

    await test.step('Log in with a registered username and a wrong password', async () => {
      await mainPage.login(customer);
      await expect(page).toHaveTitle(PAGE_TITLES.error);
      await expect(mainPage.errorHeading).toBeVisible();
      await expect(mainPage.errorMessage).toHaveText(LOGIN_ERRORS.invalid);
    });

    await test.step('Check that the customer is not logged in', async () => {
      await expect(mainPage.loginHeading).toBeVisible();
      await expect(mainPage.loginButton).toBeVisible();
      await expect(mainPage.customerWelcome).toBeHidden();
    });
  });
});
