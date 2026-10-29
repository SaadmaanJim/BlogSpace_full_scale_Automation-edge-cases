# Test automation guide

Playwright + TypeScript. Suites run against the **real** backend and the **real** frontend.

## One-time setup
```powershell
npm install
npx playwright install chromium        # add firefox webkit for cross-browser
copy .env.test.example .env.test       # only edit values that differ from the defaults
```
Requirements before running: backend up (`API_URL`), and an **admin account** that exists with `role='admin'`
(`UPDATE users SET role='admin' WHERE email='admin@example.com';`). `globalSetup` checks both and stops with a clear message.

## Commands
| Command | What runs |
|---|---|
| `npm run test:smoke` | positive-path smoke suite (API + UI) |
| `npm run test:regression` | everything tagged `@regression` |
| `npm run test:api` | API contract + authorization suites (no browser) |
| `npm run test:ui` | desktop Chrome suites + mobile (Pixel 7) responsive suite |
| `npm run test:security` / `test:a11y` | tagged subsets |
| `npm run test:headed` | watch it run (use for the submission video) |
| `npm run test:report` | open the HTML report |
| `CROSS_BROWSER=1 npx playwright test` | adds Firefox + WebKit smoke projects |
| `SKIP_WEB_SERVER=1 npx playwright test` | use an already-running frontend |

## Suites
| Folder | Covers |
|---|---|
| `tests/api/` | every endpoint: success, validation (400), auth (401), authorization (403), not-found (404), conflicts (409), no secret leakage, role x endpoint matrix |
| `tests/ui/guest/` | homepage, cards, search, category filter, combined filter, deep links, blog details, 404, XSS-as-text |
| `tests/ui/auth/` | login, register, forgot/reset password, session persistence, logout, expiry, 401 handling, pending/double-submit, network failure |
| `tests/ui/user/` | dashboard, sidebar, blog create/edit/delete, profile, avatar upload, change password |
| `tests/ui/admin/` | user list/view/activate/deactivate, manage any blog |
| `tests/ui/security/` | route protection, open-redirect guard, role-based UI access |
| `tests/ui/responsive/` | phone drawer, stacking, no horizontal overflow, tablet and desktop layouts |
| `tests/ui/a11y/` | axe WCAG A/AA scan of key pages, labels, keyboard use, ARIA roles |
| `tests/ui/e2e/` | the assignment's Core User Journey and Admin Journey |
| `tests/ui/smoke.spec.ts`, `tests/api/smoke.api.spec.ts` | `@smoke` |

## Test-case execution checklist

Each row covers the cases in the named spec file. Record `✓ Pass` or `✗ Fail` after running the case; use `— Not run` for cases that have not run or were skipped. A skipped case is not a pass.

