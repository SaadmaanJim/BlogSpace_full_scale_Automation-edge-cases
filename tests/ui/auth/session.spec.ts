import { test, expect } from '../../fixtures';
import { AUTH_COOKIE_NAME, env, TOKEN_STORAGE_KEY } from '../../config/env';
import { mockApi } from '../../utils/network';

const readToken = (page: import('@playwright/test').Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), TOKEN_STORAGE_KEY);

test.describe('Session handling', { tag: ['@regression', '@security'] }, () => {
  test('login stores the token in localStorage and only a presence flag in the cookie', async ({ app, user }) => {
    await app.login.open();
    await app.login.login(user.email, user.password);
    await expect(app.page).toHaveURL(/\/dashboard$/);
    const token = await readToken(app.page);
    expect(token).toBeTruthy();
    const cookies = await app.page.context().cookies();
    const flag = cookies.find((c) => c.name === AUTH_COOKIE_NAME);
    expect(flag?.value).toBe('1');
    expect(cookies.some((c) => token && c.value.includes(token))).toBe(false);
    expect(app.page.url()).not.toContain(token ?? 'x');
  });

  test('the session survives a page refresh', async ({ userApp, user }) => {
    await userApp.dashboard.open();
    await expect(userApp.dashboard.welcome).toContainText(user.firstname);
    await userApp.page.reload();
    await expect(userApp.dashboard.welcome).toContainText(user.firstname);
    await expect(userApp.navbar.username).toBeVisible();
  });

  test('logout from the sidebar clears storage and returns to /login', async ({ userApp }) => {
    await userApp.dashboard.open();
    await userApp.sidebar.logoutButton.click();
    await expect(userApp.page).toHaveURL(/\/login$/);
    expect(await readToken(userApp.page)).toBeNull();
    const cookies = await userApp.page.context().cookies();
    expect(cookies.find((c) => c.name === AUTH_COOKIE_NAME)).toBeUndefined();
  });

  test('logout from the navbar profile menu works too', async ({ userApp }) => {
    await userApp.dashboard.open();
    await userApp.navbar.logout();
    await expect(userApp.page).toHaveURL(/\/login$/);
    expect(await readToken(userApp.page)).toBeNull();
  });

  test('after logout, protected pages are no longer reachable (including via Back)', async ({ userApp }) => {
    await userApp.dashboard.open();
    await userApp.sidebar.logoutButton.click();
    await expect(userApp.page).toHaveURL(/\/login$/);
    await userApp.page.goBack();
    await expect(userApp.page).toHaveURL(/\/login/);
    await userApp.page.goto('/dashboard/blogs');
    await expect(userApp.page).toHaveURL(/\/login\?next=/);
  });

  test('a logged-out user who logs in again goes to the dashboard (no stale next)', async ({ userApp, user }) => {
    await userApp.dashboard.open();
    await userApp.sidebar.logoutButton.click();
    await expect(userApp.page).toHaveURL(/\/login$/);
    await userApp.login.login(user.email, user.password);
    await expect(userApp.page).toHaveURL(/\/dashboard$/);
  });

  test('an invalid stored token sends the user to login with the expired notice and clears it', async ({ app }) => {
    await app.page.context().addCookies([{ name: AUTH_COOKIE_NAME, value: '1', url: env.baseUrl }]);
    await app.page.addInitScript(([key]) => window.localStorage.setItem(key as string, 'garbage.token.value'), [TOKEN_STORAGE_KEY]);
    await app.page.goto('/dashboard');
    await expect(app.page).toHaveURL(/\/login\?expired=1/);
    await expect(app.login.notice).toContainText('session expired');
    await expect.poll(() => readToken(app.page)).toBeNull();
  });

  test('a 401 from any protected call mid-session ends the session', async ({ userApp }) => {
    await userApp.dashboard.open();
    await expect(userApp.dashboard.welcome).toBeVisible();
    await mockApi(userApp.page, 'GET', '/blogs', 401, 'Token expired');
    await userApp.sidebar.link('blogs').click();
    await expect(userApp.page).toHaveURL(/\/login\?expired=1/);
    await expect(userApp.login.notice).toContainText('session expired');
  });
});
