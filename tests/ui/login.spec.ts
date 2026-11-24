import { test, expect } from '../../fixtures/pages';
import { ERRORS, PASSWORD, USERS } from '../../test-data/shop';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Login – positive', () => {
  test('standard_user logs in and lands on Products', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard, PASSWORD);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(6);
  });
});

test.describe('Login – negative', () => {
  test('wrong password is rejected', async ({ page, loginPage }) => {
    await loginPage.login(USERS.standard, 'wrong_password');

    await expect(loginPage.error).toHaveText(ERRORS.wrongCredentials);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('locked_out_user is blocked with a clear message', async ({ page, loginPage }) => {
    await loginPage.login(USERS.lockedOut, PASSWORD);

    await expect(loginPage.error).toHaveText(ERRORS.lockedOut);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('empty username shows "Username is required"', async ({ loginPage }) => {
    await loginPage.login('', PASSWORD);
    await expect(loginPage.error).toHaveText(ERRORS.usernameRequired);
  });

  test('empty password shows "Password is required"', async ({ loginPage }) => {
    await loginPage.login(USERS.standard, '');
    await expect(loginPage.error).toHaveText(ERRORS.passwordRequired);
  });

  test('opening a protected page without logging in is blocked', async ({ loginPage, inventoryPage }) => {
    await inventoryPage.goto();

    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.error).toContainText(
      "You can only access '/inventory.html' when you are logged in.",
    );
  });
});

test.describe('Login – edge cases', () => {
  test('both fields empty reports the username first', async ({ loginPage }) => {
    await loginPage.login('', '');
    await expect(loginPage.error).toHaveText(ERRORS.usernameRequired);
  });

  test('username is case-sensitive', async ({ loginPage }) => {
    await loginPage.login(USERS.standard.toUpperCase(), PASSWORD);
    await expect(loginPage.error).toHaveText(ERRORS.wrongCredentials);
  });

  test('username with surrounding spaces is not trimmed', async ({ loginPage }) => {
    await loginPage.login(`  ${USERS.standard}  `, PASSWORD);
    await expect(loginPage.error).toHaveText(ERRORS.wrongCredentials);
  });

  test('SQL-injection style input is rejected safely', async ({ page, loginPage }) => {
    await loginPage.login("' OR '1'='1", "' OR '1'='1");

    await expect(loginPage.error).toHaveText(ERRORS.wrongCredentials);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('error message can be dismissed and error styling clears', async ({ loginPage }) => {
    // The field always has class "input_error"; the extra "error" class marks the error state.
    const errorClass = /(^|\s)error(\s|$)/;
    await loginPage.login('', '');
    await expect(loginPage.username).toHaveClass(errorClass);

    await loginPage.errorCloseButton.click();

    await expect(loginPage.error).toBeHidden();
    await expect(loginPage.username).not.toHaveClass(errorClass);
  });
});
