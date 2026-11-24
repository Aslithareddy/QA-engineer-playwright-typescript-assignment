# Test Plan – Sauce Demo Checkout Flow

**Scope:** Cart → Checkout: Your Information → Checkout: Overview → Checkout: Complete, on https://www.saucedemo.com
**Out of scope:** real payment and shipping (the demo shows fixed values), performance testing, mobile apps.
**Automation:** Playwright + TypeScript, Chromium and Firefox – [`tests/ui/checkout.spec.ts`](../tests/ui/checkout.spec.ts)

## Main risks

| # | Risk | Why it matters | Covered by |
|---|---|---|---|
| R1 | The order can't be completed | Direct revenue loss | TC-01, TC-09 |
| R2 | Totals or tax are wrong | Customers are over- or under-charged; trust and legal issues | TC-02 |
| R3 | Invalid orders get through (empty cart, missing or junk details) | Bad data, failed shipping, support cost | TC-03, TC-04, TC-07 |
| R4 | The order doesn't match the cart (wrong items or prices) | Wrong goods shipped, refunds | TC-05 |
| R5 | Cart state is wrong after an order or after cancelling | Double orders, or lost items | TC-06, TC-08 |
| R6 | Checkout works for some users or browsers but not others | Silent loss of part of the customer base | TC-09, Chromium and Firefox runs |
| R7 | Checkout can't be used without a mouse or with a screen reader | Excludes users; accessibility compliance | TC-10 |

## Top 10 test cases (priority order)

| Priority | ID | Test case | Expected result | Automate? | Why |
|---|---|---|---|---|---|
| 1 | TC-01 | Complete an order with 2 items and valid details | "Thank you for your order!" is shown and the cart badge disappears | ✅ Yes | The core money path. It has to pass on every release, so it's the first thing to automate. |
| 2 | TC-02 | Overview totals | Subtotal = sum of item prices; tax = 8% rounded to cents; total = subtotal + tax | ✅ Yes | Arithmetic is easy to assert exactly and easy to break. Computed from the screen, so price changes don't break the test. |
| 3 | TC-03 | First name, last name or postal code missing | A specific "… is required" error; the user stays on the page | ✅ Yes | Data-driven: one test body, three inputs. Cheap and stable. |
| 4 | TC-04 | Checkout with an **empty** cart | Checkout is blocked | ✅ Yes | A confirmed bug (BUG-01). The test pins it, so a fix is noticed straight away. |
| 5 | TC-05 | Overview lists exactly the cart items at the listed prices | Same names and prices as the product page | ✅ Yes | Protects against wrong goods or prices. Deterministic. |
| 6 | TC-06 | Cart is emptied after a successful order | No badge after the order is complete | ✅ Yes | Checked inside TC-01 at no extra cost. Prevents accidental double orders. |
| 7 | TC-07 | Whitespace-only name and postal code | A validation error | ✅ Yes | A confirmed bug (BUG-02). Validation gaps like this come back easily. |
| 8 | TC-08 | Cancel on Your Information and on Overview | Returns to Cart / Products; the cart is kept | ✅ Yes | Navigation regressions are common and cheap to check. |
| 9 | TC-09 | Checkout as `problem_user` and `error_user` | Both can complete an order | ✅ Yes | Each account reproduces a different defect (BUG-05, BUG-06). Automating keeps them tracked. |
| 10 | TC-10 | Keyboard-only and screen-reader checkout | Every field and button can be reached, is labelled, and has visible focus | ❌ Manual | Needs human judgement (focus order, how announcements sound). One manual pass per release with axe DevTools is cheaper than a brittle automated check. |

## Approach

- **Locators:** `data-test` attributes through `getByTestId()`, which stay stable when the styling changes.
- **Independence:** each test logs in fresh in its own browser context. There are no fixed waits; the tests rely on Playwright's auto-waiting assertions.
- **Known bugs:** pinned with `test.fail()`. The suite stays green, and a test starts "unexpectedly passing" when its bug is fixed.
- **Exit criteria:** all P1–P3 cases pass in Chromium and Firefox, and every open defect is logged in `bug-reports/bugs.md`.
