# Bug Reports

**Shop:** https://www.saucedemo.com, Chromium and Firefox (Playwright), Windows 11
**API:** https://restful-booker.herokuapp.com
Every bug below was reproduced on the live site. BUG-01 to BUG-11 are pinned by automated tests marked `test.fail()`; BUG-12 is recorded by tests that assert the current status codes.

| ID | Title | Area | Severity |
|---|---|---|---|
| BUG-01 | An order can be placed with an empty cart | Checkout | High |
| BUG-02 | Whitespace-only name and postal code are accepted | Checkout | Medium |
| BUG-03 | The next user sees the previous user's cart after logout | Logout / Cart | High |
| BUG-04 | Reset App State leaves "Remove" buttons on products | Cart | Low |
| BUG-05 | `problem_user`: typing a last name overwrites the first name | Checkout | High |
| BUG-06 | `error_user`: Finish does nothing | Checkout | High |
| BUG-07 | `problem_user`: every product shows the same image | Inventory | Low |
| BUG-08 | `problem_user`: sorting does nothing | Inventory | Medium |
| BUG-09 | API: missing required fields return 500 instead of 400 | Booking API | Medium |
| BUG-10 | API: PUT/DELETE on a wrong id return 405 instead of 404 | Booking API | Low |
| BUG-11 | API: a checkout date before the check-in date is accepted | Booking API | Medium |
| BUG-12 | API: wrong status codes for bad login (200) and delete (201) | Booking API | Low |

---

## Shop bugs

### BUG-01 – An order can be placed with an empty cart
**Steps**
1. Log in as `standard_user` / `secret_sauce`. Don't add anything.
2. Click the cart icon. The cart is empty.
3. Click **Checkout**, enter `Jane` / `Doe` / `560001`, then click **Continue**.
4. Click **Finish**.

**Expected:** Checkout is blocked, for example the button is disabled or a "Your cart is empty" message appears.
**Actual:** Overview shows "Item total: $0", and **Finish** shows "Thank you for your order!"
**Severity: High.** The system accepts orders with nothing in them, which creates junk orders downstream.
**Test:** `checkout.spec.ts` › TC-04 / BUG-01

### BUG-02 – Whitespace-only name and postal code are accepted
**Steps**
1. Log in as `standard_user`, add any product, open the cart and click **Checkout**.
2. Type one space in First Name, Last Name and Postal Code.
3. Click **Continue**.

**Expected:** "… is required" errors, because a space is not a name or a postal code.
**Actual:** The form is accepted and the user moves on to Overview.
**Severity: Medium.** Orders can be placed with no usable delivery details, but the user has to try to do it.
**Test:** `checkout.spec.ts` › TC-07 / BUG-02

### BUG-03 – The next user sees the previous user's cart after logout
**Steps**
1. Log in as `standard_user` and add **Sauce Labs Backpack**. The badge shows 1.
2. Open the menu and click **Logout**.
3. Log in as `visual_user` and open the cart.

**Expected:** `visual_user` has an empty cart.
**Actual:** `visual_user` sees `standard_user`'s backpack and could buy it.
**Severity: High.** One user's data leaks to another on a shared device, and the second user could order items they never chose.
**Test:** `logout.spec.ts` › BUG-03

### BUG-04 – Reset App State leaves "Remove" buttons on products
**Steps**
1. Log in as `standard_user` and click **Add to cart** on Sauce Labs Backpack.
2. Open the menu and click **Reset App State**.

**Expected:** The cart badge disappears and the backpack button changes back to **Add to cart**.
**Actual:** The badge disappears, but the button still says **Remove** until the page is reloaded.
**Severity: Low.** The page shows the wrong state, but a reload fixes it and no data is lost.
**Test:** `cart.spec.ts` › BUG-04

### BUG-05 – `problem_user`: typing a last name overwrites the first name
**Steps**
1. Log in as `problem_user`, add any product and start checkout.
2. Type `Jane` in First Name, then `Doe` in Last Name.

**Expected:** First Name = `Jane`, Last Name = `Doe`.
**Actual:** Last Name stays empty and the text goes into First Name, so "Last Name is required" blocks checkout.
**Severity: High.** The affected user can't complete any purchase.
**Test:** `checkout.spec.ts` › BUG-05

### BUG-06 – `error_user`: Finish does nothing
**Steps**
1. Log in as `error_user`, add any product and start checkout.
2. Enter valid details and click **Continue**.
3. Click **Finish**.

**Expected:** The "Thank you for your order!" page.
**Actual:** Nothing happens. The page stays on Overview, and the console shows an uncaught `TypeError: … is not a function`.
**Severity: High.** The purchase fails silently at the final step, so it's lost revenue with no feedback to the user.
**Test:** `checkout.spec.ts` › BUG-06

### BUG-07 – `problem_user`: every product shows the same image
**Steps:** Log in as `problem_user` and look at the product list.
**Expected:** Each product shows its own photo.
**Actual:** All six products show the same dog image (`sl-404…jpg`).
**Severity: Low.** Cosmetic. The names and prices are still correct.
**Test:** `inventory.spec.ts` › BUG-07

### BUG-08 – `problem_user`: sorting does nothing
**Steps:** Log in as `problem_user` and pick **Price (low to high)**.
**Expected:** Products are reordered by price.
**Actual:** The order doesn't change.
**Severity: Medium.** Browsing is harder, but the user can still find and buy products.
**Test:** `inventory.spec.ts` › BUG-08

---

## API bugs (found while automating the booking API)

### BUG-09 – Missing required fields return 500 instead of 400
**Steps:** `POST /booking` with body `{ "firstname": "QA" }`.
**Expected:** `400 Bad Request` with a validation message.
**Actual:** `500 Internal Server Error`.
**Severity: Medium.** The client can't tell what it did wrong, and the error looks like a server crash.

### BUG-10 – PUT/DELETE on a wrong id return 405 instead of 404
**Steps:** With a valid token, send `PUT /booking/987654321` (and `DELETE` to the same URL).
**Expected:** `404 Not Found`, which is what `GET` on the same id returns.
**Actual:** `405 Method Not Allowed`.
**Severity: Low.** The status codes are inconsistent and misleading, but nothing is changed.

### BUG-11 – A checkout date before the check-in date is accepted
**Steps:** `POST /booking` with `checkin: 2027-01-15` and `checkout: 2027-01-10`.
**Expected:** `400`. The date range is impossible.
**Actual:** `200`, and the booking is created. A negative `totalprice` is also accepted.
**Severity: Medium.** Impossible bookings get stored and will break anything that calculates nights or prices.

### BUG-12 – Wrong status codes for bad login and delete
**Steps:** `POST /auth` with a wrong password; `DELETE /booking/{id}` with a valid token.
**Expected:** `401 Unauthorized` and `200`/`204`, respectively.
**Actual:** `200 OK` with `{"reason":"Bad credentials"}`, and `201 Created`.
**Severity: Low.** Clients that only check the status code will misread the result. The tests assert the current codes so they stay green.
