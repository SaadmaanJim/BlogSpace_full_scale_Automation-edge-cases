import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  get notice(): Locator { return this.byId('notice'); }
  get submit(): Locator { return this.byId('login-submit'); }
  get forgotLink(): Locator { return this.page.getByRole('link', { name: 'Forgot Password?' }); }
  get registerLink(): Locator { return this.page.getByRole('main').getByRole('link', { name: 'Register' }); }
  async open(query = ''): Promise<void> { await this.page.goto(`/login${query}`); }
  async login(email: string, password: string): Promise<void> {
    await this.field('email').fill(email);
    await this.field('password').fill(password);
    await this.submit.click();
  }
}

export class RegisterPage extends BasePage {
  get submit(): Locator { return this.byId('register-submit'); }
  async open(): Promise<void> { await this.page.goto('/register'); }
  async fill(v: { firstname: string; lastname: string; email: string; password: string; confirmPassword?: string }): Promise<void> {
    await this.field('firstname').fill(v.firstname);
    await this.field('lastname').fill(v.lastname);
    await this.field('email').fill(v.email);
    await this.field('password').fill(v.password);
    await this.field('confirmPassword').fill(v.confirmPassword ?? v.password);
  }
}

export class ForgotPasswordPage extends BasePage {
  get submit(): Locator { return this.byId('forgot-submit'); }
  get success(): Locator { return this.byId('form-success'); }
  async open(): Promise<void> { await this.page.goto('/forgot-password'); }
  async request(email: string): Promise<void> { await this.field('email').fill(email); await this.submit.click(); }
}

export class ResetPasswordPage extends BasePage {
  get submit(): Locator { return this.byId('reset-submit'); }
  async open(token: string): Promise<void> { await this.page.goto(`/reset-password/${token}`); }
  async reset(password: string, confirm = password): Promise<void> {
    await this.field('password').fill(password);
    await this.field('confirmPassword').fill(confirm);
    await this.submit.click();
  }
}
