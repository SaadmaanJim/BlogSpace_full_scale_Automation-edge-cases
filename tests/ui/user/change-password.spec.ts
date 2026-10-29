import { test, expect } from '../../fixtures';
import { holdApi, isApi, mockApi } from '../../utils/network';

test.describe('Change password', { tag: ['@regression', '@security'] }, () => {
  test('changes the password: toast, cleared form, new works, old stops working', async ({ userApp, api, user }) => {
    const next = 'brandNewPass123';
    await userApp.changePassword.open();
    await userApp.changePassword.change(next);
    await expect(userApp.changePassword.toastSuccess).toHaveText('Password changed successfully.');
    await expect(userApp.changePassword.field('password')).toHaveValue('');
    expect((await api.login(user.email, next)).status()).toBe(200);
    expect((await api.login(user.email, user.password)).status()).toBe(401);
  });

  test('the current session stays valid after the change', async ({ userApp }) => {
    await userApp.changePassword.open();
    await userApp.changePassword.change('brandNewPass123');
    await expect(userApp.changePassword.toastSuccess).toBeVisible();
    await userApp.dashboard.open();
    await expect(userApp.dashboard.welcome).toBeVisible();
  });

  test('requires both fields', async ({ userApp }) => {
    await userApp.changePassword.open();
    await userApp.changePassword.submit.click();
    await expect(userApp.changePassword.fieldError('password')).toHaveText('Password is required');
    await expect(userApp.changePassword.fieldError('confirmPassword')).toHaveText('Please confirm your password');
  });

  test('rejects a too-short password', async ({ userApp }) => {
    await userApp.changePassword.open();
    await userApp.changePassword.change('abc');
    await expect(userApp.changePassword.fieldError('password')).toHaveText(/at least \d+ characters/);
  });

  test('rejects a mismatching confirmation without calling the API', async ({ userApp }) => {
    const calls: string[] = [];
    userApp.page.on('request', (r) => { if (isApi('/users/password')(new URL(r.url()))) calls.push(r.url()); });
    await userApp.changePassword.open();
    await userApp.changePassword.change('brandNewPass123', 'different123');
    await expect(userApp.changePassword.fieldError('confirmPassword')).toHaveText('Passwords do not match');
    expect(calls).toHaveLength(0);
  });

  test('sends only the new password', async ({ userApp }) => {
    await userApp.changePassword.open();
    await userApp.changePassword.field('password').fill('brandNewPass123');
    await userApp.changePassword.field('confirmPassword').fill('brandNewPass123');
    const request = userApp.page.waitForRequest((r) => isApi('/users/password')(new URL(r.url())) && r.method() === 'PATCH');
    await userApp.changePassword.submit.click();
    expect(Object.keys((await request).postDataJSON())).toEqual(['password']);
  });

  test('shows a pending state', async ({ userApp }) => {
    const held = await holdApi(userApp.page, 'PATCH', '/users/password');
    await userApp.changePassword.open();
    await userApp.changePassword.change('brandNewPass123');
    await expect(userApp.changePassword.submit).toBeDisabled();
    await expect(userApp.changePassword.submit).toHaveText('Updating...');
    held.release();
    await expect(userApp.changePassword.toastSuccess).toBeVisible();
  });

  test('shows the backend error on failure', async ({ userApp }) => {
    await mockApi(userApp.page, 'PATCH', '/users/password', 500, 'Internal server error.');
    await userApp.changePassword.open();
    await userApp.changePassword.change('brandNewPass123');
    await expect(userApp.changePassword.formError).toHaveText('Internal server error.');
  });

  test('the fields are masked', async ({ userApp }) => {
    await userApp.changePassword.open();
    await expect(userApp.changePassword.field('password')).toHaveAttribute('type', 'password');
    await expect(userApp.changePassword.field('confirmPassword')).toHaveAttribute('type', 'password');
  });
});
