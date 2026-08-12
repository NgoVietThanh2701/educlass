"use client";

import { useSidebar } from "@/components/layout/dashboard/sidebar/SidebarContext";

export function MobileDrawerHandle() {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleMobileSidebar}
      aria-label="Close sidebar"
      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
