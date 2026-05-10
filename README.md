# POGIL QR Attendance Management System

  A web-based QR code attendance management system for **ND II Computer Science** students at **POGIL College of Health Technology**, Computer Science Department.

  **Supervised by:** Mrs. Akinboro Deborah  
  **Academic Session:** 2024/2025

  ---

  ## Features

  - **Role-based access** — Student, Lecturer, and Admin with dedicated dashboards
  - **QR code attendance** — Lecturers generate a unique QR code per session; students scan with their device camera
  - **Live tracking** — Attendance list auto-refreshes every 10 seconds on the lecturer dashboard
  - **Fullscreen QR** — Expand the QR code to full screen for projector display
  - **Export to Excel** — Download a formatted `.xlsx` attendance sheet per session
  - **Duplicate prevention** — One attendance record per student per session (enforced at DB level)
  - **Student registration** — New students register using a one-time admin-issued registration code
  - **Registration codes** — Admin generates time-limited (1h–7d) one-time codes; tracked as Active/Used/Expired
  - **Forgot password** — 3-step recovery: identify → security question → new password
  - **Hidden admin login** — Admin panel at `/admin/login`, not linked publicly
  - **POGIL branding** — Full blue-and-white school branding throughout

  ---

  ## Technology Stack

  | Layer | Technology |
  |---|---|
  | Framework | Next.js 15 (App Router), React 19, TypeScript |
  | Styling | Tailwind CSS v4 |
  | Database | Prisma ORM + SQLite |
  | Authentication | iron-session v8 (encrypted cookies) |
  | Password hashing | bcryptjs |
  | QR display | react-qr-code |
  | QR scanning | html5-qrcode (camera-based, dynamic import) |
  | Excel export | xlsx (SheetJS) |

  ---

  ## Installation

  ### Prerequisites
  - Node.js 18+
  - pnpm 8+

  ```bash
  # Clone the repository
  git clone https://github.com/SirCozy/pogil-qr-attendance-system.git
  cd pogil-qr-attendance-system

  # Install dependencies
  pnpm install

  # Set up environment variables
  cp .env.example .env.local
  # Edit .env.local — set SESSION_SECRET to a long random string

  # Push Prisma schema to SQLite
  pnpm run db:push

  # Seed demo users, courses, and sessions
  pnpm run db:seed

  # Start the development server
  pnpm run dev
  ```

  Open [http://localhost:3000](http://localhost:3000) in your browser.

  ---

  ## Environment Variables

  Create `.env.local` from the template:

  ```bash
  cp .env.example .env.local
  ```

  | Variable | Required | Description |
  |---|---|---|
  | `SESSION_SECRET` | Yes | Encryption key for iron-session cookies (min. 32 characters) |

  Generate a secure secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  ---

  ## Database Setup

  ```bash
  # Apply schema (creates prisma/dev.db)
  pnpm run db:push

  # Seed demo data
  pnpm run db:seed
  ```

  Re-run both commands after any changes to `prisma/schema.prisma`.

  ---

  ## Demo Credentials

  | Role | Login Page | Identifier | Password |
  |---|---|---|---|
  | Student | `/login` | `CSC/ND2/24/001` – `CSC/ND2/24/010` | `student123` |
  | Lecturer | `/login` | `akinboro.deborah@pogil.edu.ng` | `lecturer123` |
  | Admin | `/admin/login` | `admin@pogil.edu.ng` | `admin123` |

  **Forgot password demo answer:** `pogil` (question: "What is your mother's maiden name?")

  ---

  ## Seeded Students (ND II, 2024/2025)

  | Matric No. | Name |
  |---|---|
  | CSC/ND2/24/001 | ADEBAYO MUSTAPHA |
  | CSC/ND2/24/002 | OKONKWO BLESSING CHIOMA |
  | CSC/ND2/24/003 | YUSUF IBRAHIM ABUBAKAR |
  | CSC/ND2/24/004 | ABUBAKAR FATIMA ZAHRA |
  | CSC/ND2/24/005 | OBI CHUKWUEMEKA DANIEL |
  | CSC/ND2/24/006 | MOHAMMED AISHA BELLO |
  | CSC/ND2/24/007 | ADEWALE OLUWASEUN PETER |
  | CSC/ND2/24/008 | NWOSU GRACE ADAOBI |
  | CSC/ND2/24/009 | HASSAN AMINAT FOLAKE |
  | CSC/ND2/24/010 | OKAFOR KENNETH EMEKA |

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
  1. Go to `/admin/login` and sign in with admin credentials
  2. Select an expiry duration and click **Generate Code**
  3. Share the 8-character code with a student who needs to register
  4. Monitor all codes (Active / Used / Expired) in the table

  ### Student Registration (new students)
  1. Go to `/register`
  2. Fill in your name, matric number, password, security question + answer
  3. Enter the registration code from your admin
  4. Click **Create Account**, then sign in at `/login`

  ### Lecturer
  1. Sign in at `/login` as Lecturer
  2. Select a course and click **Start Session**
  3. Click **Fullscreen** to project the QR code
  4. Attendance updates automatically every 10 seconds
  5. Click **Export Excel** to download the attendance sheet

  ### Student (attendance)
  1. Sign in at `/login` as Student
  2. Click **Scan QR Code** and allow camera access
  3. Point your camera at the QR code on screen — attendance is marked instantly

  ### Forgot Password
  1. Click **Forgot password?** on the login page
  2. Enter your matric number (student) or email (lecturer)
  3. Answer your security question
  4. Set a new password

  ---

  ## Folder Structure

  ```
  pogil-qr-attendance-system/
  ├── prisma/
  │   ├── schema.prisma       # Database schema (source of truth)
  │   ├── seed.ts             # Demo data seeder
  │   └── dev.db              # SQLite database (git-ignored)
  ├── src/
  │   ├── app/
  │   │   ├── api/            # API route handlers
  │   │   │   ├── admin/      # Registration code management
  │   │   │   ├── attendance/ # Mark + fetch attendance
  │   │   │   ├── auth/       # Login, logout, register, me, forgot-password
  │   │   │   └── sessions/   # Create sessions + Excel export
  │   │   ├── admin/          # Admin login + dashboard
  │   │   ├── forgot-password/
  │   │   ├── lecturer/
  │   │   ├── login/
  │   │   ├── register/
  │   │   └── student/
  │   ├── components/
  │   │   ├── QRDisplay.tsx   # Renders QR code image
  │   │   └── QRScanner.tsx   # Camera-based QR scanner
  │   ├── lib/
  │   │   ├── prisma.ts       # Prisma client singleton
  │   │   └── session.ts      # iron-session config
  │   └── middleware.ts       # Auth + role-based routing
  ├── .env.example
  ├── .gitignore
  ├── next.config.ts
  ├── package.json
  ├── postcss.config.mjs
  └── tsconfig.json
  ```

  ---

  ## Deployment

  ### Quick deploy on Replit
  1. Import the repository into Replit
  2. Set `SESSION_SECRET` in the Secrets panel
  3. Run `pnpm run db:push` then `pnpm run db:seed`
  4. Click **Deploy**

  ### Self-hosted / VPS
  ```bash
  pnpm install
  export SESSION_SECRET=your_long_random_secret
  pnpm run db:push && pnpm run db:seed
  pnpm run build
  pnpm run start
  ```

  > For production, consider switching from SQLite to PostgreSQL by updating `prisma/schema.prisma` (`provider = "postgresql"`) and setting a `DATABASE_URL`.

  ---

  ## License

  Academic project — POGIL College of Health Technology, Computer Science Department, ND II, 2024/2025.
  