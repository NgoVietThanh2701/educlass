"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/layout/dashboard/sidebar/SidebarContext";
import Sidebar from "@/components/layout/dashboard/sidebar/Sidebar";
import Header from "./Header";

function Shell({ children }: { children: ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } =
    useSidebar();

  // Shift the main content to sit beside the fixed sidebar.
  const contentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-72"
      : "lg:ml-[88px]";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          aria-hidden="true"
          onClick={toggleMobileSidebar}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <div
        className={cn(
          "flex h-dvh flex-col overflow-hidden transition-all duration-300 ease-in-out",
          contentMargin,
        )}
      >
        <Header />
        <main className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}
