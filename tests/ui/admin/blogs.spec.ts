import { test, expect } from '../../fixtures';
import { buildBlog, uniqueSuffix } from '../../data/factories';

test.describe('Admin: managing every user\'s blogs', { tag: '@regression' }, () => {
  test('All Blogs lists another user\'s blog with Edit and Delete actions', async ({ adminApp, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await adminApp.blogs.open();
    await expect(adminApp.page.getByRole('heading', { name: 'All Blogs' })).toBeVisible();
    await expect(adminApp.blogs.row(blog.blogTitle)).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(adminApp.blogs.editButton(blog.id)).toBeVisible();
    await expect(adminApp.blogs.deleteButton(blog.id)).toBeVisible();
  });

  test('an admin can edit another user\'s blog and the public page reflects it', async ({ adminApp, api, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await adminApp.blogForm.openEdit(blog.id);
    await expect(adminApp.blogForm.field('blogTitle')).toHaveValue(blog.blogTitle);
    const next = `Edited by admin ${uniqueSuffix()}`;
    await adminApp.blogForm.field('blogTitle').fill(next);
    await adminApp.blogForm.submit.click();
    await expect(adminApp.blogForm.toastSuccess).toHaveText('Blog updated.');
    expect(JSON.stringify(await (await api.getBlog(blog.id)).json())).toContain(next);
  });

  test('an admin can delete another user\'s blog', async ({ adminApp, api, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await adminApp.blogs.open();
    await adminApp.blogs.deleteButton(blog.id).click();
    await adminApp.blogs.confirmAccept.click();
    await expect(adminApp.blogs.toastSuccess).toHaveText('Blog deleted.');
    await expect(adminApp.blogs.row(blog.blogTitle)).toHaveCount(0);
    expect((await api.getBlog(blog.id)).status()).toBe(404);
  });

  test('a blog created by the admin appears in All Blogs', async ({ adminApp, blogs }) => {
    const blog = buildBlog();
    blogs.trackTitle(blog.blogTitle);
    await adminApp.blogForm.openCreate();
    await adminApp.blogForm.fill(blog);
    await adminApp.blogForm.submit.click();
    await expect(adminApp.blogs.row(blog.blogTitle)).toBeVisible();
  });
});
