import { test, expect, qase } from '../baseTest';

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
});
