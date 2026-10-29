import { test, expect } from '../fixtures';
import type { ApiClient } from './ApiClient';
import { buildBlog } from '../data/factories';

type Role = 'guest' | 'user' | 'admin';
interface Ctx { victimId: string; blogId: string }
interface Case { name: string; expected: Record<Role, number>; run: (api: ApiClient, token: string | undefined, ctx: Ctx) => ReturnType<ApiClient['listUsers']> }

/** Role x endpoint matrix. The "user" role is a NON-owner; the victim owns the resources. */
const matrix: Case[] = [
  { name: 'GET /users', expected: { guest: 401, user: 403, admin: 200 }, run: (api, t) => api.listUsers(t) },
  { name: 'GET /users/:id', expected: { guest: 401, user: 403, admin: 200 }, run: (api, t, c) => api.getUser(t, c.victimId) },
  { name: 'PATCH /users/:id/status', expected: { guest: 401, user: 403, admin: 200 }, run: (api, t, c) => api.setUserStatus(t, c.victimId, true) },
  { name: 'GET /users/profile', expected: { guest: 401, user: 200, admin: 200 }, run: (api, t) => api.profile(t) },
  { name: 'POST /blogs/create', expected: { guest: 401, user: 201, admin: 201 }, run: (api, t) => api.createBlog(t, { ...buildBlog() }) },
  { name: "PUT /blogs/update/:id (someone else's blog)", expected: { guest: 401, user: 403, admin: 200 }, run: (api, t, c) => api.updateBlog(t, c.blogId, { ...buildBlog() }) },
  { name: "DELETE /blogs/delete/:id (someone else's blog)", expected: { guest: 401, user: 403, admin: 200 }, run: (api, t, c) => api.deleteBlog(t, c.blogId) },
];

test.describe('Authorization matrix', { tag: ['@api', '@security', '@regression'] }, () => {
  for (const testCase of matrix) {
    for (const role of ['guest', 'user', 'admin'] as const) {
      test(`${testCase.name} as ${role} -> ${testCase.expected[role]}`, async ({ api, user, otherUser, adminSession, blogs }) => {
        const blog = await blogs.create(otherUser.token);
        const token = { guest: undefined, user: user.token, admin: adminSession.token }[role];
        const res = await testCase.run(api, token, { victimId: otherUser.id, blogId: blog.id });
        expect(res.status()).toBe(testCase.expected[role]);
      });
    }
  }

  test('a normal user cannot promote themselves through any profile endpoint', async ({ api, user }) => {
    await api.updateProfile(user.token, { role: 'admin' });
    const res = await api.listUsers(user.token);
    expect(res.status()).toBe(403);
  });

  test('a deactivated user cannot log in again', async ({ api, user, adminSession }) => {
    await api.setUserStatus(adminSession.token, user.id, false);
    expect((await api.login(user.email, user.password)).status()).toBe(403);
  });
});
