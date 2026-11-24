import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Product } from '../test-data/shop';
import { money } from '../utils/money';

/** "Checkout: Overview" (checkout-step-two.html). */
export class CheckoutOverviewPage extends BasePage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  priceOf(product: Product): Locator {
    return this.items.filter({ hasText: product.name }).getByTestId('inventory-item-price');
  }

  async getItemPrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(money);
  }

  async getTotals(): Promise<{ subtotal: number; tax: number; total: number }> {
    return {
      subtotal: money(await this.subtotalLabel.innerText()),
      tax: money(await this.taxLabel.innerText()),
      total: money(await this.totalLabel.innerText()),
    };
  }

  async finish() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
