import { test, expect } from '../fixtures';
import { buildBlog, buildUser } from '../data/factories';

// Positive paths only: fast confidence that the whole stack is alive.
test.describe('UI smoke', { tag: '@smoke' }, () => {
  test('guest sees blog cards on the homepage and can open one', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await app.home.open({ title: blog.blogTitle });
    await expect(app.home.cardWithTitle(blog.blogTitle)).toBeVisible();
    await app.home.cardWithTitle(blog.blogTitle).getByRole('link', { name: /Read More/ }).click();
    await expect(app.blogDetails.heading).toHaveText(blog.blogTitle);
  });

  test('a new user can register and then log in', async ({ app }) => {
    const user = buildUser();
    await app.register.open();
    await app.register.fill(user);
    await app.register.submit.click();
    await expect(app.page).toHaveURL(/\/login\?registered=1/);
    await app.login.login(user.email, user.password);
    await expect(app.dashboard.welcome).toContainText(user.firstname);
  });

  test('a logged-in user can create a blog from the dashboard', async ({ userApp }) => {
    const blog = buildBlog();
    await userApp.blogForm.openCreate();
    await userApp.blogForm.fill(blog);
    await userApp.blogForm.submit.click();
    await expect(userApp.blogs.row(blog.blogTitle)).toBeVisible();
  });

  test('an admin can open the users page', async ({ adminApp }) => {
    await adminApp.users.open();
    await expect(adminApp.users.table).toBeVisible();
  });
});
