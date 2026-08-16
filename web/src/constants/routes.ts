const DASHBOARD = "/dashboard";

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  REGISTER_VERIFY: "/register/verify",
  /** Public course catalog page (all courses). */
  COURSE_LIST: "/courses",
  /** Public course detail page. */
  COURSE_DETAIL_PUBLIC: "/course/:slug",

  // Dashboard routes
  DASHBOARD: DASHBOARD,
  COURSE: DASHBOARD + "/course",
  COURSE_CREATE: DASHBOARD + "/course/new",
  COURSE_DETAIL: DASHBOARD + "/course/:slug",
  COURSE_EDIT: DASHBOARD + "/course/:slug/edit",
  COURSE_ASSESSMENT_CREATE:
    DASHBOARD + "/course/:slug/section/:sectionId/assessment/new",
  COURSE_ASSESSMENT_EDIT:
    DASHBOARD +
    "/course/:slug/section/:sectionId/assessment/:assessmentId/edit",
    /** Student learning hub for an enrolled course (curriculum / first lesson). */
  STUDENT_COURSE_LEARN: DASHBOARD + "/learn/:slug",
  /** Student lesson player: `/learn/:slug/lesson/:lessonId` (lesson id is unique). */
  STUDENT_LESSON: DASHBOARD + "/learn/:slug/lesson/:lessonId",
  /** Student assessment slot within the lesson player. */
  STUDENT_ASSESSMENT: DASHBOARD + "/learn/:slug/assessment/:assessmentId",
  ASSESSMENT: DASHBOARD + "/assessment",
  ASSESSMENT_CREATE: DASHBOARD + "/assessment/new",
  ASSESSMENT_DETAIL: DASHBOARD + "/assessment/:id",
  MESSAGE_INBOX: DASHBOARD + "/message",
  MESSAGE_COMPOSE: DASHBOARD + "/message/compose",
  SETTINGS: DASHBOARD + "/settings",
  HELP: DASHBOARD + "/help",
};
