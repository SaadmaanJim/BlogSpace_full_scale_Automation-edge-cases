import { test, expect } from '../../fixtures';
import { env } from '../../config/env';
import { holdApi } from '../../utils/network';
import { findResetLink } from '../../utils/resetLink';

test.describe('Forgot password', { tag: '@regression' }, () => {
  test('empty and malformed emails are rejected on the client', async ({ app }) => {
    await app.forgot.open();
    await app.forgot.submit.click();
    await expect(app.forgot.fieldError('email')).toHaveText('Email is required');
    await app.forgot.field('email').fill('bad');
    await app.forgot.submit.click();
    await expect(app.forgot.fieldError('email')).toHaveText('Enter a valid email address');
  });

  test('shows a success message for a registered email', async ({ app, user }) => {
    await app.forgot.open();
    await app.forgot.request(user.email);
    await expect(app.forgot.success).toContainText(/reset link/i);
  });

  test('shows the same message for an unknown email (no account enumeration)', async ({ app, user }) => {
    await app.forgot.open();
    await app.forgot.request(user.email);
    await expect(app.forgot.success).toBeVisible();
    const known = await app.forgot.success.innerText();
    await app.forgot.open();
    await app.forgot.request('nobody.here@example.com');
    await expect(app.forgot.success).toBeVisible();
    expect(await app.forgot.success.innerText()).toBe(known);
  });

  test('shows a pending state while sending', async ({ app, user }) => {
    const held = await holdApi(app.page, 'POST', '/auth/forgot-password');
    await app.forgot.open();
    await app.forgot.request(user.email);
    await expect(app.forgot.submit).toBeDisabled();
    await expect(app.forgot.submit).toHaveText('Sending...');
    held.release();
    await expect(app.forgot.success).toBeVisible();
  });

  test('has a link back to login', async ({ app }) => {
    await app.forgot.open();
    await app.page.getByRole('link', { name: 'Back to Login' }).click();
    await expect(app.page).toHaveURL(/\/login$/);
  });
});

test.describe('Reset password', { tag: '@regression' }, () => {
  test('a mismatching confirmation is rejected', async ({ app }) => {
    await app.reset.open('some-token');
    await app.reset.reset('newPassword123', 'different123');
    await expect(app.reset.fieldError('confirmPassword')).toHaveText('Passwords do not match');
  });

  test('a too-short password is rejected', async ({ app }) => {
    await app.reset.open('some-token');
    await app.reset.reset('abc');
    await expect(app.reset.fieldError('password')).toHaveText(/at least \d+ characters/);
  });

  test('an invalid or expired token shows the backend message', async ({ app }) => {
    await app.reset.open('not-a-real-token');
    await app.reset.reset('newPassword123');
    await expect(app.reset.formError).toHaveText('Reset link is invalid or has expired.');
  });
});

test.describe('Forgotten-password journey (needs the backend log)', { tag: ['@regression', '@e2e'] }, () => {
  test.skip(!env.resetLogPath, 'Set RESET_LOG_PATH to the backend log file to run the reset-link journey (see docs/TESTING.md).');

  test('login -> forgot password -> reset link -> new password -> login', async ({ app, api, user }) => {
    const newPassword = 'brandNewPass123';
    await app.forgot.open();
    await app.forgot.request(user.email);
    await expect(app.forgot.success).toBeVisible();

    await expect.poll(() => findResetLink(user.email), { timeout: 15_000, message: 'reset link in backend log' }).not.toBeNull();
    const resetPath = new URL(findResetLink(user.email) as string).pathname;

    await app.page.goto(resetPath);
    await app.reset.reset(newPassword);
    await expect(app.page).toHaveURL(/\/login\?reset=1$/);
    await expect(app.login.notice).toContainText('Password successfully changed');

    await app.login.login(user.email, newPassword);
    await expect(app.page).toHaveURL(/\/dashboard$/);
    expect((await api.login(user.email, user.password)).status()).toBe(401); // old password is dead

    await app.page.goto(resetPath); // the link is single-use
    await app.reset.reset('anotherPass123');
    await expect(app.reset.formError).toHaveText('Reset link is invalid or has expired.');
  });
});
