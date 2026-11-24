import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** "Checkout: Complete!" (checkout-complete.html). */
export class CheckoutCompletePage extends BasePage {
  readonly header: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByTestId('complete-header');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async backHome() {
    await this.backHomeButton.click();
  }
}
