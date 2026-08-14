const DASHBOARD = "/dashboard";

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  REGISTER_VERIFY: "/register/verify",

  // Dashboard routes
  DASHBOARD: DASHBOARD,
  COURSE: DASHBOARD + "/course",
  COURSE_LIST: DASHBOARD + "/course",
  COURSE_CREATE: DASHBOARD + "/course/new",
  COURSE_DETAIL: DASHBOARD + "/course/:id",
  COURSE_EDIT: DASHBOARD + "/course/:id/edit",
  COURSE_ASSESSMENT_CREATE:
    DASHBOARD + "/course/:courseId/section/:sectionId/assessment/new",
  ASSESSMENT: DASHBOARD + "/assessment",
  ASSESSMENT_LIST: DASHBOARD + "/assessment",
  ASSESSMENT_CREATE: DASHBOARD + "/assessment/new",
  ASSESSMENT_DETAIL: DASHBOARD + "/assessment/:id",
  MESSAGE: DASHBOARD + "/message",
  MESSAGE_INBOX: DASHBOARD + "/message",
  MESSAGE_COMPOSE: DASHBOARD + "/message/compose",
  SETTINGS: DASHBOARD + "/settings",
  HELP: DASHBOARD + "/help",
};
