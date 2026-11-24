import { test, expect } from '../../fixtures/pages';
import { CUSTOMER, PRODUCTS, USERS } from '../../test-data/shop';

// TC-xx ids refer to the priority-ordered cases in test-plan/checkout-test-plan.md

const { backpack, bikeLight, fleeceJacket, onesie } = PRODUCTS;

test.describe('Checkout – positive', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs();
  });

  test('TC-01: order completes and the cart is emptied', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addToCart(backpack, bikeLight);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    await checkoutOverviewPage.finish();

    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(checkoutCompletePage.header).toHaveText('Thank you for your order!');
    await expect(checkoutCompletePage.cartBadge).toBeHidden();

    await checkoutCompletePage.backHome();
    await expect(page).toHaveURL(/inventory\.html$/);
  });

  test('TC-02: subtotal, 8% tax and total are calculated correctly', async ({
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
  }) => {
    await inventoryPage.addToCart(backpack, fleeceJacket, onesie);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    const prices = await checkoutOverviewPage.getItemPrices();
    const { subtotal, tax, total } = await checkoutOverviewPage.getTotals();

    const expectedSubtotal = prices.reduce((a, b) => a + b, 0);
    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(tax).toBeCloseTo(Math.round(expectedSubtotal * 0.08 * 100) / 100, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);
  });

  test('TC-05: overview shows exactly the cart items with the same prices', async ({
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
  }) => {
    const listedPrice = await inventoryPage.priceOf(bikeLight);

    await inventoryPage.addToCart(bikeLight, onesie);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    await expect(checkoutOverviewPage.itemNames).toHaveText([bikeLight.name, onesie.name]);
    await expect(checkoutOverviewPage.priceOf(bikeLight)).toHaveText(listedPrice);
  });
});

test.describe('Checkout – negative', () => {
  test.beforeEach(async ({ page, loginPage, inventoryPage, cartPage }) => {
    await loginPage.loginAs();
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
  });

  const missingField = [
    { field: 'First Name', info: { ...CUSTOMER, firstName: '' } },
    { field: 'Last Name', info: { ...CUSTOMER, lastName: '' } },
    { field: 'Postal Code', info: { ...CUSTOMER, postalCode: '' } },
  ];

  for (const c of missingField) {
    test(`TC-03: missing ${c.field} is rejected`, async ({ page, checkoutInfoPage }) => {
      await checkoutInfoPage.submit(c.info);

      await expect(checkoutInfoPage.error).toHaveText(`Error: ${c.field} is required`);
      await expect(page).toHaveURL(/checkout-step-one\.html$/);
    });
  }

  test('TC-08: Cancel on Your Information goes back to the cart with items kept', async ({
    page,
    checkoutInfoPage,
    cartPage,
  }) => {
    await checkoutInfoPage.cancel();

    await expect(page).toHaveURL(/cart\.html$/);
    await expect(cartPage.items).toHaveCount(1);
  });

  test('TC-08: Cancel on Overview goes back to Products with the cart kept', async ({
    page,
    checkoutInfoPage,
    checkoutOverviewPage,
  }) => {
    await checkoutInfoPage.submit(CUSTOMER);

    await checkoutOverviewPage.cancel();

    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(checkoutOverviewPage.cartBadge).toHaveText('1');
  });
});

test.describe('Checkout – edge cases', () => {
  test('accented and hyphenated names are accepted', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
  }) => {
    await loginPage.loginAs();
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutInfoPage.submit({ firstName: 'José', lastName: "O'Brien-Núñez", postalCode: 'SW1A 1AA' });

    await expect(page).toHaveURL(/checkout-step-two\.html$/);
  });

  // bug-reports/bugs.md: BUG-01
  test('TC-04 / BUG-01: checkout is blocked when the cart is empty', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
  }) => {
    test.fail(true, 'Known defect BUG-01 – an empty cart can be checked out');
    await loginPage.loginAs();
    await inventoryPage.openCart();
    await expect(cartPage.items).toHaveCount(0);

    await cartPage.checkout();

    await expect(page).toHaveURL(/cart\.html$/);
  });

  // bug-reports/bugs.md: BUG-02
  test('TC-07 / BUG-02: whitespace-only details are rejected', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
  }) => {
    test.fail(true, 'Known defect BUG-02 – spaces pass validation');
    await loginPage.loginAs();
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutInfoPage.submit({ firstName: ' ', lastName: ' ', postalCode: ' ' });

    await expect(checkoutInfoPage.error).toBeVisible();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
  });
});

test.describe('Checkout – other test accounts (TC-09)', () => {
  // bug-reports/bugs.md: BUG-05
  test('BUG-05: problem_user can type a last name', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
  }) => {
    test.fail(true, 'Known defect BUG-05 – Last Name input overwrites First Name');
    await loginPage.loginAs(USERS.problem);
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutInfoPage.fill(CUSTOMER);

    await expect(checkoutInfoPage.firstName).toHaveValue(CUSTOMER.firstName);
    await expect(checkoutInfoPage.lastName).toHaveValue(CUSTOMER.lastName);
  });

  // bug-reports/bugs.md: BUG-06
  test('BUG-06: error_user can finish an order', async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
  }) => {
    test.fail(true, 'Known defect BUG-06 – Finish throws a JS error and does nothing');
    await loginPage.loginAs(USERS.error);
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();
    await checkoutInfoPage.submit(CUSTOMER);

    await checkoutOverviewPage.finish();

    await expect(page).toHaveURL(/checkout-complete\.html$/);
  });
});
