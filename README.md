# BlogSpace — Blog Management Frontend

A responsive blog platform built with **Next.js 14 (App Router)**, **TypeScript** and **Tailwind CSS**.
It consumes the separate Blog REST API (Node/Express + MySQL) and supports three visitor types: **Guest**, **User** and **Admin**.

> Main Work: *Previously completing BlogSpace Web application , I have complete a full scale playwright automation to test each and every case of the BlogSpace Web Application with 277 no of cases.

## Main features
- **Guest:** browse blogs, search by title, filter by category (combined), read a blog, register, login, forgot/reset password
- **User:** dashboard, create / edit / delete **own** blogs, profile edit, avatar upload, change password, logout
- **Admin:** everything a user can do, plus view all users, view a user, activate/deactivate users, edit/delete **any** blog
- Reusable components, loading skeletons, empty states, confirm dialogs, toasts, form + backend error display
- Responsive: sidebar becomes a drawer on mobile, blog cards stack vertically

## Technologies
Next.js 14 · React 18 · TypeScript (strict) · Tailwind CSS 3 · react-hook-form + Zod · Playwright

## Backend dependency
This app has **no data of its own** — every blog, user and session comes from the Blog REST API
This app needs the Blog REST API running. Backend repository: https://github.com/SaadmaanJim/Blog-Application-REST-api-Development
```bash
git clone https://github.com/SaadmaanJim/Blog-Application-REST-api-Development
cd Blog-Application-REST-api-Development
npm install
cp .env.example .env     
npm run dev
```
The backend must run on the URL set in `NEXT_PUBLIC_API_URL`.

## Installation
```bash
git clone <your-repo-url> && cd blogspace
npm install
cp .env.example .env.local     
```

## Environment variables
| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Blog API (with `/api`, no trailing slash) | `http://localhost:5000/api` |
| `E2E_EMAIL` / `E2E_PASSWORD` | *(optional)* existing normal user for Playwright | `john@example.com` / `password123` |


## How to run
```bash
1. Start the backend (see "Backend dependency").
2. Start the frontend:
npm run dev
3. Open `http://localhost:3001`.
```

## Application routes
| Route | Access |
|---|---|
| `/`, `/blogs/[id]`, `/login`, `/register`, `/forgot-password`, `/reset-password/[token]` | Public |
| `/dashboard`, `/dashboard/blogs`, `/dashboard/blogs/create`, `/dashboard/blogs/[id]/edit`, `/dashboard/profile`, `/dashboard/change-password` | User / Admin |
| `/admin/users` | Admin only |

## Architecture
```
app/            routes (thin server components) — (public) group, dashboard, admin
components/     Navbar, Sidebar, ProfileMenu, BlogCard, BlogForm, SearchBar, CategoryFilter, ConfirmDialog, AuthGuard
  ui/           Button, Fields, Modal, Toast, Avatar, DataTable, Feedback (Loader/Alert/EmptyState)
  forms/        Login, Register, ForgotPassword, ResetPassword, ChangePassword, Profile, AvatarUploader
  views/        feature screens (BlogExplorer, DashboardOverview, BlogsManagement, UsersView, ...)
services/       auth / user / blog services — the only code that knows endpoints
lib/api/        client.ts (fetch wrapper, errors, 401 handling) + normalize.ts (API → UI types adapter)
contexts/       AuthContext (session state)
```
Key decisions:
- **One API layer.** Pages never call `fetch`; services call `apiFetch`, which attaches `Authorization: Bearer <token>` and converts failures into `ApiError` with the backend's message.
- **Adapter file.** `lib/api/normalize.ts` is the single place that knows the backend's JSON field names.
- **Session.** The JWT is kept in `localStorage`; on refresh `AuthContext` re-validates it with `GET /users/profile`. A non-secret `bs_auth` cookie lets `middleware.ts` redirect guests early. A `401` on any protected call logs the user out.
- **Authorization.** Hidden menus are only UX. Admin routes show *Access Denied* for users, and every backend 401/403 message is displayed — the backend is the real authority.
- **Blog details page** is a Server Component (SEO, no loading flash); interactive pages are Client Components.

### Known limitations / trade-offs
- `localStorage` tokens are readable by any XSS. Production apps should prefer httpOnly cookies set by the backend.
- The API has no categories endpoint, so categories are a constant in `lib/config.ts` (keep it aligned with the backend data).
- The API has no "my blogs" endpoint, so "My Blogs" filters `GET /blogs` by author id on the client.
- `PATCH /users/password` takes no current password (API design); the UI mirrors the API.

## Testing
Playwright (TypeScript) suites for API, UI, security, accessibility, responsive layout and end-to-end journeys live in `tests/`.
See **[docs/TESTING.md](docs/TESTING.md)** for setup, commands, tags, design rules and the test-case execution checklist.
```bash
npm run test:smoke        # fast positive-path check
npm run test:regression   # full regression
npm run test:report       # open the HTML report
```
CI: `.github/workflows/e2e.yml` (template: set the `BACKEND_REPO` variable).


