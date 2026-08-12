import type { ReactNode } from "react";

// Dashboard-scoped styles (Tailwind utilities for the sidebar/header).
import "./dashboard.css";

import DashboardShell from "@/components/layout/dashboard/DashboardShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
