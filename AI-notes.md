# AI Notes

## Tools
- **Claude Code** (Anthropic), inside VS Code.

## What I used it for
- **Setting up the project:** Playwright config, npm scripts, the GitHub Actions workflow.
- **First drafts** of the UI and API tests, the test plan and the bug reports.
- **Checking behaviour on the live sites:** small one-off scripts to see what Sauce Demo and Restful-Booker actually do before writing an assertion.
- **Reviewing my work against the assignment brief**, requirement by requirement.

I reviewed, ran and changed everything before keeping it. I chose the test priorities and bug severities myself.

## A time it was wrong, and how I noticed

**It said logging out clears the cart, but it doesn't.**
To write the logout edge case, the AI ran a quick script that added an item, logged out, logged back in and counted the cart badge. It reported 0 and wrote a test saying "logout clears the cart."
When I ran the full suite, that test **failed**: the badge showed the item. The script had read the badge before the page finished loading, so it got 0 by accident. Testing this properly showed something worse: after logging out, a *different* user sees the previous user's cart. That became **BUG-03**.

**Lesson:** a script that makes no assertion can "pass" while measuring the wrong thing. I only trust a claim once a real assertion has checked it.

**Other corrections:**
- Its first draft of the bug report said the empty-cart order showed "$0.00". The page actually shows "$0". I caught this by checking the real page.
- Its first version of the API tests ran create → read → update → delete as one chain, with each test depending on the one before. That breaks the brief's rule that tests must not depend on each other. I noticed when I checked the brief, and now every test creates and cleans up its own booking.
