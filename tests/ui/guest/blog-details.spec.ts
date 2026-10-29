import { test, expect } from '../../fixtures';
import { uniqueSuffix } from '../../data/factories';

test.describe('Blog details (guest)', { tag: '@regression' }, () => {
  test('shows title, content, category, author and date', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token, { category: 'Automation' });
    await app.blogDetails.open(blog.id);
    await expect(app.blogDetails.heading).toHaveText(blog.blogTitle);
    await expect(app.blogDetails.article).toContainText(blog.blog.slice(0, 40));
    await expect(app.blogDetails.article).toContainText('Automation');
    await expect(app.blogDetails.article).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(app.blogDetails.article).toContainText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  });

  test('sets the browser tab title from the blog title', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await app.blogDetails.open(blog.id);
    await expect(app.page).toHaveTitle(new RegExp(blog.blogTitle));
  });

  test('shows "Blog Not Found" for an unknown id', async ({ app }) => {
    await app.blogDetails.open('999999999');
    await expect(app.blogDetails.notFound).toContainText('Blog Not Found');
  });

  test('shows "Blog Not Found" for a malformed id', async ({ app }) => {
    await app.blogDetails.open('abc');
    await expect(app.blogDetails.notFound).toBeVisible();
  });

  test('the back link returns to the blog list', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await app.blogDetails.open(blog.id);
    await app.page.getByRole('link', { name: /Back to blogs/ }).click();
    await expect(app.page).toHaveURL(/\/$/);
  });

  test('user-written HTML/script in title and content is rendered as text', { tag: '@security' }, async ({ app, user, blogs }) => {
    const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>';
    const blog = await blogs.create(user.token, { blogTitle: `XSS ${uniqueSuffix()} ${payload}`, blog: `Body ${payload} end of body` });
    await app.blogDetails.open(blog.id);
    await expect(app.blogDetails.article).toContainText('<script>window.__xss=1</script>');
    expect(await app.page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