| Folder / spec | Test input / scenario | Expected output | Result (✓ / ✗) |
|---|---|---|---|
| `tests/api/auth.api.spec.ts` | Valid, duplicate, malformed, and case-variant registration; role spoofing; valid/invalid login; unknown email; deactivated account; SQL-injection-style input; forgot/reset password with invalid inputs or token | Correct success or 400/401/403/409 response; no password or secret leakage; no self-assigned admin role or account enumeration | — Not run |
| `tests/api/authorization.api.spec.ts` | Role × endpoint matrix; user attempts to promote self; deactivated account attempts login | Each role receives the expected status for each endpoint; regular users cannot promote themselves; deactivated users cannot log in | — Not run |
| `tests/api/blogs.api.spec.ts` | Public list/detail; malformed or unknown IDs; title/category filters; create/update/delete as guest, owner, other user, and admin; invalid bodies; spoofed author; unrelated users' blogs | Public reads work; filters return matching results; validation and authorization return expected 400/401/403/404 responses; owner/admin actions persist; unrelated blogs remain unchanged | — Not run |
| `tests/api/smoke.api.spec.ts` | Public blog list; register → login → profile → create blog; admin lists users | Core API journeys complete successfully and return expected data | — Not run |
| `tests/api/users.api.spec.ts` | Profile with missing, malformed, or tampered tokens; profile update and protected fields; password change; valid/invalid avatar; admin list/view/status actions | Own profile and valid changes are returned without secrets; invalid or unauthorized requests receive expected errors; password and avatar behavior persists; admin-only operations succeed only for admins | — Not run |
| `tests/ui/a11y/accessibility.spec.ts` | Public, logged-in, and admin pages; login/register labels; keyboard-only login; validation errors; modal dialogs | No serious axe violations; fields are label-accessible and keyboard reachable; errors are announced and linked; dialogs expose an accessible name | — Not run |
| `tests/ui/admin/blogs.spec.ts` | Admin lists, creates, edits, and deletes blogs belonging to other users | Admin can manage any blog; edits appear publicly; deleted blogs are removed | — Not run |
| `tests/ui/admin/users.spec.ts` | Admin lists/views users, activates/deactivates accounts, retries failed toggles, and opens dashboard stats | User details and statuses display correctly; activation state affects login; self-deactivation is blocked; pending/error states are clear; total-users stat is numeric | — Not run |
| `tests/ui/auth/forgot-reset.spec.ts` | Empty/malformed/registered/unknown email; request pending state; password confirmation mismatch; short password; invalid/expired token; full reset journey | Client validation blocks invalid input; registered and unknown emails receive the same success response; reset errors are shown; a valid reset allows login with the new password | — Not run |
| `tests/ui/auth/login.spec.ts` | Valid, empty, malformed, wrong-password, unknown-email, and deactivated-user credentials; Enter and double-submit; unavailable server/500; password visibility and navigation links | Valid login reaches dashboard; invalid submissions show appropriate messages without duplicate requests or account enumeration; password is masked; links work | — Not run |
| `tests/ui/auth/register.spec.ts` | Valid registration; missing fields; malformed email; short password; mismatched confirmation; whitespace-only names; duplicate email; server error; double-submit | Valid account can log in; invalid input is rejected; only permitted fields are sent; errors and pending state display correctly; duplicate submission is prevented | — Not run |
| `tests/ui/auth/session.spec.ts` | Login storage/cookie; refresh; sidebar/navbar logout; protected-page access after logout; login redirect; invalid token; mid-session 401 | Session persists only as intended; logout/expiry clears auth and returns to login; protected pages remain inaccessible; unauthorized API response ends session | — Not run |
| `tests/ui/e2e/journeys.spec.ts` | Guest browse/register/login/avatar/blog CRUD journey; admin user and all-blog management journey | Both end-to-end journeys complete, with created/updated/deleted data reflected in the UI and backend | — Not run |
| `tests/ui/guest/blog-details.spec.ts` | Existing, unknown, and malformed blog IDs; details content, browser title, back link; HTML/script in user content | Correct blog details and title appear; invalid IDs show Blog Not Found; back link returns to list; user content is rendered as text, not executed | — Not run |
| `tests/ui/guest/home.spec.ts` | Guest navigation/cards; category list; title search and deep link; combined filters; empty/error states; detail link; HTML in blog title | Guest controls and matching blog results display correctly; query is preserved in URL; empty/error feedback appears; content is safe text | — Not run |
| `tests/ui/responsive/responsive.spec.ts` | Phone drawer interactions, guest navbar, card layout, route/form viewport fit, admin table, tablet breakpoint, desktop layout | Navigation remains usable; drawer opens/closes and navigates; no page-level horizontal overflow; content uses the expected single-/multi-column layout at each breakpoint | — Not run |
| `tests/ui/security/rbac.spec.ts` | Regular user visits admin page, sidebar, and another user's edit page; admin visits user management | User sees access denied and no admin-only request or navigation; admin sees admin controls; denied page provides a dashboard link | — Not run |
| `tests/ui/security/route-protection.spec.ts` | Guest opens protected/public routes; requested destination after login; external `next` URL; signed-in user opens login; unknown route | Guest is redirected with a safe return path; public pages remain accessible; external redirects are blocked; signed-in user reaches dashboard; unknown route shows 404 | — Not run |
| `tests/ui/smoke.spec.ts` | Guest opens a blog; new user registers/logs in; logged-in user creates a blog; admin opens users | Essential UI journeys complete and resulting pages/data are visible | — Not run |
| `tests/ui/user/blog-crud.spec.ts` | Create/list/edit/delete blog; empty form; request payload; pending/error states; empty list; unauthorized edit; unknown blog; cancel/confirm delete | Valid changes persist and are visible; invalid forms submit nothing; only intended fields are sent; cancel preserves data; confirm deletes; errors and pending state are displayed | — Not run |
| `tests/ui/user/change-password.spec.ts` | Valid change; missing fields; short or mismatching password; backend failure; inspect payload/session/field masking | New password works and old password fails; current session stays valid; invalid input is blocked; only new password is sent; errors and pending state display; fields are masked | — Not run |
| `tests/ui/user/dashboard.spec.ts` | New/existing user dashboard; own and other users' blogs; profile card; quick-create; sidebar routes; navbar search | Counts and lists include only the user's blogs; empty state and profile display correctly; shortcuts navigate and active navigation is accurate; search opens filtered public results | — Not run |
| `tests/ui/user/profile.spec.ts` | View/edit profile; attempt role/status changes; valid/invalid avatar uploads; reload; server errors | Email, role, and status remain read-only; name/avatar updates persist and refresh the UI; uploads use the expected multipart field; invalid files are rejected; pending/error feedback appears | — Not run |

## Design rules (why it is built this way)
- **Page Object Model** (`tests/pages`): selectors live in one place; specs read like the user story.
- **Fixtures** (`tests/fixtures`): `user`, `otherUser`, `blogs`, `userPage`, `adminPage` build isolated state per test and clean up after.
- **Auth through `storageState`**: logged-in pages skip the login UI (fast, and a login bug can't fail unrelated tests). Login itself is tested in `auth/`.
- **API for setup, UI for the behaviour under test**: blogs/users are created via REST; only the feature being tested is driven through the browser.
- **Test data isolation**: every user/blog title is unique per call, so tests are parallel-safe and re-runnable; blogs are deleted in teardown (users cannot be, the API has no delete-user endpoint).
- **No `waitForTimeout`**: web-first assertions auto-wait; pending states are observed with `holdApi` (a request gate) instead of sleeping.
- **Locators**: `getByTestId` / `getByRole` / `getByLabel` only.

## Forgot/reset-password journey
The backend prints the reset link (or emails it). To let tests read it, start the backend with output tee'd to a file:
```powershell
cd blog-api
npm start 2>&1 | Tee-Object -FilePath api.log
```
then set `RESET_LOG_PATH=../blog-api/api.log` in `.env.test`. Without it those tests are skipped (reported as skipped, not passed).

## Not covered
Visual-regression snapshots, load/performance testing, real email delivery, and Firefox/WebKit beyond smoke.
