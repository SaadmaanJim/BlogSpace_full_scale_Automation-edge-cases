import { test, expect } from '../../fixtures';
import { isApi } from '../../utils/network';

test.describe('Role-based UI access', { tag: ['@security', '@regression'] }, () => {
  test('a normal user sees Access Denied on /admin/users and the page never calls GET /users', async ({ userApp }) => {
    const adminCalls: string[] = [];
    userApp.page.on('request', (r) => { if (isApi('/users')(new URL(r.url()))) adminCalls.push(r.url()); });
    await userApp.users.open();
    await expect(userApp.users.accessDenied).toBeVisible();
    await expect(userApp.sidebar.root).toBeVisible(); // still inside the dashboard shell
    expect(adminCalls).toHaveLength(0);
  });

  test('a normal user has no admin entries in the sidebar', async ({ userApp }) => {
    await userApp.dashboard.open();
    await expect(userApp.sidebar.link('users')).toHaveCount(0);
    await expect(userApp.sidebar.link('blogs')).toHaveText('My Blogs');
  });

  test('an admin sees Users and All Blogs in the sidebar and can open the users page', async ({ adminApp }) => {
    await adminApp.dashboard.open();
    await expect(adminApp.sidebar.link('users')).toBeVisible();
    await expect(adminApp.sidebar.link('blogs')).toHaveText('All Blogs');
    await adminApp.sidebar.link('users').click();
    await expect(adminApp.page).toHaveURL(/\/admin\/users$/);
    await expect(adminApp.users.table).toBeVisible();
  });

  test('the access-denied page offers a way back to the dashboard', async ({ userApp }) => {
    await userApp.users.open();
    await userApp.users.accessDenied.getByRole('link', { name: 'Back to Dashboard' }).click();
    await expect(userApp.page).toHaveURL(/\/dashboard$/);
  });

  test('a normal user cannot open the edit page of someone else\'s blog', async ({ userApp, otherUser, blogs }) => {
    const blog = await blogs.create(otherUser.token);
    await userApp.blogForm.openEdit(blog.id);
    await expect(userApp.blogForm.accessDenied).toContainText('not authorized');
  });
});
