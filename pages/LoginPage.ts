import { Locator, Page } from '@playwright/test';
import { PASSWORD, USERS } from '../test-data/shop';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;
  readonly errorCloseButton: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.error = page.getByTestId('error');
    this.errorCloseButton = page.getByTestId('error-button');
  }

  async goto() {
    // The form is usable at DOMContentLoaded; don't wait for every third-party asset.
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  /** Fill the form and submit. No assumption about the outcome – use for negative cases too. */
  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  /** Shortcut for tests whose subject is not login: log in with a valid account and wait for Products. */
  async loginAs(username: string = USERS.standard) {
    await this.goto();
    await this.login(username, PASSWORD);
    await this.page.waitForURL(/\/inventory\.html$/);
  }
}
