import type { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  protected byId(testId: string): Locator { return this.page.getByTestId(testId); }
  get toastSuccess(): Locator { return this.byId('toast-success'); }
  get toastError(): Locator { return this.byId('toast-error'); }
  get formError(): Locator { return this.byId('form-error'); }
  get loader(): Locator { return this.byId('loader'); }
  get emptyState(): Locator { return this.byId('empty-state'); }
  get accessDenied(): Locator { return this.byId('access-denied'); }
  fieldError(name: string): Locator { return this.byId(`${name}-error`); }
  field(name: string): Locator { return this.byId(`field-${name}`); }
}
