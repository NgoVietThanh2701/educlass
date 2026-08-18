# EduClass

## 1. Project overview

EduClass is an online education platform split into two apps:

- **`api/`** — NestJS REST + WebSocket (Socket.IO) backend.
- **`web/`** — Next.js (App Router) frontend: public site + dashboard.

Teachers author courses (sections → lessons → assessments), publish them and
run a **real-time per-course group chat**. Students browse the catalog, enroll,
learn, take assessments and join the course chat automatically. Authentication
supports email + password (JWT, OTP verification) and **Google OAuth**, with
role-based access for **Teacher / Student** (+ seeded Admin/Manager).

## 2. Tech stack

### Backend (`api/`)

- **NestJS 11**, TypeScript, strict validation (`class-validator`)
- **Prisma 7** (`@prisma/adapter-pg`) + PostgreSQL
- **JWT** auth (`@nestjs/jwt`, Passport) — access + rotating refresh tokens
  (httpOnly cookie), **bcrypt**
- **Google OAuth** (plain `fetch`, authorization-code flow)
- **Socket.IO** (`@nestjs/platform-socket.io` + `IoAdapter`) for realtime chat
- `@nestjs/throttler` (rate limiting), `@nestjs/schedule`,
  `@nestjs/swagger`, **Helmet**, `cookie-parser`
- **Redis** (`ioredis`), **nodemailer** (`@nestjs-modules/mailer`),
  **Cloudinary** uploads

### Frontend (`web/`)

- **Next.js** (App Router), **React 19**, TypeScript, **Tailwind CSS v4**
- **Zustand** (auth + chat UI state), **TanStack Query**, **axios**
- **socket.io-client** (realtime chat)
- `react-hook-form` + `zod`, `date-fns` (vi), `lucide-react`, `sonner`,
  shadcn-style UI components

## 3. Features

**Authentication & Users**

- Email + password registration with OTP email verification
- JWT access token + rotating refresh token (httpOnly cookie, hashed in DB)
- **Google OAuth** (CSRF `state`, auto-link by email, `STUDENT` default role)
- Role-based authorization (Teacher / Student)

**Courses & Learning**

- Teacher authoring: courses, sections, lessons, assessments (publish/archive)
- Categories, levels, price, published metadata
- Public course catalog + detail page
- Student enrollment; enrolled courses in the dashboard

**Assessments**

- Question/option management, publish status
- Attempt lifecycle: start → auto-save answers → submit / timeout → score
- Filtered + paginated attempts listing

**Chat (realtime)**

- Per-course **group conversations**, auto-created/joined on enrollment
- Real-time send/receive, unread counters, **file attachments** (Cloudinary)
- Teacher controls message permission (`ALL` / `TEACHER_ONLY`)
- Responsive chat layout (mobile / tablet / desktop)

**Platform / Operations**

- Global `{ success, message, data }` response format + global exception handling
- Rate limiting, strict input validation, security headers (Helmet)
- CORS allow-list, `TRUST_PROXY`, graceful shutdown, Swagger gated off in prod
- Prisma Neon keep-alive (avoids cold-start timeouts), Socket.IO cleanup

## 4. Project structure

Only the important folders:

```
educlass/
├── api/                      # NestJS backend
│   ├── prisma/               # schema.prisma + SQL migrations
│   └── src/
│       ├── common/           # decorators, guards, interceptors, exceptions, utils
│       ├── prisma/           # PrismaService (pooling + keep-alive)
│       └── modules/          # auth, users, courses, sections, lessons,
│                             # assessments, assessment-attempt, enrollments,
│                             # chat, otp, mail, redis
└── web/                      # Next.js frontend
    └── src/
        ├── app/              # routes: (auth), (public), oauth, dashboard
        ├── features/         # auth, courses, enrollments, assessment, chat
        ├── components/       # shared ui + dashboard layout
        ├── lib/              # axios, interceptors, query-client, cookies
        └── constants/        # API endpoints, routes
```

## 5. Requirements

- **Node.js** ≥ 20
- **PostgreSQL** 14+ (local or Neon)
- **Redis** (used by rate-limit / OTP keys)
- **SMTP credentials** (for OTP / welcome emails)
- **Cloudinary** account (image/file uploads)
- **Google OAuth** client (optional, for "Continue with Google")
- `api/.env` and `web/.env.local` configured (see below)

## 6. Installation / Getting Started

### Backend (`api/`)

```bash
cd api
npm install
cp .env.example .env        # then fill in values
npx prisma migrate deploy
npx prisma db seed          # optional: seeded admin
npm run start:dev           # → http://localhost:5000
```

Swagger docs: `http://localhost:5000/api/docs` (dev only unless
`SWAGGER_ENABLED=true`).

Key env vars (`api/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`REDIS_HOST/PORT/DB`, `MAIL_*`, `ALLOWED_ORIGINS`, `APP_URL`, `TRUST_PROXY`,
`SWAGGER_ENABLED`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_CALLBACK_URL` (web origin, e.g.
`http://localhost:3000/api/v1/auth/google/callback`), `CLOUDINARY_*`.

### Frontend (`web/`)

```bash
cd web
npm install
```

Create `web/.env.local`:

```env
API_ORIGIN=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Then:

```bash
npm run dev                 # → http://localhost:3000
```

> Note: the chat socket connects **directly** to `NEXT_PUBLIC_SOCKET_URL`
> (the Next dev proxy cannot forward Engine.IO/WebSocket reliably); REST stays
> same-origin through the Next proxy so the httpOnly refresh cookie works.

### Google OAuth setup

1. Google Cloud Console → Credentials → **OAuth 2.0 Client ID**
   ("Web application").
2. Add the redirect URI matching `GOOGLE_CALLBACK_URL`.
3. Fill the `GOOGLE_*` vars in `api/.env` — the "Continue with Google" buttons
   on the login/register pages will work.
