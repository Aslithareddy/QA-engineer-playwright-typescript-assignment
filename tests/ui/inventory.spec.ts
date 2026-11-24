import { test, expect } from '../../fixtures/pages';
import { PRODUCTS, USERS } from '../../test-data/shop';

// Extra coverage beyond the required journey (login, cart, checkout, logout).

test.describe('Inventory', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs();
  });

  test('every product has a name, description, price and image', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(6);

    for (const item of await inventoryPage.items.all()) {
      await expect(item.getByTestId('inventory-item-name')).not.toBeEmpty();
      await expect(item.getByTestId('inventory-item-desc')).not.toBeEmpty();
      await expect(item.getByTestId('inventory-item-price')).toHaveText(/^\$\d+\.\d{2}$/);
      await expect(item.locator('img')).toHaveAttribute('src', /\.jpg$/);
    }
  });

  test('sort by price low to high', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sort by name Z to A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');

    const names = await inventoryPage.getNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('product detail page matches the listing', async ({ page, inventoryPage, productPage }) => {
    const listedPrice = await inventoryPage.priceOf(PRODUCTS.bikeLight);

    await inventoryPage.openProduct(PRODUCTS.bikeLight);

    await expect(page).toHaveURL(/inventory-item\.html\?id=\d+/);
    await expect(productPage.name).toHaveText(PRODUCTS.bikeLight.name);
    await expect(productPage.price).toHaveText(listedPrice);
  });
});

test.describe('Inventory – problem_user defects', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs(USERS.problem);
  });

  // bug-reports/bugs.md: BUG-07
  test('BUG-07: each product shows its own image', async ({ inventoryPage }) => {
    test.fail(true, 'Known defect BUG-07 – every product shows the same image');

    const srcs = await inventoryPage.getImageSources();
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  // bug-reports/bugs.md: BUG-08
  test('BUG-08: sort by price low to high works', async ({ inventoryPage }) => {
    test.fail(true, 'Known defect BUG-08 – sort has no effect');

    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});
