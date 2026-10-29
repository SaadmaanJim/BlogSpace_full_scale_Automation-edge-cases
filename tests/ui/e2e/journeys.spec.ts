import { test, expect } from '../../fixtures';
import { buildBlog, buildUser, TINY_PNG, uniqueSuffix } from '../../data/factories';
import { env } from '../../config/env';

// The end-to-end journeys from the assignment's "Core User Journey" section.
test.describe('End-to-end journeys', { tag: ['@e2e', '@regression'] }, () => {
  test('guest -> browse -> open blog -> register -> login -> avatar -> create -> edit -> delete', async ({ app, api, otherUser, blogs }) => {
    const existing = await blogs.create(otherUser.token);
    const me = buildUser();
    const draft = buildBlog();
    const editedTitle = `Edited ${uniqueSuffix()}`;
    blogs.trackTitle(draft.blogTitle);
    blogs.trackTitle(editedTitle);

    await test.step('guest browses, searches and opens a blog', async () => {
      await app.home.open();
      await app.navbar.search(existing.blogTitle);
      await app.home.cardWithTitle(existing.blogTitle).getByRole('link', { name: /Read More/ }).click();
      await expect(app.blogDetails.heading).toHaveText(existing.blogTitle);
    });

    await test.step('guest registers and logs in', async () => {
      await app.register.open();
      await app.register.fill(me);
      await app.register.submit.click();
      await expect(app.page).toHaveURL(/\/login\?registered=1$/);
      await app.login.login(me.email, me.password);
      await expect(app.dashboard.welcome).toContainText(me.firstname);
    });

    await test.step('uploads a profile image and sees it in the navbar', async () => {
      await app.sidebar.link('profile').click();
      await app.profile.avatarInput.setInputFiles(TINY_PNG);
      await app.profile.uploadButton.click();
      await expect(app.profile.toastSuccess).toBeVisible();
      await expect(app.navbar.avatarImage).toBeVisible();
    });

    await test.step('creates a blog and sees it in the list', async () => {
      await app.sidebar.link('create-blog').click();
      await app.blogForm.fill(draft);
      await app.blogForm.submit.click();
      await expect(app.blogs.row(draft.blogTitle)).toBeVisible();
    });

    await test.step('edits the blog', async () => {
      await app.blogs.row(draft.blogTitle).getByRole('link', { name: /Edit/ }).click();
      await app.blogForm.field('blogTitle').fill(editedTitle);
      await app.blogForm.submit.click();
      await expect(app.blogs.row(editedTitle)).toBeVisible();
    });

    await test.step('deletes the blog', async () => {
      await app.blogs.row(editedTitle).getByRole('button', { name: 'Delete' }).click();
      await app.blogs.confirmAccept.click();
      await expect(app.blogs.toastSuccess).toHaveText('Blog deleted.');
      await expect(app.blogs.row(editedTitle)).toHaveCount(0);
    });

    await test.step('logs out', async () => {
      await app.sidebar.logoutButton.click();
      await expect(app.page).toHaveURL(/\/login$/);
      expect((await api.login(me.email, me.password)).status()).toBe(200); // account itself is intact
    });
  });

  test('admin -> login -> users -> view -> deactivate -> manage all blogs -> edit/delete any blog', async ({ app, api, user, blogs }) => {
    const blog = await blogs.create(user.token);
    const editedTitle = `Admin edit ${uniqueSuffix()}`;

    await test.step('admin logs in through the UI', async () => {
      await app.login.open();
      await app.login.login(env.admin.email, env.admin.password);
      await expect(app.page).toHaveURL(/\/dashboard$/);
      await expect(app.sidebar.link('users')).toBeVisible();
    });

    await test.step('views the user list and one user', async () => {
      await app.sidebar.link('users').click();
      await app.users.viewButton(user.email).click();
      await expect(app.users.details).toContainText(user.email);
      await app.users.modal.getByRole('button', { name: 'Close' }).click();
    });

    await test.step('deactivates the user', async () => {
      await app.users.deactivateButton(user.email).click();
      await expect(app.users.row(user.email)).toContainText('Inactive');
      expect((await api.login(user.email, user.password)).status()).toBe(403);
    });

    await test.step('edits then deletes the user\'s blog from All Blogs', async () => {
      await app.sidebar.link('blogs').click();
      await app.blogs.editButton(blog.id).click();
      await app.blogForm.field('blogTitle').fill(editedTitle);
      await app.blogForm.submit.click();
      await expect(app.blogs.row(editedTitle)).toBeVisible();
      await app.blogs.deleteButton(blog.id).click();
      await app.blogs.confirmAccept.click();
      await expect(app.blogs.row(editedTitle)).toHaveCount(0);
      expect((await api.getBlog(blog.id)).status()).toBe(404);
    });
  });
});
