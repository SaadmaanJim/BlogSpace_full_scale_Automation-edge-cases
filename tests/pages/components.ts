import type { Locator, Page } from '@playwright/test';

export class Navbar {
  constructor(private readonly page: Page) {}
  get root(): Locator { return this.page.getByRole('banner'); }
  get searchInput(): Locator { return this.page.getByTestId('search-input'); }
  get loginLink(): Locator { return this.page.getByTestId('nav-login'); }
  get registerLink(): Locator { return this.page.getByTestId('nav-register'); }
  get profileButton(): Locator { return this.page.getByTestId('profile-menu-button'); }
  get username(): Locator { return this.page.getByTestId('navbar-username'); }
  get avatarImage(): Locator { return this.profileButton.getByTestId('avatar-image'); }
  get avatarFallback(): Locator { return this.profileButton.getByTestId('avatar-fallback'); }
  get sidebarToggle(): Locator { return this.page.getByTestId('sidebar-toggle'); }
  menuItem(name: string): Locator { return this.page.getByRole('menuitem', { name }); }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.searchInput.press('Enter');
  }
  async logout(): Promise<void> {
    await this.profileButton.click();
    await this.menuItem('Logout').click();
  }
}

export class Sidebar {
  constructor(private readonly page: Page) {}
  get root(): Locator { return this.page.getByTestId('sidebar'); }
  get links(): Locator { return this.root.getByRole('link'); }
  link(key: string): Locator { return this.page.getByTestId(`sidebar-${key}`); }
  get logoutButton(): Locator { return this.page.getByTestId('sidebar-logout'); }
}
