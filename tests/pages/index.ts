import type { Page } from '@playwright/test';
import { UsersPage } from './AdminPages';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './AuthPages';
import { Navbar, Sidebar } from './components';
import { BlogFormPage, BlogsManagementPage, ChangePasswordPage, DashboardPage, ProfilePage } from './DashboardPages';
import { BlogDetailsPage, HomePage } from './PublicPages';

/** One entry point for every page object bound to a Playwright page. */
export function pagesFor(page: Page) {
  return {
    page,
    navbar: new Navbar(page),
    sidebar: new Sidebar(page),
    login: new LoginPage(page),
    register: new RegisterPage(page),
    forgot: new ForgotPasswordPage(page),
    reset: new ResetPasswordPage(page),
    home: new HomePage(page),
    blogDetails: new BlogDetailsPage(page),
    dashboard: new DashboardPage(page),
    blogs: new BlogsManagementPage(page),
    blogForm: new BlogFormPage(page),
    profile: new ProfilePage(page),
    changePassword: new ChangePasswordPage(page),
    users: new UsersPage(page),
  };
}
export type AppPages = ReturnType<typeof pagesFor>;
