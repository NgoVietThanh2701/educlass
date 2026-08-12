import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  ListChecks,
  Settings,
  HelpCircle,
  Plus,
  FolderOpen,
  Inbox,
  Send,
  FileText,
} from "lucide-react";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
};

// Role-based navigation items
export const getNavItems = (role: string | undefined): NavItem[] => {
  const studentItems: NavItem[] = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: ROUTES.DASHBOARD },
    {
      name: "Courses",
      icon: <BookOpen />,
      path: ROUTES.COURSE_LIST,
      subItems: [
        { name: "My Courses", path: ROUTES.COURSE_LIST, icon: <FolderOpen /> },
        { name: "New Course", path: ROUTES.COURSE_CREATE, icon: <Plus /> },
      ],
    },
    {
      name: "Messages",
      icon: <MessageSquare />,
      path: ROUTES.MESSAGE_INBOX,
      subItems: [
        { name: "Inbox", path: ROUTES.MESSAGE_INBOX, icon: <Inbox /> },
        { name: "Compose", path: ROUTES.MESSAGE_COMPOSE, icon: <Send /> },
      ],
    },
  ];

  const teacherItems: NavItem[] = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: ROUTES.DASHBOARD },
    {
      name: "Courses",
      icon: <BookOpen />,
      path: ROUTES.COURSE_LIST,
      subItems: [
        { name: "My Courses", path: ROUTES.COURSE_LIST, icon: <FolderOpen /> },
        { name: "New Course", path: ROUTES.COURSE_CREATE, icon: <Plus /> },
      ],
    },
    {
      name: "Assessments",
      icon: <ListChecks />,
      path: ROUTES.ASSESSMENT_LIST,
      subItems: [
        { name: "My Assessments", path: ROUTES.ASSESSMENT_LIST, icon: <FileText /> },
        { name: "Create Assessment", path: ROUTES.ASSESSMENT_CREATE, icon: <Plus /> },
      ],
    },
    {
      name: "Messages",
      icon: <MessageSquare />,
      path: ROUTES.MESSAGE_INBOX,
      subItems: [
        { name: "Inbox", path: ROUTES.MESSAGE_INBOX, icon: <Inbox /> },
        { name: "Compose", path: ROUTES.MESSAGE_COMPOSE, icon: <Send /> },
      ],
    },
  ];

  // Common items for both roles (placed at the bottom)
  const commonItems: NavItem[] = [
    { name: "Settings", icon: <Settings />, path: ROUTES.SETTINGS },
    { name: "Help & Support", icon: <HelpCircle />, path: ROUTES.HELP },
  ];

  switch (role) {
    case "STUDENT":
      return [...studentItems, ...commonItems];
    case "TEACHER":
      return [...teacherItems, ...commonItems];
    default:
      // Fallback to student if role is unknown
      return [...studentItems, ...commonItems];
  }
};

// Separate main items and common items for rendering in different sections
export const getMainNavItems = (role: string | undefined): NavItem[] => {
  const items = getNavItems(role);
  return items.filter(
    (nav) => nav.path !== ROUTES.SETTINGS && nav.path !== ROUTES.HELP,
  );
};

export const getCommonNavItems = (role: string | undefined): NavItem[] => {
  const items = getNavItems(role);
  return items.filter(
    (nav) => nav.path === ROUTES.SETTINGS || nav.path === ROUTES.HELP,
  );
};
