import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Product } from '../test-data/shop';
import { money } from '../utils/money';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/** The "Products" page. */
export class InventoryPage extends BasePage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  item(product: Product): Locator {
    return this.items.filter({ hasText: product.name });
  }

  addToCartButton(product: Product): Locator {
    return this.page.getByTestId(`add-to-cart-${product.id}`);
  }

  removeButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.id}`);
  }

  async addToCart(...products: Product[]) {
    for (const product of products) {
      await this.addToCartButton(product).click();
    }
  }

  async sortBy(option: SortOption) {
    await this.sortDropdown.selectOption(option);
  }

  async priceOf(product: Product): Promise<string> {
    return this.item(product).getByTestId('inventory-item-price').innerText();
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async getPrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(money);
  }

  async getImageSources(): Promise<(string | null)[]> {
    return this.items.locator('img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src')));
  }

  async openProduct(product: Product) {
    await this.item(product).getByTestId('inventory-item-name').click();
  }
}
