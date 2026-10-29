import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { env } from '../config/env';
import { buildBlog, buildUser, type BlogInput, type NewUser, type UploadFile } from '../data/factories';
import { asRecord } from '../utils/json';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface CallOptions { token?: string; authorization?: string; data?: unknown; multipart?: Record<string, UploadFile>; params?: Record<string, string> }

export interface Session extends NewUser { id: string; token: string }
export interface CreatedBlog extends BlogInput { id: string }

/** Thin typed wrapper over the REST API. Used for test setup/teardown and for the API suites themselves. */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  call(method: Method, path: string, o: CallOptions = {}): Promise<APIResponse> {
    return this.request.fetch(`${env.apiUrl}${path}`, {
      method,
      headers: o.authorization ? { Authorization: o.authorization } : o.token ? { Authorization: `Bearer ${o.token}` } : undefined,
      data: o.data,
      multipart: o.multipart,
      params: o.params,
    });
  }

  // auth
  register = (data: Record<string, unknown>) => this.call('POST', '/auth/register', { data });
  login = (email: string, password: string) => this.call('POST', '/auth/login', { data: { email, password } });
  forgotPassword = (email: string) => this.call('POST', '/auth/forgot-password', { data: { email } });
  resetPassword = (token: string, password: string) => this.call('PATCH', `/auth/reset-password/${token}`, { data: { password } });
  // users
  profile = (token?: string) => this.call('GET', '/users/profile', { token });
  updateProfile = (token: string, data: Record<string, unknown>) => this.call('PUT', '/users/profile/update', { token, data });
  changePassword = (token: string, password: string) => this.call('PATCH', '/users/password', { token, data: { password } });
  uploadAvatar = (token: string, image: UploadFile) => this.call('PATCH', '/users/profile/image', { token, multipart: { image } });
  listUsers = (token?: string) => this.call('GET', '/users', { token });
  getUser = (token: string | undefined, id: string) => this.call('GET', `/users/${id}`, { token });
  setUserStatus = (token: string | undefined, id: string, isActive: boolean) => this.call('PATCH', `/users/${id}/status`, { token, data: { isActive } });
  // blogs
  createBlog = (token: string | undefined, data: Record<string, unknown>) => this.call('POST', '/blogs/create', { token, data });
  listBlogs = (params?: Record<string, string>) => this.call('GET', '/blogs', { params });
  getBlog = (id: string) => this.call('GET', `/blogs/${id}`);
  updateBlog = (token: string | undefined, id: string, data: Record<string, unknown>) => this.call('PUT', `/blogs/update/${id}`, { token, data });
  deleteBlog = (token: string | undefined, id: string) => this.call('DELETE', `/blogs/delete/${id}`, { token });

  // setup helpers (assert success so a broken precondition fails loudly and early)
  async loginSession(email: string, password: string): Promise<Session> {
    const res = await this.login(email, password);
    expect(res.status(), `setup: login as ${email}`).toBe(200);
    const body = asRecord(await res.json());
    const user = asRecord(body.user);
    return { id: String(user.id), token: String(body.token), email, password, firstname: String(user.firstname ?? ''), lastname: String(user.lastname ?? '') };
  }

  async registerAndLogin(user: NewUser = buildUser()): Promise<Session> {
    const res = await this.register({ ...user });
    expect(res.status(), `setup: register ${user.email}`).toBe(201);
    const session = await this.loginSession(user.email, user.password);
    return { ...session, firstname: user.firstname, lastname: user.lastname };
  }

  async createBlogAs(token: string, overrides: Partial<BlogInput> = {}): Promise<CreatedBlog> {
    const blog = buildBlog(overrides);
    const res = await this.createBlog(token, { ...blog });
    expect(res.status(), 'setup: create blog').toBe(201);
    const body = asRecord(await res.json());
    const id = String(asRecord(body.blog).id ?? body.id);
    return { id, ...blog };
  }
}
