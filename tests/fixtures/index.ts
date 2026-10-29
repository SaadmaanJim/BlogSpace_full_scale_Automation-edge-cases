import { test as base, expect, type Browser, type Page, type PlaywrightTestOptions } from '@playwright/test';
import { ApiClient, type CreatedBlog, type Session } from '../api/ApiClient';
import { env } from '../config/env';
import { buildUser, type BlogInput } from '../data/factories';
import { idOf, listOf, titleOf } from '../utils/json';
import { pagesFor, type AppPages } from '../pages';
import { buildStorageState } from '../utils/storage';

interface BlogFactory {
  create(token: string, overrides?: Partial<BlogInput>): Promise<CreatedBlog>;
  /** Register a title for cleanup when the blog was created through the UI (no id known). */
  trackTitle(title: string): void;
}
type ContextOptions = Pick<PlaywrightTestOptions, 'viewport' | 'isMobile' | 'hasTouch' | 'deviceScaleFactor' | 'userAgent' | 'baseURL'>;

interface TestFixtures {
  api: ApiClient;
  /** A brand-new normal user (registered through the API) owned by this test only. */
  user: Session;
  /** A second brand-new normal user, for cross-user / ownership scenarios. */
  otherUser: Session;
  /** Creates blogs through the API and deletes them (as admin) after the test. */
  blogs: BlogFactory;
  app: AppPages; // guest page objects
  userPage: Page; // browser page already logged in as `user`
  userApp: AppPages;
  adminPage: Page; // browser page already logged in as the seeded admin
  adminApp: AppPages;
}
interface WorkerFixtures { adminSession: Session }

async function authedPage(browser: Browser, options: ContextOptions, token: string): Promise<Page> {
  // storageState injects the token + cookie, bypassing the login UI. Device options are forwarded so
  // the "mobile" project still emulates a phone.
  const context = await browser.newContext({ ...options, storageState: buildStorageState(token) });
  return context.newPage();
}
const forwardedOptions = ({ viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL }: ContextOptions): ContextOptions => ({
  viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL,
});

export const test = base.extend<TestFixtures, WorkerFixtures>({
  adminSession: [
    async ({ playwright }, use) => {
      const context = await playwright.request.newContext();
      await use(await new ApiClient(context).loginSession(env.admin.email, env.admin.password));
      await context.dispose();
    },
    { scope: 'worker' },
  ],

  api: async ({ request }, use) => { await use(new ApiClient(request)); },
  user: async ({ api }, use) => { await use(await api.registerAndLogin(buildUser())); },
  otherUser: async ({ api }, use) => { await use(await api.registerAndLogin(buildUser({ firstname: 'Other' }))); },

  blogs: async ({ api, adminSession }, use) => {
    const created: string[] = [];
    const titles: string[] = [];
    await use({
      trackTitle: (title) => { titles.push(title); },
      create: async (token, overrides) => {
        const blog = await api.createBlogAs(token, overrides);
        created.push(blog.id);
        return blog;
      },
    });
    for (const id of created) await api.deleteBlog(adminSession.token, id); // best-effort cleanup
    for (const title of titles) {
      const found = listOf(await (await api.listBlogs({ title })).json()).filter((b) => titleOf(b) === title);
      for (const blog of found) await api.deleteBlog(adminSession.token, idOf(blog));
    }
  },

  app: async ({ page }, use) => { await use(pagesFor(page)); },

  userPage: async ({ browser, user, viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL }, use) => {
    const page = await authedPage(browser, forwardedOptions({ viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL }), user.token);
    await use(page);
    await page.context().close();
  },
  userApp: async ({ userPage }, use) => { await use(pagesFor(userPage)); },

  adminPage: async ({ browser, adminSession, viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL }, use) => {
    const page = await authedPage(browser, forwardedOptions({ viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, baseURL }), adminSession.token);
    await use(page);
    await page.context().close();
  },
  adminApp: async ({ adminPage }, use) => { await use(pagesFor(adminPage)); },
});

export { expect };
