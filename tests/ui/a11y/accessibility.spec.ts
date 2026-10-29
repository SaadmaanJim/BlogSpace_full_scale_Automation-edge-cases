import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { buildUser } from '../../data/factories';

// Fails on WCAG A/AA violations rated serious or critical. Treat failures as real findings to fix.
async function expectNoSeriousViolations(page: Page, ready: Locator): Promise<void> {
  await expect(ready).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.help}`)).toEqual([]);
}

test.describe('Accessibility (axe)', { tag: ['@a11y', '@regression'] }, () => {
  const guestPages: [string, string][] = [['/login', 'Welcome back'], ['/register', 'Create your account'], ['/forgot-password', 'Forgot password?']];
  for (const [route, heading] of guestPages) {
    test(`${route} has no serious violations`, async ({ page }) => {
      await page.goto(route);
      await expectNoSeriousViolations(page, page.getByRole('heading', { name: heading }));
    });
  }

  test('the homepage has no serious violations', async ({ page, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await page.goto(`/?title=${encodeURIComponent(blog.blogTitle)}`);
    await expectNoSeriousViolations(page, page.getByTestId('blog-card').first());
  });

  test('the blog details page has no serious violations', async ({ page, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await page.goto(`/blogs/${blog.id}`);
    await expectNoSeriousViolations(page, page.getByTestId('blog-details'));
  });

  const userPages: [string, string][] = [
    ['/dashboard', 'dashboard-welcome'], ['/dashboard/blogs/create', 'blog-submit'],
    ['/dashboard/profile', 'profile-submit'], ['/dashboard/change-password', 'change-password-submit'],
  ];
  for (const [route, readyId] of userPages) {
    test(`${route} (logged in) has no serious violations`, async ({ userPage }) => {
      await userPage.goto(route);
      await expectNoSeriousViolations(userPage, userPage.getByTestId(readyId));
    });
  }

  test('/admin/users has no serious violations', async ({ adminPage }) => {
    await adminPage.goto('/admin/users');
    await expectNoSeriousViolations(adminPage, adminPage.getByTestId('users-table'));
  });

  test('every login and register field is reachable by its label', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await page.goto('/register');
    for (const label of ['First Name', 'Last Name', 'Email', 'Password', 'Confirm Password']) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });

  test('the login form can be completed with the keyboard only', async ({ page, api }) => {
    const user = await api.registerAndLogin(buildUser());
    await page.goto('/login');
    await page.getByLabel('Email').focus();
    await page.keyboard.type(user.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(user.password);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('validation errors are announced with role="alert" and linked to their field', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();
    const error = page.getByTestId('email-error');
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-describedby', /email-error/);
  });

  test('modal dialogs expose role=dialog with an accessible name', async ({ adminApp, user }) => {
    await adminApp.users.open();
    await adminApp.users.viewButton(user.email).click();
    await expect(adminApp.page.getByRole('dialog', { name: 'User Information' })).toBeVisible();
  });
});
