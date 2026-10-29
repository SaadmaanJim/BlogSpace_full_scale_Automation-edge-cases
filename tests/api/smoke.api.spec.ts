import { test, expect } from '../fixtures';
import { buildBlog } from '../data/factories';

test.describe('API smoke (positive paths only)', { tag: ['@smoke', '@api'] }, () => {
  test('public blog list is available', async ({ api }) => {
    expect((await api.listBlogs()).status()).toBe(200);
  });

  test('register -> login -> profile -> create blog', async ({ api, user, blogs }) => {
    expect((await api.profile(user.token)).status()).toBe(200);
    const blog = await blogs.create(user.token, buildBlog());
    expect((await api.getBlog(blog.id)).status()).toBe(200);
  });

  test('admin can list users', async ({ api, adminSession }) => {
    expect((await api.listUsers(adminSession.token)).status()).toBe(200);
  });
});
