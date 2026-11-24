import { test, expect } from '../../fixtures/pages';
import { PASSWORD, PRODUCTS, USERS } from '../../test-data/shop';

test.describe('Logout – positive', () => {
  test('logout returns to an empty login form', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.loginAs();

    await inventoryPage.logout();

    await expect(page).toHaveURL(/saucedemo\.com\/$/);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.username).toHaveValue('');
    await expect(loginPage.password).toHaveValue('');
  });
});

test.describe('Logout – negative', () => {
  test('protected pages are blocked after logout', async ({ loginPage, inventoryPage, cartPage }) => {
    await loginPage.loginAs();
    await inventoryPage.logout();

    await inventoryPage.goto();
    await expect(loginPage.error).toContainText('when you are logged in');

    await cartPage.goto();
    await expect(loginPage.error).toContainText('when you are logged in');
  });

  test('browser Back after logout does not show the shop', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.loginAs();
    await inventoryPage.logout();

    await page.goBack();

    await expect(loginPage.loginButton).toBeVisible();
    await expect(inventoryPage.items).toHaveCount(0);
  });
});

test.describe('Logout – edge cases', () => {
  // bug-reports/bugs.md: BUG-03
  test("BUG-03: the next user does not see the previous user's cart", async ({ loginPage, inventoryPage }) => {
    test.fail(true, 'Known defect BUG-03 – cart is kept in the browser after logout');
    await loginPage.loginAs(USERS.standard);
    await inventoryPage.addToCart(PRODUCTS.backpack);
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.logout();

    await loginPage.loginAs(USERS.visual);

    // Wait for the page to render, then use a positive check: a "hidden" check alone
    // can pass before the cart badge has been drawn.
    await expect(inventoryPage.items).toHaveCount(6);
    await expect(inventoryPage.addToCartButton(PRODUCTS.backpack)).toBeVisible();
    await expect(inventoryPage.cartBadge).toBeHidden();
  });

  test('logout in the middle of checkout, then log in again, lands on Products', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
  }) => {
    await loginPage.loginAs();
    await inventoryPage.addToCart(PRODUCTS.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);

    await checkoutInfoPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
    await loginPage.login(USERS.standard, PASSWORD);

    await expect(page).toHaveURL(/inventory\.html$/); // not dropped back into checkout
  });
});
