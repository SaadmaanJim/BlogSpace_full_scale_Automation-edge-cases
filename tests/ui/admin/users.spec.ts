import { test, expect } from '../../fixtures';
import { env } from '../../config/env';
import { holdApi, mockApi } from '../../utils/network';

test.describe('Admin: user management', { tag: '@regression' }, () => {
  test('lists a newly registered user as an active "user"', async ({ adminApp, user }) => {
    await adminApp.users.open();
    const row = adminApp.users.row(user.email);
    await expect(row).toBeVisible();
    await expect(row).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(row).toContainText('user');
    await expect(row).toContainText('Active');
    await expect(adminApp.users.table.getByRole('columnheader')).toHaveText(['User', 'Email', 'Role', 'Status', 'Action']);
  });

  test('View opens a modal with the user\'s details and can be closed', async ({ adminApp, user }) => {
    await adminApp.users.open();
    await adminApp.users.viewButton(user.email).click();
    await expect(adminApp.users.modal).toBeVisible();
    await expect(adminApp.users.details).toContainText(user.email);
    await expect(adminApp.users.details).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(adminApp.users.details).toContainText('Active');
    await adminApp.users.modal.getByRole('button', { name: 'Close' }).click();
    await expect(adminApp.users.modal).toHaveCount(0);
  });

  test('the user details modal closes with Escape', async ({ adminApp, user }) => {
    await adminApp.users.open();
    await adminApp.users.viewButton(user.email).click();
    await expect(adminApp.users.modal).toBeVisible();
    await adminApp.page.keyboard.press('Escape');
    await expect(adminApp.users.modal).toHaveCount(0);
  });

  test('deactivating updates the row immediately and blocks that user from logging in', async ({ adminApp, api, user }) => {
    await adminApp.users.open();
    await adminApp.users.deactivateButton(user.email).click();
    await expect(adminApp.users.toastSuccess).toContainText('deactivated');
    await expect(adminApp.users.row(user.email)).toContainText('Inactive');
    await expect(adminApp.users.activateButton(user.email)).toBeVisible();
    expect((await api.login(user.email, user.password)).status()).toBe(403);
  });

  test('activating a deactivated user restores access', async ({ adminApp, api, user, adminSession }) => {
    await api.setUserStatus(adminSession.token, user.id, false);
    await adminApp.users.open();
    await adminApp.users.activateButton(user.email).click();
    await expect(adminApp.users.toastSuccess).toContainText('activated');
    await expect(adminApp.users.row(user.email)).toContainText('Active');
    expect((await api.login(user.email, user.password)).status()).toBe(200);
  });

  test('an admin cannot deactivate their own account', async ({ adminApp }) => {
    await adminApp.users.open();
    await expect(adminApp.users.deactivateButton(env.admin.email)).toBeDisabled();
  });

  test('shows a pending state on the toggle button', async ({ adminApp, user }) => {
    const held = await holdApi(adminApp.page, 'PATCH', `/users/${user.id}/status`);
    await adminApp.users.open();
    await adminApp.users.deactivateButton(user.email).click();
    await expect(adminApp.users.row(user.email).getByRole('button', { name: 'Saving...' })).toBeDisabled();
    held.release();
    await expect(adminApp.users.toastSuccess).toBeVisible();
    expect(held.count()).toBe(1);
  });

  test('shows an error toast and keeps the old status when the backend fails', async ({ adminApp, user }) => {
    await mockApi(adminApp.page, 'PATCH', `/users/${user.id}/status`, 500, 'Internal server error.');
    await adminApp.users.open();
    await adminApp.users.deactivateButton(user.email).click();
    await expect(adminApp.users.toastError).toHaveText('Internal server error.');
    await expect(adminApp.users.row(user.email)).toContainText('Active');
  });

  test('the dashboard shows a numeric total-users statistic', async ({ adminApp }) => {
    await adminApp.dashboard.open();
    await expect(adminApp.dashboard.totalUsers).toHaveText(/^\d+$/);
  });
});
