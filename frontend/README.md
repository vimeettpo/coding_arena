# CodeArena — Frontend

React 19 + Vite scaffold for the CodeArena coding assessment platform. This is the frontend piece of the full-stack build (Spring Boot backend to follow).

## Stack

- **React 19** with **Vite** (fast dev server + build)
- **React Router v7** — routing, nested layouts, role-based route guards
- **Redux Toolkit** — auth state (JWT) and editor preferences
- **MUI (Material UI)** — component library, themed to match the design tokens in `src/theme/theme.js`
- **Tailwind v4** — utility classes where they're faster than `sx` props
- **Monaco Editor** (`@monaco-editor/react`) — the coding workspace
- **TanStack Query** — wired up and ready for server-state fetching (problems, submissions, leaderboard) once the backend is live
- **Axios** — central API client with JWT + refresh-token interceptor
- **Chart.js** — dashboard charts
- **Framer Motion** — installed, ready for micro-interactions

## Getting started

```bash
npm install
cp .env.example .env      # point VITE_API_BASE_URL at your backend (http://localhost:8080/api)
npm run dev                # http://localhost:5173
```

```bash
npm run build              # production build to dist/
npm run lint                # oxlint
```

## 🔐 Demo Credentials

| Role | Route | Email / Username | Password |
|---|---|---|---|
| **Admin** | `/admin` | `admin@gmail.com` *(or `admin`)* | `Admin@123` |
| **Student** | `/student` | `student@gmail.com` *(or `student`)* | `Student@123` |

## Folder structure

```
src/
├── app/              # Redux store + typed-style hooks (useAuth, etc.)
├── components/
│   ├── common/       # Reusable UI: Logo, StatCard, VerdictChip, ComingSoon
│   └── layout/        # PublicLayout, DashboardLayout, role-based nav config
├── features/          # One folder per domain — mirrors the backend modules
│   ├── auth/           # authSlice (login/register thunks, JWT decode)
│   ├── editor/          # Monaco preferences (theme, font size, autosave)
│   ├── dashboard/        # student/, trainer/, admin/ dashboards
│   ├── problems/          # list page, workspace (Monaco), mock data, service
│   ├── contests/
│   └── leaderboard/
├── pages/               # Top-level routed pages (Landing, Login, Register, 404)
├── routes/               # ProtectedRoute (role-based route guard)
├── services/              # Axios instance + per-domain API services
└── theme/                  # MUI theme + Chart.js setup, both reading the same tokens
```

**Convention:** as new modules (assignments, quizzes, certificates) get built out, give each its own folder under `features/` with a `<Feature>Page.jsx`, a `<feature>Service.js`, and (if it needs its own state) a `<feature>Slice.js`. The dashboards and problem workspace already follow this shape — copy that pattern.

## What's real vs. what's scaffolded

- **Real:** routing, role-based guards, Redux auth flow (expects a backend at `/api/auth/login` returning `{ accessToken, refreshToken }` with `role`/`name`/`email` claims in the JWT), the Axios refresh-token interceptor, the full design system, and the Monaco workspace UI (language switch, theme toggle, font size, split screen, run/submit console).
- **Mocked for now:** problem data (`features/problems/mockProblems.js`), dashboard stats, contest list, and leaderboard rows. Swap these for `@tanstack/react-query` calls into the services in `src/services/` as backend endpoints come online — the service functions are already written to the shape described in the API note below.
- **Stubbed:** Assignments, Quizzes, Certificates, and most trainer/admin sub-pages render a `<ComingSoon />` placeholder — they're routed and reachable, just not built out yet.

## Expected backend contract (so far)

- `POST /api/auth/login` → `{ accessToken, refreshToken }` (JWT `sub`, `email`, `role`, `name` claims)
- `POST /api/auth/register`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/problems`, `GET /api/problems/:slug`, `POST /api/problems/:slug/run`, `POST /api/problems/:slug/submit`

Adjust `src/services/*Service.js` if the real backend's routes or payload shapes differ — that's the only place they're defined.

## Next steps

1. Stand up the Spring Boot backend and point `.env` at it.
2. Replace `mockProblems.js` with a `useQuery` call to `problemService.list()` / `getBySlug()`.
3. Wire `runCode()` in `ProblemWorkspacePage.jsx` to `problemService.run()` / `submit()`, and poll or subscribe (WebSocket) for the verdict instead of the current `setTimeout` simulation.
4. Build out Assignments, Quizzes and Certificates following the `features/<name>/` pattern.
5. Add a WebSocket client for the live leaderboard.

## Docker code-execution sandbox

See `../docs/docker-sandbox-guide.md` for a from-scratch guide to setting up the
sandboxed judge (Java/Python/C/C++/JS), since that's the next big piece after
the frontend and basic backend auth are in place.
