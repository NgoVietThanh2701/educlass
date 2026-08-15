import { ROUTES } from "@/constants/routes";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Settings,
  HelpCircle,
  Plus,
  FolderOpen,
  Inbox,
  Send,
} from "lucide-react";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
};

// Both STUDENT and TEACHER share the same base dashboard menu today. The `role`
// parameter is kept so future role-specific entries (e.g. teacher-only tools)
// are easy to add without restructuring the callers.
const baseItems: NavItem[] = [
  { name: "Dashboard", icon: <LayoutDashboard />, path: ROUTES.DASHBOARD },
  {
    name: "Courses",
    icon: <BookOpen />,
    path: ROUTES.COURSE,
    subItems: [
      { name: "My Courses", path: ROUTES.COURSE, icon: <FolderOpen /> },
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

// Common items for both roles (placed at the bottom, under their own section).
const commonItems: NavItem[] = [
  { name: "Settings", icon: <Settings />, path: ROUTES.SETTINGS },
  { name: "Help & Support", icon: <HelpCircle />, path: ROUTES.HELP },
];

// Role-based navigation items
export const getNavItems = (role: string | undefined): NavItem[] => {
  void role; // intentionally unused — roles share one menu (see comment above)

  return [...baseItems, ...commonItems];
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
