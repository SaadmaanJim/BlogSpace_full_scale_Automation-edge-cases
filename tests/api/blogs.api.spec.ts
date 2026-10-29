import { test, expect } from '../fixtures';
import { buildBlog, uniqueSuffix } from '../data/factories';
import { asRecord, categoryOf, idOf, listOf, titleOf } from '../utils/json';

const idsIn = async (res: { json(): Promise<unknown> }) => listOf(await res.json()).map(idOf);

test.describe('Blogs API', { tag: ['@api', '@regression'] }, () => {
  test.describe('public reads', () => {
    test('GET /blogs works without authentication and returns a list', async ({ api }) => {
      const res = await api.listBlogs();
      expect(res.status()).toBe(200);
      expect(Array.isArray(listOf(await res.json()))).toBe(true);
    });

    test('GET /blogs/:id returns the blog', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      const res = await api.getBlog(blog.id);
      expect(res.status()).toBe(200);
      expect(JSON.stringify(await res.json())).toContain(blog.blogTitle);
    });

    test('GET /blogs/:id returns 404 for an unknown id', async ({ api }) => {
      expect((await api.getBlog('999999999')).status()).toBe(404);
    });

    test('GET /blogs/:id returns 400 for a non-numeric id', async ({ api }) => {
      expect((await api.getBlog('abc')).status()).toBe(400);
    });
  });

  test.describe('search and filter', () => {
    test('title search is partial and case-insensitive', async ({ api, user, blogs }) => {
      const s = uniqueSuffix();
      const blog = await blogs.create(user.token, { blogTitle: `Searchable ${s} post` });
      const res = await api.listBlogs({ title: s.toUpperCase() });
      expect(res.status()).toBe(200);
      expect(await idsIn(res)).toContain(blog.id);
    });

    test('a title that matches nothing returns an empty list', async ({ api }) => {
      const res = await api.listBlogs({ title: `nomatch-${uniqueSuffix()}` });
      expect(res.status()).toBe(200);
      expect(listOf(await res.json())).toHaveLength(0);
    });

    test('category filter returns only that category', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token, { category: 'DevOps' });
      const items = listOf(await (await api.listBlogs({ category: 'DevOps' })).json());
      expect(items.map(idOf)).toContain(blog.id);
      for (const item of items) expect(categoryOf(item)).toBe('DevOps');
    });

    test('title + category combine with AND semantics', async ({ api, user, blogs }) => {
      const s = uniqueSuffix();
      const blog = await blogs.create(user.token, { blogTitle: `Combo ${s}`, category: 'AI' });
      expect(await idsIn(await api.listBlogs({ title: s, category: 'AI' }))).toContain(blog.id);
      expect(await idsIn(await api.listBlogs({ title: s, category: 'DevOps' }))).not.toContain(blog.id);
    });

    test('a SQL-injection style query does not break the endpoint', async ({ api }) => {
      const res = await api.listBlogs({ title: "' OR 1=1 --" });
      expect(res.status()).toBeLessThan(500);
      expect(res.status()).not.toBe(0);
    });
  });

  test.describe('POST /blogs/create', () => {
    test('201 for an authenticated user', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      expect(blog.id).toMatch(/\S+/);
    });

    test('401 for a guest', async ({ api }) => {
      expect((await api.createBlog(undefined, { ...buildBlog() })).status()).toBe(401);
    });

    const invalid: [string, Record<string, unknown>][] = [
      ['an empty title', { blogTitle: '' }],
      ['empty content', { blog: '' }],
      ['an empty category', { category: '' }],
      ['a missing title', { blogTitle: undefined }],
      ['all-empty fields', { blogTitle: '', blog: '', category: '' }],
    ];
    for (const [label, patch] of invalid) {
      test(`400 for ${label}`, async ({ api, user }) => {
        expect((await api.createBlog(user.token, { ...buildBlog(), ...patch })).status()).toBe(400);
      });
    }

    test('ignores a spoofed userId: the author is the token owner', async ({ api, user, adminSession }) => {
      const res = await api.createBlog(user.token, { ...buildBlog(), userId: adminSession.id });
      expect(res.status()).toBe(201);
      const id = String(asRecord(asRecord(await res.json()).blog).id);
      // If the spoof had worked the admin would own it and the real owner could not edit it.
      expect((await api.updateBlog(user.token, id, { ...buildBlog() })).status()).toBe(200);
      await api.deleteBlog(adminSession.token, id); // manual cleanup: created outside the factory
    });
  });

  test.describe('PUT /blogs/update/:id', () => {
    test('the owner can update and the change persists', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      const next = buildBlog({ blogTitle: `Updated ${uniqueSuffix()}`, category: 'Automation' });
      expect((await api.updateBlog(user.token, blog.id, { ...next })).status()).toBe(200);
      expect(JSON.stringify(await (await api.getBlog(blog.id)).json())).toContain(next.blogTitle);
    });

    test('another user gets 403 and the blog is unchanged', async ({ api, user, otherUser, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.updateBlog(otherUser.token, blog.id, { ...buildBlog({ blogTitle: 'Hijacked' }) })).status()).toBe(403);
      expect(JSON.stringify(await (await api.getBlog(blog.id)).json())).toContain(blog.blogTitle);
    });

    test('404 for a missing blog', async ({ api, user }) => {
      expect((await api.updateBlog(user.token, '999999999', { ...buildBlog() })).status()).toBe(404);
    });

    test('401 for a guest', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.updateBlog(undefined, blog.id, { ...buildBlog() })).status()).toBe(401);
    });

    test('400 for an invalid body', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.updateBlog(user.token, blog.id, { blogTitle: '', blog: '', category: '' })).status()).toBe(400);
    });

    test('an admin can update any blog', async ({ api, user, adminSession, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.updateBlog(adminSession.token, blog.id, { ...buildBlog({ blogTitle: `Edited by admin ${uniqueSuffix()}` }) })).status()).toBe(200);
    });
  });

  test.describe('DELETE /blogs/delete/:id', () => {
    test('the owner can delete; afterwards it is gone', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.deleteBlog(user.token, blog.id)).status()).toBe(200);
      expect((await api.getBlog(blog.id)).status()).toBe(404);
    });

    test('another user gets 403 and the blog remains', async ({ api, user, otherUser, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.deleteBlog(otherUser.token, blog.id)).status()).toBe(403);
      expect((await api.getBlog(blog.id)).status()).toBe(200);
    });

    test('401 for a guest', async ({ api, user, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.deleteBlog(undefined, blog.id)).status()).toBe(401);
    });

    test('404 for a missing blog', async ({ api, user }) => {
      expect((await api.deleteBlog(user.token, '999999999')).status()).toBe(404);
    });

    test('an admin can delete any blog', async ({ api, user, adminSession, blogs }) => {
      const blog = await blogs.create(user.token);
      expect((await api.deleteBlog(adminSession.token, blog.id)).status()).toBe(200);
      expect((await api.getBlog(blog.id)).status()).toBe(404);
    });
  });

  test('deleting a user\'s blog does not affect another user\'s blogs', async ({ api, user, otherUser, blogs }) => {
    const mine = await blogs.create(user.token);
    const theirs = await blogs.create(otherUser.token);
    await api.deleteBlog(user.token, mine.id);
    expect((await api.getBlog(theirs.id)).status()).toBe(200);
    expect(titleOf(listOf(await (await api.listBlogs({ title: theirs.blogTitle })).json())[0] ?? {})).toBe(theirs.blogTitle);
  });
});
