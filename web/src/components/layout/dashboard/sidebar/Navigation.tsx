import { ROUTES } from "@/constants/routes";
import { RoleUser } from "@/types/role.type";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Settings,
  HelpCircle,
  Plus,
  FolderOpen,
  Inbox,
} from "lucide-react";

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
};

// Common items shown at the bottom of the menu for EVERY role.
const commonItems: NavItem[] = [
  { name: "Settings", icon: <Settings />, path: ROUTES.SETTINGS },
  { name: "Help & Support", icon: <HelpCircle />, path: ROUTES.HELP },
];

// Role-based navigation items.
export const getNavItems = (role: string | undefined): NavItem[] => {
  const isTeacher = role === RoleUser.TEACHER;

  const baseItems: NavItem[] = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: ROUTES.DASHBOARD },
    {
      // The `Courses` entry differs per role:
      //  - TEACHER: "My Courses" + "New Course" (full authoring tools).
      //  - STUDENT: "My Courses" only (courses the student is enrolled in).
      name: "Courses",
      icon: <BookOpen />,
      path: ROUTES.COURSE,
      subItems: [
        { name: "My Courses", path: ROUTES.COURSE, icon: <FolderOpen /> },
        ...(isTeacher
          ? [
              {
                name: "New Course",
                path: ROUTES.COURSE_CREATE,
                icon: <Plus />,
              },
            ]
          : []),
      ],
    },
    {
      // Chat entry shared by both roles — group conversations per course live
      // in the Inbox. (Direct / 1:1 compose is deferred to a later iteration.)
      name: "Messages",
      icon: <MessageSquare />,
      path: ROUTES.MESSAGE_INBOX,
      subItems: [
        { name: "Inbox", path: ROUTES.MESSAGE_INBOX, icon: <Inbox /> },
      ],
    },
  ];

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
