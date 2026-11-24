import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CustomerInfo } from '../test-data/shop';

/** "Checkout: Your Information" (checkout-step-one.html). */
export class CheckoutInfoPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.error = page.getByTestId('error');
  }

  async fill(info: CustomerInfo) {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
  }

  /** Fill the form and press Continue. */
  async submit(info: CustomerInfo) {
    await this.fill(info);
    await this.continueButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
