import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Product } from '../test-data/shop';

/** "Your Cart". */
export class CartPage extends BasePage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  item(product: Product): Locator {
    return this.items.filter({ hasText: product.name });
  }

  priceOf(product: Product): Locator {
    return this.item(product).getByTestId('inventory-item-price');
  }

  quantityOf(product: Product): Locator {
    return this.item(product).getByTestId('item-quantity');
  }

  async remove(product: Product) {
    await this.page.getByTestId(`remove-${product.id}`).click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }
}
