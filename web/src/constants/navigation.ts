export interface NavItem {
  label: string;
  href: string;
}

export const publicNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];
