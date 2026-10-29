import { test, expect } from '../../fixtures';
import { TEXT_FILE, TINY_PNG } from '../../data/factories';
import { MAX_AVATAR_BYTES } from '../../config/env';
import { holdApi, isApi, mockApi } from '../../utils/network';

test.describe('Profile (user)', { tag: '@regression' }, () => {
  test('shows names, a read-only email and a read-only role', async ({ userApp, user }) => {
    await userApp.profile.open();
    await expect(userApp.profile.field('firstname')).toHaveValue(user.firstname);
    await expect(userApp.profile.field('lastname')).toHaveValue(user.lastname);
    await expect(userApp.profile.field('email')).toHaveValue(user.email);
    await expect(userApp.profile.field('email')).toBeDisabled();
    await expect(userApp.profile.field('role')).toHaveValue('user');
    await expect(userApp.profile.field('role')).toBeDisabled();
  });

  test('offers no way to change role or isActive', async ({ userApp }) => {
    await userApp.profile.open();
    await expect(userApp.page.getByLabel(/is\s*active|status/i)).toHaveCount(0);
    await expect(userApp.profile.field('role')).toBeDisabled();
  });

  test('updating names shows a toast and refreshes the navbar immediately', async ({ userApp }) => {
    await userApp.profile.open();
    await userApp.profile.field('firstname').fill('Renamed');
    await userApp.profile.field('lastname').fill('Person');
    await userApp.profile.submit.click();
    await expect(userApp.profile.toastSuccess).toHaveText('Profile updated.');
    await expect(userApp.navbar.username).toHaveText('Renamed Person');
    await userApp.page.reload();
    await expect(userApp.profile.field('firstname')).toHaveValue('Renamed');
  });

  test('sends only firstname and lastname', async ({ userApp }) => {
    await userApp.profile.open();
    const request = userApp.page.waitForRequest((r) => isApi('/users/profile/update')(new URL(r.url())) && r.method() === 'PUT');
    await userApp.profile.submit.click();
    expect(Object.keys((await request).postDataJSON()).sort()).toEqual(['firstname', 'lastname']);
  });

  test('requires a first and last name', async ({ userApp }) => {
    await userApp.profile.open();
    await userApp.profile.field('firstname').fill('');
    await userApp.profile.field('lastname').fill('');
    await userApp.profile.submit.click();
    await expect(userApp.profile.fieldError('firstname')).toHaveText('First name is required');
    await expect(userApp.profile.fieldError('lastname')).toHaveText('Last name is required');
  });

  test('shows the backend error on failure', async ({ userApp }) => {
    await mockApi(userApp.page, 'PUT', '/users/profile/update', 500, 'Internal server error.');
    await userApp.profile.open();
    await userApp.profile.submit.click();
    await expect(userApp.profile.formError).toHaveText('Internal server error.');
  });

  test.describe('avatar upload', () => {
    test('uploading a valid image updates the profile and the navbar without re-login', async ({ userApp }) => {
      await userApp.profile.open();
      await expect(userApp.navbar.avatarFallback).toBeVisible();
      await expect(userApp.profile.uploadButton).toBeDisabled();
      await userApp.profile.avatarInput.setInputFiles(TINY_PNG);
      await expect(userApp.page.getByRole('main').getByTestId('avatar-image')).toHaveAttribute('src', /^blob:/); // preview
      await userApp.profile.uploadButton.click();
      await expect(userApp.profile.toastSuccess).toHaveText('Profile image updated.');
      await expect(userApp.navbar.avatarImage).toBeVisible();
      await expect(userApp.navbar.avatarFallback).toHaveCount(0);
    });

    test('the uploaded avatar persists after a reload', async ({ userApp }) => {
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles(TINY_PNG);
      await userApp.profile.uploadButton.click();
      await expect(userApp.profile.toastSuccess).toBeVisible();
      await userApp.page.reload();
      await expect(userApp.navbar.avatarImage).toBeVisible();
    });

    test('uploads as multipart/form-data with the field name "image"', async ({ userApp }) => {
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles(TINY_PNG);
      const request = userApp.page.waitForRequest((r) => isApi('/users/profile/image')(new URL(r.url())) && r.method() === 'PATCH');
      await userApp.profile.uploadButton.click();
      const sent = await request;
      expect(sent.headers()['content-type']).toContain('multipart/form-data');
      expect(sent.postDataBuffer()?.toString('latin1')).toContain('name="image"');
    });

    test('rejects a non-image file on the client', async ({ userApp }) => {
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles(TEXT_FILE);
      await expect(userApp.profile.avatarError).toContainText('Only JPG, PNG or WEBP');
      await expect(userApp.profile.uploadButton).toBeDisabled();
    });

    test('rejects an image over the size limit on the client', async ({ userApp }) => {
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(MAX_AVATAR_BYTES + 1) });
      await expect(userApp.profile.avatarError).toContainText('smaller than 2 MB');
      await expect(userApp.profile.uploadButton).toBeDisabled();
    });

    test('shows a pending state while uploading', async ({ userApp }) => {
      const held = await holdApi(userApp.page, 'PATCH', '/users/profile/image');
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles(TINY_PNG);
      await userApp.profile.uploadButton.click();
      await expect(userApp.profile.uploadButton).toBeDisabled();
      await expect(userApp.profile.uploadButton).toHaveText('Uploading...');
      held.release();
      await expect(userApp.profile.toastSuccess).toBeVisible();
    });

    test('shows the backend error when the upload fails', async ({ userApp }) => {
      await mockApi(userApp.page, 'PATCH', '/users/profile/image', 500, 'Upload failed.');
      await userApp.profile.open();
      await userApp.profile.avatarInput.setInputFiles(TINY_PNG);
      await userApp.profile.uploadButton.click();
      await expect(userApp.profile.avatarError).toHaveText('Upload failed.');
    });
  });
});
