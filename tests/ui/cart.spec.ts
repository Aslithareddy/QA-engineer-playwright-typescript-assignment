import { test, expect } from '../../fixtures/pages';
import { ALL_PRODUCTS, PRODUCTS } from '../../test-data/shop';

const { backpack, boltTShirt, fleeceJacket, onesie } = PRODUCTS;

test.beforeEach(async ({ loginPage }) => {
  await loginPage.loginAs();
});

test.describe('Cart – positive', () => {
  test('added items appear in the cart with matching name, price and quantity', async ({
    inventoryPage,
    cartPage,
  }) => {
    const listedPrice = await inventoryPage.priceOf(backpack);

    await inventoryPage.addToCart(backpack, boltTShirt);
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await inventoryPage.openCart();

    await expect(cartPage.itemNames).toHaveText([backpack.name, boltTShirt.name]);
    await expect(cartPage.priceOf(backpack)).toHaveText(listedPrice);
    await expect(cartPage.quantityOf(backpack)).toHaveText('1');
  });

  test('cart survives a page reload and Continue Shopping', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(fleeceJacket);
    await page.reload();
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.openCart();
    await cartPage.continueShopping();

    await expect(page).toHaveURL(/inventory\.html$/);
    await expect(inventoryPage.removeButton(fleeceJacket)).toBeVisible();
  });
});

test.describe('Cart – negative', () => {
  test('removing an item in the cart updates the list and badge', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(backpack, onesie);
    await inventoryPage.openCart();

    await cartPage.remove(backpack);

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.itemNames).toHaveText(onesie.name);
    await expect(cartPage.cartBadge).toHaveText('1');
  });

  test('removing the last item leaves an empty cart and no badge', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(backpack);
    await inventoryPage.openCart();

    await cartPage.remove(backpack);

    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.cartBadge).toBeHidden();
  });
});

test.describe('Cart – edge cases', () => {
  test('all 6 products can be in the cart at once', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(...ALL_PRODUCTS);
    await expect(inventoryPage.cartBadge).toHaveText('6');

    await inventoryPage.openCart();

    await expect(cartPage.items).toHaveCount(6);
  });

  // bug-reports/bugs.md: BUG-04
  test('BUG-04: Reset App State resets the Add/Remove buttons too', async ({ inventoryPage }) => {
    test.fail(true, 'Known defect BUG-04 – buttons still say "Remove" after reset');
    await inventoryPage.addToCart(backpack);

    await inventoryPage.resetAppState();

    await expect(inventoryPage.cartBadge).toBeHidden();
    await expect(inventoryPage.addToCartButton(backpack)).toBeVisible();
  });
});
