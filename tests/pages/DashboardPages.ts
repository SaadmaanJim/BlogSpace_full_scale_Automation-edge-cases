import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import type { BlogInput } from '../data/factories';

export class DashboardPage extends BasePage {
  get welcome(): Locator { return this.byId('dashboard-welcome'); }
  get totalBlogs(): Locator { return this.byId('stat-total-blogs'); }
  get totalUsers(): Locator { return this.byId('stat-total-users'); }
  async open(): Promise<void> { await this.page.goto('/dashboard'); }
}

export class BlogsManagementPage extends BasePage {
  get table(): Locator { return this.byId('blogs-table'); }
  get confirmDialog(): Locator { return this.byId('modal'); }
  get confirmAccept(): Locator { return this.byId('confirm-accept'); }
  get confirmCancel(): Locator { return this.byId('confirm-cancel'); }
  row(title: string): Locator { return this.table.getByRole('row').filter({ hasText: title }); }
  editButton(id: string): Locator { return this.byId(`edit-${id}`); }
  deleteButton(id: string): Locator { return this.byId(`delete-${id}`); }
  async open(): Promise<void> { await this.page.goto('/dashboard/blogs'); }
}

export class BlogFormPage extends BasePage {
  get submit(): Locator { return this.byId('blog-submit'); }
  async openCreate(): Promise<void> { await this.page.goto('/dashboard/blogs/create'); }
  async openEdit(id: string): Promise<void> { await this.page.goto(`/dashboard/blogs/${id}/edit`); }
  async fill(v: BlogInput): Promise<void> {
    await this.field('blogTitle').fill(v.blogTitle);
    await this.field('category').selectOption(v.category);
    await this.field('blog').fill(v.blog);
  }
}

export class ProfilePage extends BasePage {
  get avatarInput(): Locator { return this.byId('avatar-input'); }
  get uploadButton(): Locator { return this.byId('avatar-upload'); }
  get avatarError(): Locator { return this.byId('avatar-error'); }
  get submit(): Locator { return this.byId('profile-submit'); }
  async open(): Promise<void> { await this.page.goto('/dashboard/profile'); }
}

export class ChangePasswordPage extends BasePage {
  get submit(): Locator { return this.byId('change-password-submit'); }
  async open(): Promise<void> { await this.page.goto('/dashboard/change-password'); }
  async change(password: string, confirm = password): Promise<void> {
    await this.field('password').fill(password);
    await this.field('confirmPassword').fill(confirm);
    await this.submit.click();
  }
}
