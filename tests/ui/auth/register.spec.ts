import { test, expect } from '../../fixtures';
import { buildUser } from '../../data/factories';
import { holdApi, isApi, mockApi } from '../../utils/network';

test.describe('Registration', { tag: '@regression' }, () => {
  test('creates the account, redirects to login with a notice, and the new user can log in', async ({ app }) => {
    const user = buildUser();
    await app.register.open();
    await app.register.fill(user);
    await app.register.submit.click();
    await expect(app.page).toHaveURL(/\/login\?registered=1$/);
    await expect(app.login.notice).toBeVisible();
    await app.login.login(user.email, user.password);
    await expect(app.page).toHaveURL(/\/dashboard$/);
  });

  test('sends only firstname, lastname, email and password (no confirmPassword, no role)', async ({ app }) => {
    const user = buildUser();
    await app.register.open();
    await app.register.fill(user);
    const request = app.page.waitForRequest((r) => isApi('/auth/register')(new URL(r.url())) && r.method() === 'POST');
    await app.register.submit.click();
    expect(Object.keys((await request).postDataJSON()).sort()).toEqual(['email', 'firstname', 'lastname', 'password']);
  });

  test('empty submit shows every required-field message', async ({ app }) => {
    await app.register.open();
    await app.register.submit.click();
    const expected: Record<string, string> = {
      firstname: 'First name is required', lastname: 'Last name is required', email: 'Email is required',
      password: 'Password is required', confirmPassword: 'Please confirm your password',
    };
    for (const [field, message] of Object.entries(expected)) await expect(app.register.fieldError(field)).toHaveText(message);
  });

  test('rejects an invalid email', async ({ app }) => {
    await app.register.open();
    await app.register.fill({ ...buildUser(), email: 'not-an-email' });
    await app.register.submit.click();
    await expect(app.register.fieldError('email')).toHaveText('Enter a valid email address');
  });

  test('rejects a too-short password', async ({ app }) => {
    await app.register.open();
    await app.register.fill({ ...buildUser(), password: 'abc' });
    await app.register.submit.click();
    await expect(app.register.fieldError('password')).toHaveText(/at least \d+ characters/);
  });

  test('rejects a mismatching password confirmation', async ({ app }) => {
    await app.register.open();
    await app.register.fill({ ...buildUser(), confirmPassword: 'different123' });
    await app.register.submit.click();
    await expect(app.register.fieldError('confirmPassword')).toHaveText('Passwords do not match');
  });

  test('rejects whitespace-only names', async ({ app }) => {
    await app.register.open();
    await app.register.fill({ ...buildUser(), firstname: '   ', lastname: '   ' });
    await app.register.submit.click();
    await expect(app.register.fieldError('firstname')).toBeVisible();
    await expect(app.register.fieldError('lastname')).toBeVisible();
  });

  test('shows the backend message for a duplicate email', async ({ app, user }) => {
    await app.register.open();
    await app.register.fill({ ...buildUser(), email: user.email });
    await app.register.submit.click();
    await expect(app.register.formError).toHaveText('Email is already registered.');
    await expect(app.page).toHaveURL(/\/register$/);
  });

  test('shows the backend message for an unexpected 500', async ({ app }) => {
    await mockApi(app.page, 'POST', '/auth/register', 500, 'Internal server error.');
    await app.register.open();
    await app.register.fill(buildUser());
    await app.register.submit.click();
    await expect(app.register.formError).toHaveText('Internal server error.');
  });

  test('shows a pending state and prevents duplicate submissions', async ({ app }) => {
    const held = await holdApi(app.page, 'POST', '/auth/register');
    await app.register.open();
    await app.register.fill(buildUser());
    await app.register.submit.click();
    await expect(app.register.submit).toBeDisabled();
    await expect(app.register.submit).toHaveText('Creating account...');
    held.release();
    await expect(app.page).toHaveURL(/\/login\?registered=1$/);
    expect(held.count()).toBe(1);
  });

  test('password fields are masked', async ({ app }) => {
    await app.register.open();
    await expect(app.register.field('password')).toHaveAttribute('type', 'password');
    await expect(app.register.field('confirmPassword')).toHaveAttribute('type', 'password');
  });
});
