# ⚡ CodeArena

> A high-performance, modern full-stack online coding assessment, competitive programming, and learning platform.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.5-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker Sandbox](https://img.shields.io/badge/Docker-Code_Judge-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 Overview

**CodeArena** is an all-in-one developer assessment and competitive programming platform. It features an interactive **Monaco Editor** workspace, multi-language **Docker-isolated code execution judge**, real-time **Socket.IO leaderboard**, automated quiz evaluation, and role-tailored dashboards for **Students**, **Trainers**, and **Admins**.

---

## ✨ Key Features

### 💻 Monaco Code Editor & Workspace
- Multi-language support: **C, C++, Java, Python, JavaScript**.
- Customizable editor themes (Dark/Light), adjustable font sizes, tab settings, auto-save.
- Split-screen problem layout with problem statement, input/output test cases, execution console, and submission history.

### 🛡️ Docker-Isolated Code Execution Judge
- Code submissions are evaluated inside containerized environments with strict resource constraints (CPU, memory, execution timeouts).
- Real-time verdict delivery: **Accepted (AC)**, **Wrong Answer (WA)**, **Time Limit Exceeded (TLE)**, **Memory Limit Exceeded (MLE)**, and **Compilation Error (CE)**.

### 🔒 Authentication & Role-Based Access Control (RBAC)
- Role-based permissions (**Student**, **Trainer**, **Admin**).
- JWT Access and Refresh token lifecycle with automatic HTTP client token rotation.
- Secure password hashing (`bcryptjs`) and email OTP verification via **Resend API**.

### ⚔️ Contests & Auto-Graded Quizzes
- Create and manage live competitive coding contests.
- Interactive timed quizzes with automated grading and detailed scoring breakdowns.

### 📊 Real-Time Standings & Analytics
- Live updates broadcasted via **Socket.IO** WebSockets.
- Dynamic performance dashboards powered by **Chart.js** displaying submission trends, success rates, and skill progress.

---

## 🛠️ Tech Stack

### **Frontend** (`/frontend`)
- **Framework**: React 19 + Vite
- **State Management**: Redux Toolkit & TanStack Query (React Query v5)
- **Routing**: React Router v7 with role-based layout guards
- **UI & Styling**: Material UI (MUI v9) + Tailwind CSS v4 + Framer Motion
- **Code Editor**: `@monaco-editor/react`
- **Charts & Data**: Chart.js & `react-chartjs-2`
- **HTTP Client**: Axios with refresh token interceptor

### **Backend** (`/backend`)
- **Runtime**: Node.js (`>=18.x`) + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Communication**: Socket.IO
- **Validation**: Zod schema validation
- **Sandboxed Execution**: Docker CLI & container runner (`child_process.spawn`)
- **Email Service**: Resend API (OTP authentication & verification)
- **Security & Logging**: Helmet, CORS, Morgan

---

## 📁 Repository Structure

```
CodeArena/
├── frontend/                     # React 19 + Vite Frontend Application
│   ├── src/
│   │   ├── app/                  # Redux store & global auth state hooks
│   │   ├── components/           # Reusable UI components & layouts
│   │   ├── features/             # Domain modules (auth, problems, editor, contests, quiz, leaderboard)
│   │   ├── pages/                # Top-level application pages
│   │   ├── routes/               # Role-protected route guards
│   │   ├── services/             # Axios API integration clients
│   │   └── theme/                # MUI custom design tokens & chart configurations
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Express.js REST API & WebSocket Backend
│   ├── api/
│   │   └── index.js              # Vercel serverless entrypoint
│   ├── src/
│   │   ├── app.js                # Express app configuration & middleware
│   │   ├── server.js             # Standalone entrypoint (MongoDB + Socket.IO + Docker Judge)
│   │   ├── config/               # DB and environment setup
│   │   ├── docker/               # Judge sandbox Dockerfiles (C, C++, Java, Python, JS)
│   │   ├── middleware/           # Auth guards, Zod validation, error handling
│   │   ├── models/               # Mongoose database schemas
│   │   ├── modules/              # Feature endpoints (auth, user, problem, submission, contest, quiz, leaderboard)
│   │   └── websocket/            # Socket.IO event handlers
│   ├── package.json
│   └── vercel.json
│
└── README.md                     # Project documentation
```

---

## 🔐 Sample Credentials & Demo Access

Use the following pre-configured credentials to log into the platform immediately:

| Role | Portal / Route | Email / Username | Password | Access & Permissions |
|---|---|---|---|---|
| **Admin** | [`/admin`](http://localhost:5173/login) | `admin@gmail.com`<br>*(or `admin`)* | `Admin@123` | Full Admin Dashboard: Question management, problem creation, testcase drawers, contest creation, quizzes, bulk CSV student import, system & branch analytics. |
| **Student** | [`/student`](http://localhost:5173/login) | `student@gmail.com`<br>*(or `student`)* | `Student@123` | Full Student Dashboard: Monaco code editor workspace, code execution judge, contest registration & participation, timed quizzes, live standings. |

### 🔑 Admin Registration Passphrase
To register a new **Admin** account through the UI at [`/register`](http://localhost:5173/register), select the **ADMIN** role and enter the Admin Secret Code:
```
codearena-admin-2026
```
*(Configured via `ADMIN_SECRET_CODE` in `backend/.env`)*

### ⚡ Automatic Database Seeding
The backend automatically initializes database tables and seeds these demo accounts upon startup. You can also re-seed or verify these demo credentials at any time:
```bash
cd backend
npm run seed:users
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `>= 18.x`
- **PostgreSQL**: Neon PostgreSQL or local PostgreSQL (`>= 14`)
- **MongoDB**: Local MongoDB instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI
- **Docker** *(Optional for local code execution)*: Required only if running sandboxed Docker judge locally

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Review and adjust your `backend/.env` (see [`backend/.env.example`](backend/.env.example)):
```env
# ---- Server ----
NODE_ENV=development
PORT=8080

# ---- Database ----
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/codearena

# ---- JWT ----
JWT_SECRET=codearena-super-secure-jwt-dev-secret-key-2026
JWT_ACCESS_EXPIRY_MS=3600000
JWT_REFRESH_EXPIRY_MS=604800000

# ---- Admin Security ----
ADMIN_SECRET_CODE=codearena-admin-2026

# ---- CORS ----
CORS_ALLOWED_ORIGINS=http://localhost:5173

# ---- Judge (Docker sandbox) ----
JUDGE_DISABLED=true
```

Seed demo users (Admin & Student):
```bash
npm run seed:users
```

Start the standalone backend server:
```bash
# Start backend server with live reload (nodemon)
npm run dev
```

*(Optional)* Build Docker judge images if testing code execution with Docker:
```bash
# Build sandbox runner Docker images for C, C++, Java, Python, and JavaScript
npm run build-judge-images
```

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Your `frontend/.env` (see [`frontend/.env.example`](frontend/.env.example)):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the frontend development server:
```bash
# Launch Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and sign in using the sample credentials above!

---

## 🌐 API Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account | Public |
| `POST` | `/api/auth/verify-otp` | Verify email OTP | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | Public |
| `GET` | `/api/auth/me` | Get active user profile | Authenticated |
| `GET` | `/api/users/student-dashboard` | Get student metrics & progress | Student |
| `GET` | `/api/problems` | List problem set | Public |
| `GET` | `/api/problems/:slug` | Get problem details | Public |
| `POST` | `/api/problems/:slug/run` | Run code against custom test cases | Authenticated |
| `POST` | `/api/problems/:slug/submit` | Submit solution to judge engine | Authenticated |
| `GET` | `/api/contests` | Fetch active & upcoming contests | Public |
| `POST` | `/api/contests/:id/register` | Register for contest | Student |
| `GET` | `/api/quizzes` | Fetch available quizzes | Student |
| `POST` | `/api/quizzes/:id/submit` | Submit quiz attempt for auto-grading | Student |
| `GET` | `/api/leaderboard` | Get current contest / global standings | Public |

---

## ☁️ Deployment Strategy

### **Serverless API + Standalone Judge Architecture**

Due to the stateless nature of serverless platforms (such as Vercel), running a Docker daemon and maintaining long-lived Socket.IO connections requires a split deployment architecture:

1. **REST API & Auth (Vercel)**:
   - Deploy `/backend` with `api/index.js` as the serverless entrypoint.
   - Set `JUDGE_DISABLED=true` in Vercel env variables if Docker daemon is unavailable.
2. **Code Sandbox Judge & Socket.IO (VPS / Render / Railway / Fly.io)**:
   - Deploy `src/server.js` on a host with Docker installed to handle `/run`, `/submit`, and live WebSocket broadcasts.
3. **Frontend (Vercel / Netlify)**:
   - Deploy `/frontend` as a static Vite build.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the project repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add AmazingFeature'`).
4. Push to the branch (`git checkout -b feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
