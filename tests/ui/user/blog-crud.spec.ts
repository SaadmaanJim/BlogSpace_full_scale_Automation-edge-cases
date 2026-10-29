import { test, expect } from '../../fixtures';
import { buildBlog, uniqueSuffix } from '../../data/factories';
import { holdApi, isApi, mockApi } from '../../utils/network';

test.describe('Blog management (user)', { tag: '@regression' }, () => {
  test.describe('create', () => {
    test('publishes a blog, shows a toast, lists it and exposes it publicly', async ({ userApp, api, blogs }) => {
      const blog = buildBlog();
      blogs.trackTitle(blog.blogTitle);
      await userApp.blogForm.openCreate();
      await userApp.blogForm.fill(blog);
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.toastSuccess).toHaveText('Blog published.');
      await expect(userApp.page).toHaveURL(/\/dashboard\/blogs$/);
      await expect(userApp.blogs.row(blog.blogTitle)).toBeVisible();
      await expect.poll(async () => JSON.stringify(await (await api.listBlogs({ title: blog.blogTitle })).json())).toContain(blog.blogTitle);
    });

    test('empty submit shows all validation messages and sends nothing', async ({ userApp }) => {
      const calls: string[] = [];
      userApp.page.on('request', (r) => { if (isApi('/blogs/create')(new URL(r.url()))) calls.push(r.url()); });
      await userApp.blogForm.openCreate();
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.fieldError('blogTitle')).toHaveText('Title must be at least 3 characters');
      await expect(userApp.blogForm.fieldError('category')).toHaveText('Choose a category');
      await expect(userApp.blogForm.fieldError('blog')).toHaveText('Content must be at least 10 characters');
      expect(calls).toHaveLength(0);
    });

    test('never sends a userId: the payload is exactly title, content and category', async ({ userApp, blogs }) => {
      const blog = buildBlog();
      blogs.trackTitle(blog.blogTitle);
      await userApp.blogForm.openCreate();
      await userApp.blogForm.fill(blog);
      const request = userApp.page.waitForRequest((r) => isApi('/blogs/create')(new URL(r.url())) && r.method() === 'POST');
      await userApp.blogForm.submit.click();
      expect(Object.keys((await request).postDataJSON()).sort()).toEqual(['blog', 'blogTitle', 'category']);
    });

    test('shows a pending state and submits once', async ({ userApp, blogs }) => {
      const blog = buildBlog();
      blogs.trackTitle(blog.blogTitle);
      const held = await holdApi(userApp.page, 'POST', '/blogs/create');
      await userApp.blogForm.openCreate();
      await userApp.blogForm.fill(blog);
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.submit).toBeDisabled();
      await expect(userApp.blogForm.submit).toHaveText('Publishing...');
      held.release();
      await expect(userApp.page).toHaveURL(/\/dashboard\/blogs$/);
      expect(held.count()).toBe(1);
    });

    test('shows the backend error and keeps the typed content', async ({ userApp }) => {
      await mockApi(userApp.page, 'POST', '/blogs/create', 500, 'Boom');
      const blog = buildBlog();
      await userApp.blogForm.openCreate();
      await userApp.blogForm.fill(blog);
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.formError).toHaveText('Boom');
      await expect(userApp.blogForm.field('blogTitle')).toHaveValue(blog.blogTitle);
    });
  });

  test.describe('list', () => {
    test('shows an empty state for a user without blogs', async ({ userApp }) => {
      await userApp.blogs.open();
      await expect(userApp.blogs.emptyState).toContainText("You haven't created any blogs yet.");
    });

    test('lists only the user\'s own blogs with columns and Edit/Delete actions', async ({ userApp, user, otherUser, blogs }) => {
      const mine = await blogs.create(user.token);
      const theirs = await blogs.create(otherUser.token);
      await userApp.blogs.open();
      await expect(userApp.blogs.row(mine.blogTitle)).toBeVisible();
      await expect(userApp.blogs.row(theirs.blogTitle)).toHaveCount(0);
      await expect(userApp.blogs.table.getByRole('columnheader')).toHaveText(['Title', 'Category', 'Author', 'Created', 'Actions']);
      await expect(userApp.blogs.editButton(mine.id)).toBeVisible();
      await expect(userApp.blogs.deleteButton(mine.id)).toBeVisible();
    });

    test('a title opens the public blog page', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await userApp.blogs.open();
      await userApp.blogs.row(blog.blogTitle).getByRole('link', { name: blog.blogTitle }).click();
      await expect(userApp.page).toHaveURL(new RegExp(`/blogs/${blog.id}$`));
    });
  });

  test.describe('edit', () => {
    test('loads the existing values, saves changes and shows them everywhere', async ({ userApp, api, user, blogs }) => {
      const blog = await blogs.create(user.token, { category: 'Testing' });
      await userApp.blogs.open();
      await userApp.blogs.editButton(blog.id).click();
      await expect(userApp.page).toHaveURL(new RegExp(`/dashboard/blogs/${blog.id}/edit$`));
      await expect(userApp.blogForm.field('blogTitle')).toHaveValue(blog.blogTitle);
      await expect(userApp.blogForm.field('category')).toHaveValue('Testing');
      await expect(userApp.blogForm.field('blog')).toHaveValue(blog.blog);

      const next = `Edited ${uniqueSuffix()}`;
      await userApp.blogForm.field('blogTitle').fill(next);
      await userApp.blogForm.field('category').selectOption('Automation');
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.toastSuccess).toHaveText('Blog updated.');
      await expect(userApp.page).toHaveURL(/\/dashboard\/blogs$/);
      await expect(userApp.blogs.row(next)).toContainText('Automation');
      expect(JSON.stringify(await (await api.getBlog(blog.id)).json())).toContain(next);
    });

    test('validates the form on edit as well', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await userApp.blogForm.openEdit(blog.id);
      await userApp.blogForm.field('blogTitle').fill('');
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.fieldError('blogTitle')).toBeVisible();
    });

    test('shows a pending state while saving', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      const held = await holdApi(userApp.page, 'PUT', `/blogs/update/${blog.id}`);
      await userApp.blogForm.openEdit(blog.id);
      await userApp.blogForm.field('blogTitle').fill(`Saving ${uniqueSuffix()}`);
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.submit).toHaveText('Saving...');
      held.release();
      await expect(userApp.page).toHaveURL(/\/dashboard\/blogs$/);
    });

    test('displays the backend authorization error', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await mockApi(userApp.page, 'PUT', `/blogs/update/${blog.id}`, 403, 'You are not authorized to update this blog.');
      await userApp.blogForm.openEdit(blog.id);
      await userApp.blogForm.submit.click();
      await expect(userApp.blogForm.formError).toHaveText('You are not authorized to update this blog.');
    });

    test('shows "Blog Not Found" for an unknown id', async ({ userApp }) => {
      await userApp.blogForm.openEdit('999999999');
      await expect(userApp.page.getByText('Blog Not Found')).toBeVisible();
    });
  });

  test.describe('delete', () => {
    test('asks for confirmation; Cancel keeps the blog', async ({ userApp, api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await userApp.blogs.open();
      await userApp.blogs.deleteButton(blog.id).click();
      await expect(userApp.blogs.confirmDialog).toContainText('Are you sure you want to delete this blog?');
      await userApp.blogs.confirmCancel.click();
      await expect(userApp.blogs.confirmDialog).toHaveCount(0);
      await expect(userApp.blogs.row(blog.blogTitle)).toBeVisible();
      expect((await api.getBlog(blog.id)).status()).toBe(200);
    });

    test('confirming deletes the blog, shows a toast and refreshes the list', async ({ userApp, api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await userApp.blogs.open();
      await userApp.blogs.deleteButton(blog.id).click();
      await userApp.blogs.confirmAccept.click();
      await expect(userApp.blogs.toastSuccess).toHaveText('Blog deleted.');
      await expect(userApp.blogs.row(blog.blogTitle)).toHaveCount(0);
      expect((await api.getBlog(blog.id)).status()).toBe(404);
    });

    test('shows a pending state and cannot be confirmed twice', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      const held = await holdApi(userApp.page, 'DELETE', `/blogs/delete/${blog.id}`);
      await userApp.blogs.open();
      await userApp.blogs.deleteButton(blog.id).click();
      await userApp.blogs.confirmAccept.click();
      await expect(userApp.blogs.confirmAccept).toBeDisabled();
      await expect(userApp.blogs.confirmAccept).toHaveText('Deleting...');
      held.release();
      await expect(userApp.blogs.toastSuccess).toBeVisible();
      expect(held.count()).toBe(1);
    });

    test('shows an error toast when the backend refuses', async ({ userApp, user, blogs }) => {
      const blog = await blogs.create(user.token);
      await mockApi(userApp.page, 'DELETE', `/blogs/delete/${blog.id}`, 403, 'You are not authorized to delete this blog.');
      await userApp.blogs.open();
      await userApp.blogs.deleteButton(blog.id).click();
      await userApp.blogs.confirmAccept.click();
      await expect(userApp.blogs.toastError).toHaveText('You are not authorized to delete this blog.');
      await expect(userApp.blogs.row(blog.blogTitle)).toBeVisible();
    });
  });
});
