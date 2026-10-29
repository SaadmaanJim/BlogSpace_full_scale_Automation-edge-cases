import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class UsersPage extends BasePage {
  get table(): Locator { return this.byId('users-table'); }
  get details(): Locator { return this.byId('user-details'); }
  get modal(): Locator { return this.page.getByRole('dialog'); }
  row(email: string): Locator { return this.table.getByRole('row').filter({ hasText: email }); }
  viewButton(email: string): Locator { return this.row(email).getByRole('button', { name: 'View' }); }
  deactivateButton(email: string): Locator { return this.row(email).getByRole('button', { name: 'Deactivate', exact: true }); }
  activateButton(email: string): Locator { return this.row(email).getByRole('button', { name: 'Activate', exact: true }); }
  async open(): Promise<void> { await this.page.goto('/admin/users'); }
}
