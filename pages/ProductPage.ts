import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** A single product's detail page (inventory-item.html?id=…). */
export class ProductPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.price = page.getByTestId('inventory-item-price');
    this.backButton = page.getByTestId('back-to-products');
  }

  async backToProducts() {
    await this.backButton.click();
  }
}
