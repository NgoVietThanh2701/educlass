// statement setup database
npx prisma migrate dev --create-only --name init-project
add sequence to migration.sql
npx prisma migrate dev
npx prisma generate

/_ 1. Create admin account _/
type terminal in api folder: npx prisma db seed

---

/_ 2. --------- SQL for create sequence postgres _/

-- Teacher sequence
CREATE SEQUENCE teacher_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

-- Student sequence
CREATE SEQUENCE student_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;
