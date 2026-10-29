import { test, expect } from '../../fixtures';
import { buildBlog } from '../../data/factories';

test.describe('Dashboard (user)', { tag: '@regression' }, () => {
  test('welcomes a new user and shows zero blogs with an empty state', async ({ userApp, user }) => {
    await userApp.dashboard.open();
    await expect(userApp.dashboard.welcome).toHaveText(`Welcome, ${user.firstname}`);
    await expect(userApp.dashboard.totalBlogs).toHaveText('0');
    await expect(userApp.dashboard.emptyState).toContainText("You haven't created any blogs yet.");
  });

  test('counts and lists only the user\'s own blogs', async ({ userApp, user, otherUser, blogs }) => {
    const mine = [await blogs.create(user.token), await blogs.create(user.token)];
    const theirs = await blogs.create(otherUser.token);
    await userApp.dashboard.open();
    await expect(userApp.dashboard.totalBlogs).toHaveText('2');
    for (const blog of mine) await expect(userApp.page.getByRole('link', { name: blog.blogTitle })).toBeVisible();
    await expect(userApp.page.getByRole('link', { name: theirs.blogTitle })).toHaveCount(0);
  });

  test('the profile card shows name, email and role', async ({ userApp, user }) => {
    await userApp.dashboard.open();
    const main = userApp.page.getByRole('main');
    await expect(main).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(main).toContainText(user.email);
    await expect(main).toContainText('user');
  });

  test('Quick Create Blog opens the create page', async ({ userApp }) => {
    await userApp.dashboard.open();
    await userApp.page.getByRole('link', { name: /Quick Create Blog/ }).click();
    await expect(userApp.page).toHaveURL(/\/dashboard\/blogs\/create$/);
  });

  test('the sidebar lists exactly the user entries', async ({ userApp }) => {
    await userApp.dashboard.open();
    await expect(userApp.sidebar.links).toHaveText(['Dashboard', 'My Blogs', 'Create Blog', 'Profile', 'Change Password']);
    await expect(userApp.sidebar.logoutButton).toBeVisible();
  });

  const destinations: [string, RegExp][] = [
    ['blogs', /\/dashboard\/blogs$/], ['create-blog', /\/dashboard\/blogs\/create$/],
    ['profile', /\/dashboard\/profile$/], ['change-password', /\/dashboard\/change-password$/], ['dashboard', /\/dashboard$/],
  ];
  for (const [key, url] of destinations) {
    test(`sidebar item "${key}" navigates and is highlighted as active`, async ({ userApp }) => {
      await userApp.dashboard.open();
      await userApp.sidebar.link(key).click();
      await expect(userApp.page).toHaveURL(url);
      await expect(userApp.sidebar.link(key)).toHaveAttribute('aria-current', 'page');
    });
  }

  test('only the most specific sidebar item is active on /dashboard/blogs/create', async ({ userApp }) => {
    await userApp.blogForm.openCreate();
    await expect(userApp.sidebar.link('create-blog')).toHaveAttribute('aria-current', 'page');
    await expect(userApp.sidebar.link('blogs')).not.toHaveAttribute('aria-current', 'page');
  });

  test('the navbar search sends a logged-in user to the filtered public list', async ({ userApp, user, blogs }) => {
    const blog = await blogs.create(user.token, buildBlog());
    await userApp.dashboard.open();
    await userApp.navbar.search(blog.blogTitle);
    await expect(userApp.page).toHaveURL(/\/\?title=/);
    await expect(userApp.home.cardWithTitle(blog.blogTitle)).toBeVisible();
  });
});
