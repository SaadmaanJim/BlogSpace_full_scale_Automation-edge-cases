import { test, expect } from '../fixtures';
import { buildUser, uniqueSuffix } from '../data/factories';
import { asRecord } from '../utils/json';

test.describe('Auth API', { tag: ['@api', '@regression'] }, () => {
  test.describe('POST /auth/register', () => {
    test('creates a user and never returns the password', async ({ api }) => {
      const user = buildUser();
      const res = await api.register({ ...user });
      expect(res.status()).toBe(201);
      const body = asRecord(await res.json());
      expect(JSON.stringify(body)).not.toContain(user.password);
      expect(asRecord(body.user)).not.toHaveProperty('password');
    });

    test('rejects a duplicate email with 409', async ({ api, user }) => {
      const res = await api.register({ ...buildUser(), email: user.email });
      expect(res.status()).toBe(409);
    });

    const invalidPayloads: [string, Record<string, unknown>][] = [
      ['an empty firstname', { firstname: '' }],
      ['a missing lastname', { lastname: undefined }],
      ['a malformed email', { email: 'bad' }],
      ['a too-short password', { password: '123' }],
      ['all-empty fields', { firstname: '', lastname: '', email: '', password: '' }],
      ['a numeric password', { password: 123456789 }],
    ];
    for (const [label, patch] of invalidPayloads) {
      test(`rejects ${label} with 400`, async ({ api }) => {
        const res = await api.register({ ...buildUser(), ...patch });
        expect(res.status()).toBe(400);
      });
    }

    test('does not let a caller self-assign the admin role', async ({ api }) => {
      const user = buildUser();
      const res = await api.register({ ...user, role: 'admin' });
      expect([201, 400, 403]).toContain(res.status());
      if (res.status() === 201) {
        const session = await api.loginSession(user.email, user.password);
        const profile = asRecord(await (await api.profile(session.token)).json());
        expect(asRecord(profile.user ?? profile).role).toBe('user');
      }
    });

    test('stores emails case-insensitively (no duplicate by casing)', async ({ api, user }) => {
      const res = await api.register({ ...buildUser(), email: user.email.toUpperCase() });
      expect(res.status()).toBe(409);
    });
  });

  test.describe('POST /auth/login', () => {
    test('returns a JWT and the public user', async ({ api, user }) => {
      const res = await api.login(user.email, user.password);
      expect(res.status()).toBe(200);
      const body = asRecord(await res.json());
      expect(String(body.token).split('.')).toHaveLength(3);
      expect(asRecord(body.user)).not.toHaveProperty('password');
    });

    test('rejects a wrong password with 401', async ({ api, user }) => {
      expect((await api.login(user.email, 'wrong-password-1')).status()).toBe(401);
    });

    test('answers wrong-password and unknown-email identically (no account enumeration)', async ({ api, user }) => {
      const wrongPassword = await api.login(user.email, 'wrong-password-1');
      const unknownEmail = await api.login(`nobody.${uniqueSuffix()}@example.com`, 'password123');
      expect(unknownEmail.status()).toBe(wrongPassword.status());
      expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
    });

    test('rejects missing credentials with 400', async ({ api }) => {
      expect((await api.call('POST', '/auth/login', { data: {} })).status()).toBe(400);
    });

    test('rejects a deactivated account with 403', async ({ api, user, adminSession }) => {
      expect((await api.setUserStatus(adminSession.token, user.id, false)).status()).toBe(200);
      expect((await api.login(user.email, user.password)).status()).toBe(403);
    });

    test('is not vulnerable to a basic SQL injection payload', async ({ api }) => {
      const res = await api.login("' OR '1'='1", "' OR '1'='1");
      expect([400, 401]).toContain(res.status());
    });
  });

  test.describe('POST /auth/forgot-password', () => {
    test('answers registered and unknown emails identically', async ({ api, user }) => {
      const known = await api.forgotPassword(user.email);
      const unknown = await api.forgotPassword(`nobody.${uniqueSuffix()}@example.com`);
      expect(known.status()).toBe(200);
      expect(unknown.status()).toBe(200);
      expect(await known.json()).toEqual(await unknown.json());
    });

    test('rejects a malformed email with 400', async ({ api }) => {
      expect((await api.forgotPassword('bad')).status()).toBe(400);
    });
  });

  test.describe('PATCH /auth/reset-password/:token', () => {
    test('rejects an unknown token with 400', async ({ api }) => {
      expect((await api.resetPassword('not-a-real-token', 'newPassword123')).status()).toBe(400);
    });

    test('rejects a too-short password with 400', async ({ api }) => {
      expect((await api.resetPassword('not-a-real-token', 'abc')).status()).toBe(400);
    });
  });
});
