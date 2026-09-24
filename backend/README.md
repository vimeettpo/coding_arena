# CodeArena Backend — Express.js port

This is a feature-parity port of the original Spring Boot backend
(`rswaraj09/code-arena/backend`) to Node.js/Express, built module-for-module
against the actual source: auth, users, problems, submissions, the Docker
judge, contests, quizzes, and the leaderboard.

## Read this first: Docker judge & WebSocket on Vercel

Vercel Node functions are **stateless and serverless** — no persistent
processes, no ability to shell out to a Docker daemon, no long-lived
connections. Two pieces of this backend fundamentally need those things:

| Feature | Needs | Works on Vercel? |
|---|---|---|
| Everything else (auth, problems, contests, quizzes, leaderboard reads) | Just MongoDB | ✅ Yes |
| **Docker judge** (`run`/`submit` execution) | The `docker` CLI + daemon on the host | ❌ No |
| **Live leaderboard** (Socket.IO) | A persistent process holding open connections | ❌ No |

This port is built as a **full parity attempt**, so the judge and Socket.IO
code are complete and correct — they just need to run somewhere with a
Docker daemon and a persistent process (a VM, Render, Railway, Fly.io, or
your own server). Two entrypoints are provided:

- **`src/server.js`** — standalone server. Use this on any host with Docker
  installed. Gets you the real judge + the live Socket.IO leaderboard.
- **`api/index.js`** — Vercel serverless entrypoint. Same routes, same auth,
  same DB — but `JUDGE_DISABLED=true` (recommended in Vercel's env vars)
  makes `/run` and `/submit` return a clear error instead of trying to spawn
  `docker` and crashing. The Socket.IO broadcast becomes a silent no-op;
  poll `GET /api/leaderboard` instead.

**Recommended split for a real deployment:**
1. Deploy this repo's API (auth/problems/contests/quizzes/leaderboard reads)
   to Vercel as-is.
2. Deploy `src/server.js` separately on a Docker-capable host (Railway,
   Render, Fly.io, a VPS) — or point `/run` and `/submit` at an external
   judge API (Judge0, Piston, etc.) instead of the local Docker judge.
3. Point the frontend's Socket.IO client at that second host for the live
   leaderboard; everything else talks to the Vercel deployment.

## Project structure

```
src/
  app.js                  Express app (routes + middleware), no listen()
  server.js               Standalone entrypoint — Mongo + Socket.IO + listen()
  config/                 env.js, db.js
  common/                 ApiResponse envelope, error classes, error handler
  middleware/              JWT auth, role guards, Zod validation
  models/                 Mongoose schemas (Student, Trainer, Problem, ...)
  utils/                  jwt.js, email.js (Resend API)
  modules/
    auth/                 register, login, refresh, OTP, password reset
    user/                 cross-collection lookups, student dashboard
    problem/               list/detail/create
    submission/
      judge/               Docker sandbox judge (child_process spawn)
    contest/               CRUD, registration, trainer dashboard
    quiz/                  CRUD, attempts, auto-grading
    leaderboard/           on-demand standings
  websocket/socket.js      Socket.IO (replaces Spring's STOMP broker)
  docker/                  Judge sandbox Dockerfiles (java/python/cpp/c/js)
                           — copied as-is from the original repo, no Java involved
api/index.js               Vercel serverless entrypoint
vercel.json                Vercel routing config
```

## 🔐 Sample Credentials & Demo Access

| Role | Email / Username | Password | Notes |
|---|---|---|---|
| **Admin** | `admin@gmail.com` *(or `admin`)* | `Admin@123` | Full access to Admin APIs and dashboard |
| **Student** | `student@gmail.com` *(or `student`)* | `Student@123` | Access to student coding workspace & quizzes |

- **Admin Secret Code**: `codearena-admin-2026` (used on `/api/auth/register` to register new admins).
- **Run Seed Script**: `npm run seed:users` (creates/resets these demo users in PostgreSQL).

## Local setup

```bash
cp .env.example .env

npm install
npm run seed:users     # seed demo admin and student accounts
npm run dev            # nodemon, standalone server on :8080
```

To use the real judge locally, build the sandbox images once:
```bash
npm run build-judge-images   # requires Docker installed and running
```

## Deploying to Vercel

```bash
vercel
```
Set these in the Vercel project's environment variables:
- `MONGODB_URI` (MongoDB Atlas — required)
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS` (your deployed frontend's origin)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional — OTP emails just log to
  the console if omitted)
- `JUDGE_DISABLED=true` (recommended — see the table above)

`vercel.json` routes every request through `api/index.js`, which reuses the
Mongo connection across warm invocations.

## API surface

Same routes as the Spring Boot backend, same `{ success, data, message,
timestamp }` response envelope:

```
POST   /api/auth/register
POST   /api/auth/verify-otp
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/users/student-dashboard
GET    /api/users/students

GET    /api/problems
GET    /api/problems/:slug
POST   /api/problems/:slug/run
POST   /api/problems/:slug/submit
GET    /api/problems/:slug/submissions
POST   /api/problems

GET    /api/contests/dashboard
GET    /api/contests
GET    /api/contests/:id
POST   /api/contests/:id/register
POST   /api/contests

GET    /api/quizzes
GET    /api/quizzes/:id
POST   /api/quizzes
POST   /api/quizzes/:id/submit
GET    /api/quizzes/:id/result

GET    /api/leaderboard?contestId=<optional>
```

## What's deliberately different from the Spring Boot version

- **WebSocket protocol**: STOMP → Socket.IO (`leaderboard:subscribe` /
  `leaderboard:update` events instead of `/topic/leaderboard/*`). Frontend
  code that used `@stomp/stompjs` needs a small swap to `socket.io-client`.
- **Validation**: Jakarta Bean Validation → Zod schemas per route.
- **User "discriminator" model**: Spring's abstract `User` + `Student`/
  `Trainer` subclasses → two plain Mongoose models sharing a field set
  (`models/userFields.js`), same as the original's two Mongo collections.
- **Swagger/OpenAPI**: not wired up in this port (the original used
  springdoc auto-generation from annotations). The route list above is the
  API surface; add `swagger-ui-express` with a hand-written spec if you
  want interactive docs.

## Not built (same boundary as the original repo)

Assignments, certificates, notifications, and Redis leaderboard caching
were "routed and stubbed on the frontend, absent on the backend" in the
original — same here.
