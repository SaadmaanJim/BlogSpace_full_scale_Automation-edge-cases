export type Role = 'admin' | 'user';

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: Role;
  isActive: boolean;
  profileImage: string | null;
  createdAt: string | null;
}

export interface BlogAuthor {
  id: string | null;
  name: string;
  image: string | null;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string | null;
  author: BlogAuthor;
}

export interface BlogPayload {
  blogTitle: string;
  blog: string;
  category: string;
}
