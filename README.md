# EduClass

EduClass is an education platform backend built with NestJS, designed to support two main user roles: **Teacher** and **Student**.

## Main users

- **Teacher**
  - Create and manage classes
  - Create exams and exam sessions
  - Manage class students
  - Configure group chat permissions
- **Student**
  - Join classes
  - Start and submit exam attempts
  - Save answers during an attempt
  - View own attempt history
  - Participate in chats and upload attachments

## Key features

- User authentication with JWT access and refresh tokens
- Role-based access control for teacher and student actions
- Class and student enrollment management
- Exam creation, questions, options and status control
- Scheduled exam sessions with open/close times
- Attempt flow with start, auto-save answers, submit, and timeout handling
- Filtered/paginated attempt listing for teachers and students
- Real-time chat with conversation groups and file attachments
- File upload validation and Cloudinary integration
- Global response formatting and rate limiting with throttling
- Email sending with templated OTP and welcome messages

## Backend structure

The backend is organized as a modular NestJS application.

- `src/main.ts` — application bootstrap, global validation, CORS, and Swagger setup
- `src/app.module.ts` — application module imports, global interceptors, and throttling guard
- `src/common/` — shared utilities, decorators, guards, interceptors, constants, and DTOs
- `src/modules/auth/` — authentication, registration, login, refresh tokens, and JWT strategies
- `src/modules/class/` — class creation, update, student enrollment, and class-specific operations
- `src/modules/exams/` — exam management, question and option CRUD
- `src/modules/exam-session/` — exam session scheduling, opening, closing, and session listing
- `src/modules/exam-attempt/` — attempt lifecycle, answer syncing, scoring, and listing
- `src/modules/chat/` — conversation and message handling, attachment upload, real-time gateway
- `src/modules/mail/` — email templates, mail service, and SMTP verification
- `src/modules/otp/` — OTP generation and verification flow
- `src/prisma/` — database schema and migration setup

## Technology stack

- **Framework:** NestJS
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** Passport JWT, refresh token strategy
- **Email:** `@nestjs-modules/mailer` with SMTP transport
- **Real-time:** WebSocket gateway with `socket.io`
- **File uploads:** Cloudinary integration for attachment storage
- **Rate limiting:** `@nestjs/throttler`
- **Validation:** `class-validator`, `class-transformer`, Nest validation pipe
- **Task scheduling:** `@nestjs/schedule`

## Libraries used

- `@nestjs/jwt`, `@nestjs/passport`
- `@nestjs/platform-socket.io`, `@nestjs/schedule`, `@nestjs/swagger`
- `@nestjs/throttler`, `@nestjs-modules/mailer`
- `passport-jwt`, `cloudinary`, `bcrypt`, `nodemailer`
- `@prisma/client`, `prisma`
- `class-validator`, `class-transformer`
- `socket.io`, `rxjs`, `pg`

## Setup

1. Install dependencies:

```bash
cd api
npm install
```

2. Configure environment variables in `.env`.

3. Run database migrations:

```bash
npx prisma migrate deploy
```

4. Start the backend server:

```bash
npm run start:dev
```

5. Open API docs at `http://localhost:5000/api/docs`

## Notes

- Global throttling is configured in `src/app.module.ts` with `ttl: 60` and `limit: 100`.
- Custom controller-level throttling decorators are used to apply stricter rate limits where needed.
- The code is structured for maintainability with modular NestJS design and Prisma-based data modeling.
