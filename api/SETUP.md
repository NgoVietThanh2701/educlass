# EduClass - Project Setup Guide

## 1. Database Setup

### Reset database

```bash
npx prisma migrate reset
```

### Create initial migration

```bash
npx prisma migrate dev --create-only --name init-project
```

> **Note**
>
> Sau khi tạo migration, hãy mở file `migration.sql` và thêm các câu lệnh tạo sequence.

### Apply migration

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

---

## 2. Seed Admin Account

Chạy trong thư mục **API**:

```bash
npx prisma db seed
```

---

## 3. PostgreSQL Sequences

### Create student and teacher Sequence

```sql
CREATE SEQUENCE teacher_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

CREATE SEQUENCE student_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
```

---

## 4. Redis

### Kiểm tra Redis Container

```bash
docker exec -it educlass-redis redis-cli
```

### Liệt kê tất cả keys

```bash
KEYS *
```

---

## 5. Generate DBML

Tạo file DBML từ Prisma schema:

```bash
db2dbml postgres "connection string db" > prisma/schema.dbml
```
