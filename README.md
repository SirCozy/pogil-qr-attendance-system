# POGIL QR Attendance Management System

A web-based QR code attendance management system built for **ND II Computer Science** students at **POGIL College of Health Technology**, Computer Science Department.

**Supervised by:** Mrs. Akinboro Deborah  
**Academic Session:** 2024/2025

---

## Features

- **Role-based access** — Three distinct roles: Student, Lecturer, and Admin, each with their own dashboard and permissions
- **QR code attendance** — Lecturers generate a unique QR code per session; students scan it with their device camera to mark attendance instantly
- **Session management** — Lecturers create sessions by selecting from predefined ND II CS courses or entering a custom course name
- **Live attendance tracking** — Attendance list auto-refreshes every 10 seconds on the lecturer dashboard
- **Fullscreen QR display** — Lecturers can go fullscreen so students can scan from a projector screen
- **Export to Excel** — Download a formatted `.xlsx` attendance sheet per session (student name, matric number, date, time)
- **Duplicate prevention** — Students cannot mark attendance twice for the same session (enforced at database level)
- **Student registration** — New students register using a one-time registration code issued by an admin
- **Registration codes** — Admin generates time-limited (1h–7d) one-time-use codes; each code is tracked (issued, used, expired)
- **Forgot password** — 3-step recovery: enter matric/email → answer security question → set new password
- **Hidden admin login** — Admin panel is at `/admin/login`, not linked from any public page
- **POGIL branding** — Full blue-and-white school branding throughout

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Prisma ORM + SQLite |
| Authentication | iron-session v8 (encrypted cookie sessions) |
| Password hashing | bcryptjs |
| QR display | react-qr-code |
| QR scanning | html5-qrcode (dynamically imported, camera-based) |
| Excel export | xlsx (SheetJS) |
| Runtime | Node.js, pnpm workspaces |

---

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8+

### Steps

```bash
# Clone the repository
git clone https://github.com/<your-username>/pogil-qr-attendance-system.git
cd pogil-qr-attendance-system

# Install all dependencies (pnpm workspace)
pnpm install

# Set up environment variables
cp artifacts/qr-attendance/.env.example artifacts/qr-attendance/.env.local
# Edit .env.local and fill in SESSION_SECRET (see below)

# Push Prisma schema to SQLite
pnpm --filter @workspace/qr-attendance run db:push

# Seed demo users, courses, and sessions
pnpm --filter @workspace/qr-attendance run db:seed

# Start the development server
pnpm --filter @workspace/qr-attendance run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `artifacts/qr-attendance/.env.local` with the following:

```env
# Required — must be a long, random secret string (min. 32 characters)
# Used by iron-session to encrypt session cookies
SESSION_SECRET=your_super_secret_key_here_change_this_in_production
```

See `.env.example` for a template.

> **Important:** Never commit `.env.local` or any file containing real secrets to version control.

---

## Database Setup

The app uses **SQLite** via Prisma. The database file is stored at `artifacts/qr-attendance/prisma/dev.db`.

```bash
# Apply schema (creates or updates the SQLite database)
pnpm --filter @workspace/qr-attendance run db:push

