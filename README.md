# QA Engineer Assignment – Playwright + TypeScript

Tests for **Sauce Demo** (shop UI) and **Restful-Booker** (booking API).

## How to run

Needs Node.js 18 or later.

```bash
npm install
npx playwright install chromium firefox

npm test                 # everything: UI on Chromium and Firefox, plus the API
npm run test:ui:chromium # UI tests on Chromium only (fastest)
npm run test:api         # API tests only
npm run test:headed      # UI tests on Chromium in a visible browser
npm run report           # open the HTML report from the last run
```

Run one test by name: `npx playwright test -g "BUG-01"`

**About the `x` marks in the output:** a test marked with `test.fail()` checks the *correct* behaviour for a known bug, so it is *expected* to fail while the bug exists. Playwright counts it as passed and shows `x`. If someone fixes the bug, that test turns red, which tells us to remove the marker.

## What's covered

| Part of the brief | Where | Count |
|---|---|---|
| 1. Test plan: risks, top 10 in priority order, automate or not and why | [`test-plan/checkout-test-plan.md`](test-plan/checkout-test-plan.md) | 7 risks, 10 cases (9 automated, 1 manual) |
| 2. UI: login, cart, checkout, logout; positive, negative and edge cases | [`tests/ui/`](tests/ui) | **35 tests** (+6 extra in `inventory.spec.ts`) |
| 3. API: CRUD plus failure cases | [`tests/api/booking.spec.ts`](tests/api/booking.spec.ts) | **19 tests** |
| 4. Bug reports | [`bug-reports/bugs.md`](bug-reports/bugs.md) | 8 shop bugs + 4 API bugs |
| 5. AI notes | [`AI-notes.md`](AI-notes.md) | — |
| Extra: GitHub Actions on every PR | [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) | — |

UI tests per module, each grouped into positive / negative / edge `describe` blocks:

| Module | File | Tests |
|---|---|---|
| Login | `login.spec.ts` | 11 |
| Cart | `cart.spec.ts` | 6 |
| Checkout | `checkout.spec.ts` | 13 |
| Logout | `logout.spec.ts` | 5 |
| Inventory (extra) | `inventory.spec.ts` | 6 |

The UI tests run in both Chromium and Firefox, so the full run is 41 × 2 + 19 = **101 tests**.

## Project structure

```
├── .github/workflows/playwright.yml   # CI: runs all tests on every pull request
├── pages/                             # Page Object Model – one class per screen
│   ├── BasePage.ts                    # header, cart icon, menu (logout / reset) – shared by all logged-in pages
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductPage.ts
│   ├── CartPage.ts
│   ├── CheckoutInfoPage.ts
│   ├── CheckoutOverviewPage.ts
│   └── CheckoutCompletePage.ts
├── fixtures/pages.ts                  # custom `test` that injects the page objects into each test
├── test-data/shop.ts                  # users, products, customer details, error messages
├── utils/money.ts                     # "$29.99" → 29.99
├── tests/
│   ├── ui/
│   │   ├── login.spec.ts
│   │   ├── logout.spec.ts
│   │   ├── inventory.spec.ts
│   │   ├── cart.spec.ts
│   │   └── checkout.spec.ts
│   └── api/
│       └── booking.spec.ts
├── test-plan/checkout-test-plan.md
├── bug-reports/bugs.md
├── AI-notes.md
├── playwright.config.ts
└── package.json
```

## Design choices

- **Clear locators.** Sauce Demo has `data-test` attributes on its elements. The config sets `testIdAttribute: 'data-test'`, so the tests use `getByTestId('checkout')` and not CSS classes that change with styling.
- **No fixed waits.** There's no `waitForTimeout` anywhere. The tests use Playwright's auto-waiting assertions, such as `toHaveURL` and `toBeVisible`.
- **Independent tests.** Each UI test logs in fresh in its own browser context. Each API test gets its own booking from a Playwright fixture, which deletes it afterwards. Any test can run alone or in any order, and everything runs in parallel.
- **Our own data.** Both sites are shared with other people, so every booking gets a unique name (`QA-<random>`), is only read through its own id, and is cleaned up after the test.
- **Page Object Model (UI).** Each screen has a class in `pages/` that owns its locators and actions, such as `cartPage.checkout()` and `checkoutInfoPage.submit(CUSTOMER)`. When Sauce Demo changes a selector, only one file needs updating. `BasePage` holds the header, cart and menu that every logged-in page shares.
- **Page objects as fixtures.** `fixtures/pages.ts` extends Playwright's `test`, so a test simply asks for what it needs: `async ({ loginPage, cartPage }) => …`. Each test gets fresh instances bound to its own browser context.
- **Assertions stay in the tests.** Page objects only find elements and perform actions. Every `expect` is in a spec file, so you can see what a test checks without opening the page classes.
- **Test data in one place.** Users, products, customer details and error messages live in `test-data/shop.ts`, not as literals spread across the specs.
- **API tests use fixtures, not page objects.** The API has no pages, so `booking.spec.ts` uses Playwright fixtures (`token`, `auth`, `booking`) to create and clean up each test's data.
- **Totals are calculated, not hard-coded.** The checkout tax test adds up the prices shown on screen, so a price change on the site doesn't break it.
- **Debugging failures.** On a failure, Playwright keeps a screenshot, a video and a trace. CI retries a failed test twice and uploads the HTML report.

## Not finished / known limitations

- **TC-10 (keyboard and screen-reader checkout) is manual only**, as explained in the test plan. It hasn't been run yet.
- **The tests depend on two public demo sites.** If either one is down or slow (Restful-Booker sometimes is), tests can fail for reasons that have nothing to do with the code. CI retries help but can't fully prevent this.
- **The shop's `performance_glitch_user` and `visual_user` accounts are not tested** in depth. `visual_user` is used only in BUG-03.
- **The API bug tests (BUG-09 to BUG-12) document current behaviour.** If the API owners say these responses are intended, the `test.fail()` markers would come out.
