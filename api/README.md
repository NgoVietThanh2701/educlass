create admin account: npx prisma db seed

---

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
