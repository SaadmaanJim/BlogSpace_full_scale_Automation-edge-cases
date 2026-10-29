import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  get cards(): Locator { return this.byId('blog-card'); }
  get grid(): Locator { return this.byId('blog-grid'); }
  cardWithTitle(title: string): Locator { return this.cards.filter({ hasText: title }); }
  category(name: string): Locator { return this.byId(`category-${name}`); }
  async open(params: { title?: string; category?: string } = {}): Promise<void> {
    const qs = new URLSearchParams();
    if (params.title) qs.set('title', params.title);
    if (params.category) qs.set('category', params.category);
    const query = qs.toString();
    await this.page.goto(query ? `/?${query}` : '/');
  }
}

export class BlogDetailsPage extends BasePage {
  get article(): Locator { return this.byId('blog-details'); }
  get heading(): Locator { return this.page.getByRole('heading', { level: 1 }); }
  get notFound(): Locator { return this.byId('blog-not-found'); }
  async open(id: string): Promise<void> { await this.page.goto(`/blogs/${id}`); }
}