# Seed demo data (users, students, courses, sessions)
pnpm --filter @workspace/qr-attendance run db:seed
```

Run both commands whenever the Prisma schema (`prisma/schema.prisma`) changes.

---

## Demo Login Credentials

| Role | Login Page | Identifier | Password |
|---|---|---|---|
| Student | `/login` | `CSC/ND2/24/001` through `CSC/ND2/24/010` | `student123` |
| Lecturer | `/login` | `akinboro.deborah@pogil.edu.ng` | `lecturer123` |
| Admin | `/admin/login` | `admin@pogil.edu.ng` | `admin123` |

**Forgot password demo answer:** `pogil`  
(Security question: "What is your mother's maiden name?")

---

## Seeded Students (ND II, 2024/2025)

| Matric No. | Name |
|---|---|
| CSC/ND2/24/001 | Student One |
| CSC/ND2/24/002 | Student Two |
| CSC/ND2/24/003 | Student Three |
| CSC/ND2/24/004 | Student Four |
| CSC/ND2/24/005 | Student Five |
| CSC/ND2/24/006 | Student Six |
| CSC/ND2/24/007 | Student Seven |
| CSC/ND2/24/008 | Student Eight |
| CSC/ND2/24/009 | Student Nine |
| CSC/ND2/24/010 | Student Ten |

---

## Seeded Courses (ND II CS)

- COM 211: Data Structures and Algorithms
- COM 212: Database Management Systems
- COM 213: Computer Networks
- COM 214: Systems Analysis and Design
- COM 215: Object-Oriented Programming
- ENT 211: Entrepreneurship Development

---

## Usage Guide

### Admin
1. Navigate to `/admin/login` and sign in
2. In the dashboard, select an expiry duration and click **Generate Code**
3. Share the generated 8-character code with a student who needs to register
4. View all codes and their status (Active / Used / Expired) in the table

### Student Registration (new students only)
1. Go to `/register`
2. Enter your full name, matric number, and a password
3. Choose a security question and provide your answer (used for password recovery)
4. Enter the registration code received from your admin
5. Click **Create Account** and sign in at `/login`

### Lecturer
1. Sign in at `/login` as Lecturer
2. Select a course from the dropdown (or enter a custom name) and click **Start Session**
3. The QR code is displayed — click **Fullscreen** to project it for students
4. Attendance updates automatically every 10 seconds
5. Click **Export Excel** to download an `.xlsx` attendance sheet for the active session

### Student (attendance)
1. Sign in at `/login` as Student
2. On your dashboard, click **Scan QR Code**
3. Allow camera access when prompted
4. Point your camera at the QR code on the lecturer's screen
5. Attendance is marked immediately and appears in your history

### Forgot Password
1. Click **Forgot password?** on the login page
2. Enter your matric number (student) or email (lecturer)
3. Answer your security question
4. Set your new password

---

## Folder Structure

```
artifacts/qr-attendance/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   ├── seed.ts                # Demo data seeder
│   └── dev.db                 # SQLite database (git-ignored)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/codes/   # Registration code management (admin)
│   │   │   ├── attendance/    # Mark + fetch attendance records
│   │   │   ├── auth/          # Login, logout, register, me, forgot-password
│   │   │   └── sessions/      # Create sessions + Excel export
│   │   ├── admin/             # Admin login + dashboard
│   │   ├── forgot-password/   # Password reset flow
│   │   ├── lecturer/          # Lecturer dashboard
│   │   ├── login/             # Student/lecturer login
│   │   ├── register/          # Student registration
│   │   └── student/           # Student dashboard
│   ├── components/
│   │   ├── QRDisplay.tsx      # Renders a QR code image
│   │   └── QRScanner.tsx      # Camera-based QR scanner
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── session.ts         # iron-session config + helper
│   └── middleware.ts          # Auth + role-based route protection
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Deployment

### Replit (recommended for quick demo)

1. Open the project on Replit
2. Set `SESSION_SECRET` in the Secrets panel (at least 32 random characters)
3. Run `pnpm --filter @workspace/qr-attendance run db:push`
4. Run `pnpm --filter @workspace/qr-attendance run db:seed`
5. Click **Deploy** — the app will be live on a `.replit.app` domain

### Self-hosted / VPS

```bash
# Install dependencies
pnpm install

# Set environment variables
export SESSION_SECRET=your_long_random_secret

# Push schema and seed
pnpm --filter @workspace/qr-attendance run db:push
pnpm --filter @workspace/qr-attendance run db:seed

# Build
pnpm --filter @workspace/qr-attendance run build

# Start
pnpm --filter @workspace/qr-attendance run start
```

> **Production note:** For production, replace SQLite with PostgreSQL by updating `prisma/schema.prisma` (`provider = "postgresql"`) and setting `DATABASE_URL` in your environment.

---

## License

This project was developed as an academic project for POGIL College of Health Technology, Computer Science Department, ND II, 2024/2025 session.
