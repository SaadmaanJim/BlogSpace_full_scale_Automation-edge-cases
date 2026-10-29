import { test, expect } from '../fixtures';
import { TEXT_FILE, TINY_PNG, uniqueSuffix } from '../data/factories';
import { asRecord, idOf, listOf } from '../utils/json';

const userOf = (body: unknown) => { const r = asRecord(body); return asRecord(r.user ?? r.data ?? r); };

test.describe('Users API', { tag: ['@api', '@regression'] }, () => {
  test.describe('GET /users/profile', () => {
    test('returns the caller\'s own profile without secrets', async ({ api, user }) => {
      const res = await api.profile(user.token);
      expect(res.status()).toBe(200);
      const profile = userOf(await res.json());
      expect(profile.email).toBe(user.email);
      expect(profile).not.toHaveProperty('password');
      expect(JSON.stringify(profile)).not.toMatch(/resetToken/i);
    });

    test('401 without a token', async ({ api }) => {
      expect((await api.profile()).status()).toBe(401);
    });

    test('401 with a malformed token', async ({ api }) => {
      expect((await api.profile('garbage.token.value')).status()).toBe(401);
    });

    test('401 with a tampered token signature', async ({ api, user }) => {
      const tampered = `${user.token.slice(0, -4)}AAAA`;
      expect((await api.profile(tampered)).status()).toBe(401);
    });

    test('401 when the Authorization header is not a Bearer token', async ({ api, user }) => {
      const res = await api.call('GET', '/users/profile', { authorization: user.token });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('PUT /users/profile/update', () => {
    test('updates names and persists them', async ({ api, user }) => {
      const res = await api.updateProfile(user.token, { firstname: 'Renamed', lastname: 'Person' });
      expect(res.status()).toBe(200);
      const profile = userOf(await (await api.profile(user.token)).json());
      expect([profile.firstname, profile.lastname]).toEqual(['Renamed', 'Person']);
    });

    test('forbids changing the role (403)', async ({ api, user }) => {
      expect((await api.updateProfile(user.token, { role: 'admin' })).status()).toBe(403);
      expect(userOf(await (await api.profile(user.token)).json()).role).toBe('user');
    });

    test('forbids changing isActive', async ({ api, user }) => {
      expect([400, 403]).toContain((await api.updateProfile(user.token, { isActive: false })).status());
      expect((await api.login(user.email, user.password)).status()).toBe(200);
    });

    test('401 without a token', async ({ api }) => {
      expect((await api.call('PUT', '/users/profile/update', { data: { firstname: 'x' } })).status()).toBe(401);
    });
  });

  test.describe('PATCH /users/password', () => {
    test('changes the password: new works, old stops working', async ({ api, user }) => {
      const next = `new-${uniqueSuffix()}`;
      expect((await api.changePassword(user.token, next)).status()).toBe(200);
      expect((await api.login(user.email, next)).status()).toBe(200);
      expect((await api.login(user.email, user.password)).status()).toBe(401);
    });

    test('rejects a too-short password with 400', async ({ api, user }) => {
      expect((await api.changePassword(user.token, 'abc')).status()).toBe(400);
    });

    test('401 without a token', async ({ api }) => {
      expect((await api.call('PATCH', '/users/password', { data: { password: 'password123' } })).status()).toBe(401);
    });
  });

  test.describe('PATCH /users/profile/image', () => {
    test('accepts a valid PNG', async ({ api, user }) => {
      const res = await api.uploadAvatar(user.token, TINY_PNG);
      expect(res.status()).toBeLessThan(300);
    });

    test('rejects a non-image file with a 4xx', async ({ api, user }) => {
      const status = (await api.uploadAvatar(user.token, TEXT_FILE)).status();
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    });

    test('401 without a token', async ({ api }) => {
      expect((await api.call('PATCH', '/users/profile/image', { multipart: { image: TINY_PNG } })).status()).toBe(401);
    });
  });

  test.describe('admin endpoints', () => {
    test('GET /users lists users for an admin, without passwords', async ({ api, user, adminSession }) => {
      const res = await api.listUsers(adminSession.token);
      expect(res.status()).toBe(200);
      const users = listOf(await res.json());
      expect(users.length).toBeGreaterThan(0);
      expect(users.map(idOf)).toContain(user.id);
      for (const u of users) expect(u).not.toHaveProperty('password');
    });

    test('GET /users/:id returns the user to an admin', async ({ api, user, adminSession }) => {
      const res = await api.getUser(adminSession.token, user.id);
      expect(res.status()).toBe(200);
      expect(userOf(await res.json()).email).toBe(user.email);
    });

    test('GET /users/:id returns 404 for an unknown id', async ({ api, adminSession }) => {
      expect((await api.getUser(adminSession.token, '999999999')).status()).toBe(404);
    });

    test('PATCH /users/:id/status deactivates then reactivates', async ({ api, user, adminSession }) => {
      expect((await api.setUserStatus(adminSession.token, user.id, false)).status()).toBe(200);
      expect((await api.login(user.email, user.password)).status()).toBe(403);
      expect((await api.setUserStatus(adminSession.token, user.id, true)).status()).toBe(200);
      expect((await api.login(user.email, user.password)).status()).toBe(200);
    });
  });
});
