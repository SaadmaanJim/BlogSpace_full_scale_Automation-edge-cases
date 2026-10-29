import { test, expect } from '../../fixtures';
import { holdApi, isApi, mockApi } from '../../utils/network';

test.describe('Login', { tag: '@regression' }, () => {
  test('valid credentials land on the dashboard with the user name in the navbar', async ({ app, user }) => {
    await app.login.open();
    await app.login.login(user.email, user.password);
    await expect(app.page).toHaveURL(/\/dashboard$/);
    await expect(app.dashboard.welcome).toContainText(user.firstname);
    await expect(app.navbar.username).toContainText(`${user.firstname} ${user.lastname}`);
  });

  test('pressing Enter in the password field submits the form', async ({ app, user }) => {
    await app.login.open();
    await app.login.field('email').fill(user.email);
    await app.login.field('password').fill(user.password);
    await app.login.field('password').press('Enter');
    await expect(app.page).toHaveURL(/\/dashboard$/);
  });

  test('empty submit shows required-field messages', async ({ app }) => {
    await app.login.open();
    await app.login.submit.click();
    await expect(app.login.fieldError('email')).toHaveText('Email is required');
    await expect(app.login.fieldError('password')).toHaveText('Password is required');
  });

  test('a malformed email is rejected on the client without calling the API', async ({ app }) => {
    const calls: string[] = [];
    app.page.on('request', (r) => { if (isApi('/auth/login')(new URL(r.url()))) calls.push(r.url()); });
    await app.login.open();
    await app.login.login("' OR 1=1 --", 'password123');
    await expect(app.login.fieldError('email')).toHaveText('Enter a valid email address');
    expect(calls).toHaveLength(0);
  });

  test('a wrong password shows the backend message and stays on /login', async ({ app, user }) => {
    await app.login.open();
    await app.login.login(user.email, 'wrong-password-1');
    await expect(app.login.formError).toHaveText('Invalid email or password.');
    await expect(app.page).toHaveURL(/\/login/);
  });

  test('an unknown email shows the same message (no account enumeration)', async ({ app }) => {
    await app.login.open();
    await app.login.login('nobody.here@example.com', 'password123');
    await expect(app.login.formError).toHaveText('Invalid email or password.');
  });

  test('a deactivated account is told so', async ({ app, api, user, adminSession }) => {
    await api.setUserStatus(adminSession.token, user.id, false);
    await app.login.open();
    await app.login.login(user.email, user.password);
    await expect(app.login.formError).toHaveText('Your account has been deactivated.');
  });

  test('shows a pending state and sends only one request on a double click', async ({ app, user }) => {
    const held = await holdApi(app.page, 'POST', '/auth/login');
    await app.login.open();
    await app.login.field('email').fill(user.email);
    await app.login.field('password').fill(user.password);
    await app.login.submit.click();
    await expect(app.login.submit).toBeDisabled();
    await expect(app.login.submit).toHaveText('Logging in...');
    await app.login.submit.dblclick({ force: true });
    held.release();
    await expect(app.page).toHaveURL(/\/dashboard$/);
    expect(held.count()).toBe(1);
  });

  test('shows a friendly message when the server is unreachable', async ({ app, user }) => {
    await app.page.route(isApi('/auth/login'), (route) => route.abort());
    await app.login.open();
    await app.login.login(user.email, user.password);
    await expect(app.login.formError).toContainText('Cannot reach the server');
  });

  test('shows the backend message for an unexpected 500', async ({ app, user }) => {
    await mockApi(app.page, 'POST', '/auth/login', 500, 'Internal server error.');
    await app.login.open();
    await app.login.login(user.email, user.password);
    await expect(app.login.formError).toHaveText('Internal server error.');
  });

  test('the password field is masked', async ({ app }) => {
    await app.login.open();
    await expect(app.login.field('password')).toHaveAttribute('type', 'password');
  });

  test('links lead to Forgot Password and Register', async ({ app }) => {
    await app.login.open();
    await app.login.forgotLink.click();
    await expect(app.page).toHaveURL(/\/forgot-password$/);
    await app.login.open();
    await app.login.registerLink.click();
    await expect(app.page).toHaveURL(/\/register$/);
  });

  const notices: [string, string, string][] = [
    ['?registered=1', 'after registration', 'Account created. Please log in.'],
    ['?reset=1', 'after a password reset', 'Password successfully changed. Please log in.'],
    ['?expired=1', 'after a session expires', 'Your session expired. Please log in again.'],
  ];
  for (const [query, when, text] of notices) {
    test(`shows a notice ${when}`, async ({ app }) => {
      await app.login.open(query);
      await expect(app.login.notice).toHaveText(text);
    });
  }
});
