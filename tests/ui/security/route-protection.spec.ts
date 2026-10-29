import { test, expect } from '../../fixtures';

const PROTECTED_ROUTES = [
  '/dashboard', '/dashboard/blogs', '/dashboard/blogs/create', '/dashboard/blogs/1/edit',
  '/dashboard/profile', '/dashboard/change-password', '/admin/users',
];
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password/some-token'];

test.describe('Route protection', { tag: ['@security', '@regression'] }, () => {
  for (const route of PROTECTED_ROUTES) {
    test(`a guest is redirected from ${route} to /login with a next param`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route)}`));
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`${route} is public`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : route}`));
    });
  }

  test('after logging in the user lands on the page they originally asked for', async ({ app, user }) => {
    await app.page.goto('/dashboard/profile');
    await expect(app.page).toHaveURL(/\/login\?next=/);
    await app.login.login(user.email, user.password);
    await expect(app.page).toHaveURL(/\/dashboard\/profile$/);
  });

  test('the next param cannot be used to redirect off-site', async ({ app, user }) => {
    await app.login.open('?next=//evil.example.com');
    await app.login.login(user.email, user.password);
    await expect(app.page).toHaveURL(/\/dashboard$/);
    expect(new URL(app.page.url()).hostname).not.toContain('evil');
  });

  test('a logged-in user visiting /login is sent to the dashboard', async ({ userApp }) => {
    await userApp.login.open();
    await expect(userApp.page).toHaveURL(/\/dashboard$/);
  });

  test('an unknown route shows the 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});
