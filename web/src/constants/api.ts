export const API_ENDPOINT = {
  // auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_OTP: "/auth/register/verify-otp",
  RESEND_OTP: "/auth/register/resend-verification",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",

  // courses
  COURSE_SECTIONS: "/courses", // base path; sections live at /courses/:courseId/sections (teacher)
  COURSE_LESSONS: "/courses", // base path; lessons live at /courses/:courseId/sections/:sectionId/lessons (teacher)
  TEACHER_COURSES: "/teacher/courses",
  STUDENT_COURSES: "/student/courses",
  ENROLLMENTS: "/enrollments",
  PUBLIC_COURSES: "/public/courses",

  // assessments
  ASSESSMENT: "/assessments",
  ATTEMPTS: "/attempts",
} as const;
