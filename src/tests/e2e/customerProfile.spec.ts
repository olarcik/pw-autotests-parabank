import { test, expect, qase } from '@src/tests/baseTest';
import { generateCustomer } from '@src/common/domains/customer/data';
import { PAGE_TITLES, UPDATE_PROFILE_ERRORS } from '@src/common/data/testData';

// registeredCustomer registers through the request context, so each test logs in through the form.
// The welcome text keeps the old name until the next login, so it is not checked after an update
test.describe('Customer profile', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.open();
  });

  test('Contact info can be updated', async ({
    page,
    mainPage,
    accountsOverviewPage,
    updateProfilePage,
    registeredCustomer,
  }) => {
    qase.id(28);
    qase.fields({ severity: 'critical', priority: 'high', layer: 'e2e' });

    const newData = generateCustomer();

    await test.step('Log in as a registered customer', async () => {
      await mainPage.login(registeredCustomer.data);
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
      await expect(accountsOverviewPage.accountsOverviewHeading).toBeVisible();
    });

    await test.step('Open "Update Contact Info"', async () => {
      await mainPage.openUpdateContactInfo();
      await expect(page).toHaveTitle(PAGE_TITLES.updateProfile);
      await expect(updateProfilePage.heading).toBeVisible();
      await updateProfilePage.expectFormValues(registeredCustomer.data);
    });

    await test.step('Change all fields and click "Update Profile"', async () => {
      await updateProfilePage.fillForm(newData);
      await updateProfilePage.submit();
      await expect(updateProfilePage.profileUpdatedHeading).toBeVisible();
      await expect(updateProfilePage.successMessage).toBeVisible();
      await expect(page).toHaveTitle(PAGE_TITLES.updateProfile);
    });

    await test.step('Open "Update Contact Info" again', async () => {
      await mainPage.openUpdateContactInfo();
      await expect(updateProfilePage.heading).toBeVisible();
      await updateProfilePage.expectFormValues(newData);
    });
  });

  test('Empty required fields show errors', async ({
    page,
    mainPage,
    accountsOverviewPage,
    updateProfilePage,
    registeredCustomer,
  }) => {
    qase.id(29);
    qase.fields({ severity: 'normal', priority: 'medium', layer: 'e2e' });

    await test.step('Log in as a registered customer', async () => {
      await mainPage.login(registeredCustomer.data);
      await expect(page).toHaveTitle(PAGE_TITLES.accountsOverview);
      await expect(accountsOverviewPage.accountsOverviewHeading).toBeVisible();
    });

    await test.step('Open "Update Contact Info"', async () => {
      await mainPage.openUpdateContactInfo();
      await expect(updateProfilePage.heading).toBeVisible();
      await updateProfilePage.expectFormValues(registeredCustomer.data);
    });

    await test.step('Clear all required fields and click "Update Profile"', async () => {
      await updateProfilePage.clearRequiredFields();
      await updateProfilePage.submit();
      await expect(updateProfilePage.heading).toBeVisible();
      await expect(updateProfilePage.profileUpdatedHeading).toBeHidden();
    });

    await test.step('Check validation messages (Phone # has none)', async () => {
      await expect(updateProfilePage.errorMessages).toHaveText(
        updateProfilePage.requiredFields.map(({ name }) => UPDATE_PROFILE_ERRORS.required[name]),
      );
    });

    await test.step('Open "Update Contact Info" again: the data is unchanged', async () => {
      await mainPage.openUpdateContactInfo();
      await expect(updateProfilePage.heading).toBeVisible();
      await updateProfilePage.expectFormValues(registeredCustomer.data);
    });
  });
});
