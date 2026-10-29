import { test, expect } from '../../fixtures';
import { CATEGORIES } from '../../config/env';
import { mockApi } from '../../utils/network';
import { uniqueSuffix } from '../../data/factories';

const DATE_PATTERN = /[A-Z][a-z]{2} \d{1,2}, \d{4}/;

test.describe('Homepage (guest)', { tag: '@regression' }, () => {
  test('renders a card with title, category, author, date and a Read More link', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token, { category: 'Testing' });
    await app.home.open({ title: blog.blogTitle });
    const card = app.home.cardWithTitle(blog.blogTitle);
    await expect(card).toBeVisible();
    await expect(card).toContainText('Testing');
    await expect(card).toContainText(`${user.firstname} ${user.lastname}`);
    await expect(card).not.toContainText('Unknown author');
    await expect(card).toContainText(DATE_PATTERN);
    await expect(card.getByRole('link', { name: /Read More/ })).toHaveAttribute('href', `/blogs/${blog.id}`);
  });

  test('shows guest navigation: Login/Register, search, no sidebar or profile menu', async ({ app }) => {
    await app.home.open();
    await expect(app.navbar.loginLink).toBeVisible();
    await expect(app.navbar.registerLink).toBeVisible();
    await expect(app.navbar.searchInput).toBeVisible();
    await expect(app.navbar.profileButton).toHaveCount(0);
    await expect(app.sidebar.root).toHaveCount(0);
    await expect(app.page.getByRole('contentinfo')).toBeVisible();
  });

  test('shows the All pill plus every category, with All selected by default', async ({ app }) => {
    await app.home.open();
    await expect(app.home.category('All')).toHaveAttribute('aria-pressed', 'true');
    for (const name of CATEGORIES) await expect(app.home.category(name)).toBeVisible();
  });

  test('search narrows the list by title and keeps the term in the URL', async ({ app, user, blogs }) => {
    const s = uniqueSuffix();
    const match = await blogs.create(user.token, { blogTitle: `Findme ${s}` });
    const other = await blogs.create(user.token, { blogTitle: `Different ${uniqueSuffix()}` });
    await app.home.open();
    await app.navbar.search(s);
    await expect(app.page).toHaveURL(new RegExp(`title=${s}`));
    await expect(app.home.cardWithTitle(match.blogTitle)).toBeVisible();
    await expect(app.home.cardWithTitle(other.blogTitle)).toHaveCount(0);
  });

  test('a deep link pre-fills the search box and applies the filter', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await app.home.open({ title: blog.blogTitle });
    await expect(app.navbar.searchInput).toHaveValue(blog.blogTitle);
    await expect(app.home.cardWithTitle(blog.blogTitle)).toBeVisible();
  });

  test('category pills filter, and combine with the search term', async ({ app, user, blogs }) => {
    const s = uniqueSuffix();
    const testing = await blogs.create(user.token, { blogTitle: `Cat ${s} one`, category: 'Testing' });
    const devops = await blogs.create(user.token, { blogTitle: `Cat ${s} two`, category: 'DevOps' });
    await app.home.open({ title: s });
    await expect(app.home.cardWithTitle(testing.blogTitle)).toBeVisible();
    await expect(app.home.cardWithTitle(devops.blogTitle)).toBeVisible();

    await app.home.category('DevOps').click();
    await expect(app.page).toHaveURL(/category=DevOps/);
    await expect(app.page).toHaveURL(new RegExp(`title=${s}`));
    await expect(app.home.category('DevOps')).toHaveAttribute('aria-pressed', 'true');
    await expect(app.home.cardWithTitle(devops.blogTitle)).toBeVisible();
    await expect(app.home.cardWithTitle(testing.blogTitle)).toHaveCount(0);

    await app.home.category('All').click();
    await expect(app.page).not.toHaveURL(/category=/);
    await expect(app.home.cardWithTitle(testing.blogTitle)).toBeVisible();
  });

  test('shows "No blogs found." when nothing matches', async ({ app }) => {
    await app.home.open({ title: `nomatch-${uniqueSuffix()}` });
    await expect(app.home.emptyState).toContainText('No blogs found.');
  });

  test('shows the backend error message when the list cannot be loaded', async ({ app }) => {
    await mockApi(app.page, 'GET', '/blogs', 500, 'Database is down');
    await app.home.open();
    await expect(app.home.formError).toContainText("Database is down");
    await expect(app.page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('Read More opens the blog details page', async ({ app, user, blogs }) => {
    const blog = await blogs.create(user.token);
    await app.home.open({ title: blog.blogTitle });
    await app.home.cardWithTitle(blog.blogTitle).getByRole('link', { name: /Read More/ }).click();
    await expect(app.page).toHaveURL(new RegExp(`/blogs/${blog.id}$`));
  });

  test('user-written HTML in a title is shown as text, never executed', { tag: '@security' }, async ({ app, user, blogs }) => {
    const s = uniqueSuffix();
    const payload = '<img src=x onerror="window.__xss=1">';
    await blogs.create(user.token, { blogTitle: `XSS ${s} ${payload}` });
    await app.home.open({ title: `XSS ${s}` });
    await expect(app.home.cards.first()).toContainText('<img src=x');
    expect(await app.page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
