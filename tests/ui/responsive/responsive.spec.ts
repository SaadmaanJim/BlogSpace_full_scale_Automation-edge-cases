import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// Runs in the "mobile" project (Pixel 7, 412px wide) unless a describe overrides the viewport.
test.describe('Responsive layout', { tag: ['@regression', '@responsive'] }, () => {
  test.describe('phone', () => {
    test('the sidebar is a drawer: hidden by default, opened by the menu button', async ({ userApp }) => {
      await userApp.dashboard.open();
      await expect(userApp.navbar.sidebarToggle).toBeVisible();
      await expect(userApp.sidebar.root).not.toBeInViewport();
      await userApp.navbar.sidebarToggle.click();
      await expect(userApp.sidebar.root).toBeInViewport();
    });

    test('choosing a drawer link navigates and closes the drawer', async ({ userApp }) => {
      await userApp.dashboard.open();
      await userApp.navbar.sidebarToggle.click();
      await userApp.sidebar.link('profile').click();
      await expect(userApp.page).toHaveURL(/\/dashboard\/profile$/);
      await expect(userApp.sidebar.root).not.toBeInViewport();
    });

    test('tapping outside the drawer closes it', async ({ userApp }) => {
      await userApp.dashboard.open();
      await userApp.navbar.sidebarToggle.click();
      await expect(userApp.sidebar.root).toBeInViewport();
      await userApp.page.mouse.click(390, 400); // the backdrop to the right of the 256px drawer
      await expect(userApp.sidebar.root).not.toBeInViewport();
    });

    test('the navbar stays usable for guests: search and Login are reachable', async ({ app }) => {
      await app.home.open();
      await expect(app.navbar.searchInput).toBeVisible();
      await expect(app.navbar.loginLink).toBeVisible();
    });

    test('the profile menu works on a phone and logout succeeds', async ({ userApp }) => {
      await userApp.dashboard.open();
      await userApp.navbar.logout();
      await expect(userApp.page).toHaveURL(/\/login$/);
    });

    test('blog cards stack in a single column', async ({ app, user, blogs }) => {
      const first = await blogs.create(user.token);
      const second = await blogs.create(user.token);
      await app.home.open({ title: 'E2E Blog' });
      const a = await app.home.cardWithTitle(first.blogTitle).boundingBox();
      const b = await app.home.cardWithTitle(second.blogTitle).boundingBox();
      expect(a && b).toBeTruthy();
      expect(Math.abs((a?.x ?? 0) - (b?.x ?? 1))).toBeLessThan(2);
      expect(a?.y).not.toBe(b?.y);
    });

    for (const route of ['/', '/login', '/register', '/forgot-password']) {
      test(`${route} has no horizontal scrolling and its form fits the viewport`, async ({ page }) => {
        await page.goto(route);
        await expect(page.getByRole('main')).toBeVisible();
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
        const viewportWidth = page.viewportSize()?.width ?? 0;
        for (const input of await page.getByRole('main').locator('input').all()) {
          const box = await input.boundingBox();
          if (box) expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
        }
      });
    }

    for (const route of ['/dashboard', '/dashboard/blogs', '/dashboard/blogs/create', '/dashboard/profile', '/dashboard/change-password']) {
      test(`${route} has no horizontal scrolling when logged in`, async ({ userPage }) => {
        await userPage.goto(route);
        await expect(userPage.getByRole('main')).toBeVisible();
        expect(await horizontalOverflow(userPage)).toBeLessThanOrEqual(1);
      });
    }

    test('the admin users table scrolls inside its container, not the page', async ({ adminApp, user }) => {
      await adminApp.users.open();
      await expect(adminApp.users.row(user.email)).toBeVisible();
      expect(await horizontalOverflow(adminApp.page)).toBeLessThanOrEqual(1);
    });
  });

  test.describe('tablet (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: false });
    test('still uses the drawer below the desktop breakpoint', async ({ userApp }) => {
      await userApp.dashboard.open();
      await expect(userApp.navbar.sidebarToggle).toBeVisible();
      await expect(userApp.sidebar.root).not.toBeInViewport();
    });
  });

  test.describe('desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
    test('shows a permanent sidebar and no menu button', async ({ userApp }) => {
      await userApp.dashboard.open();
      await expect(userApp.sidebar.root).toBeInViewport();
      await expect(userApp.navbar.sidebarToggle).toBeHidden();
    });

    test('blog cards use multiple columns', async ({ app, user, blogs }) => {
      const first = await blogs.create(user.token);
      const second = await blogs.create(user.token);
      await app.home.open({ title: 'E2E Blog' });
      const a = await app.home.cardWithTitle(first.blogTitle).boundingBox();
      const b = await app.home.cardWithTitle(second.blogTitle).boundingBox();
      expect(a && b).toBeTruthy();
      expect(Math.abs((a?.y ?? 0) - (b?.y ?? 0))).toBeLessThan(2); // same row => side by side
    });
  });
});
