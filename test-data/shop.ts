/** Password shared by all Sauce Demo accounts (listed on its login page). */
export const PASSWORD = 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export interface Product {
  /** Slug used in Sauce Demo's data-test ids, e.g. "add-to-cart-<id>". */
  id: string;
  /** Name as shown on screen. */
  name: string;
}

export const PRODUCTS = {
  backpack: { id: 'sauce-labs-backpack', name: 'Sauce Labs Backpack' },
  bikeLight: { id: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light' },
  boltTShirt: { id: 'sauce-labs-bolt-t-shirt', name: 'Sauce Labs Bolt T-Shirt' },
  fleeceJacket: { id: 'sauce-labs-fleece-jacket', name: 'Sauce Labs Fleece Jacket' },
  onesie: { id: 'sauce-labs-onesie', name: 'Sauce Labs Onesie' },
  redTShirt: { id: 'test.allthethings()-t-shirt-(red)', name: 'Test.allTheThings() T-Shirt (Red)' },
} satisfies Record<string, Product>;

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS);

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const CUSTOMER: CustomerInfo = { firstName: 'Jane', lastName: 'Doe', postalCode: '560001' };

export const ERRORS = {
  wrongCredentials: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
} as const;
