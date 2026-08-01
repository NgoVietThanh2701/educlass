import { GitBranch, Globe2, Mail, MessageCircle, Send } from "lucide-react";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterContact {
  label: string;
  href: string;
  icon: typeof Send;
}

export const footerQuickLinks: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export const footerResources: FooterLink[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export const footerContacts: FooterContact[] = [
  { label: "LinkedIn", href: "https://linkedin.com", icon: Send },
  { label: "Facebook", href: "https://facebook.com", icon: MessageCircle },
  { label: "Google", href: "https://google.com", icon: Globe2 },
  { label: "Github", href: "https://github.com", icon: GitBranch },
];
