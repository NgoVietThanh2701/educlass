"use client";

import { useState } from "react";

import { Moon, Search, Sun } from "lucide-react";

import { useSidebar } from "@/components/layout/dashboard/sidebar/SidebarContext";
import UserMenu from "@/components/shared/UserMenu";

export default function Header() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  // Initialize isDark from document class to avoid "setState in effect" warning
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-30 flex w-full border-b border-border bg-card">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:px-6">
        {/* Left: toggle + search */}
        <div className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-3 sm:gap-4 lg:w-auto lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            type="button"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:h-11 lg:w-11 lg:border lg:border-border"
          >
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25H14.6666C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11Z"
              />
            </svg>
          </button>

          {/* Search (desktop only) */}
          <form className="hidden lg:block" role="search">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Search…"
                className="h-11 w-full rounded-lg border border-border bg-transparent py-2.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none xl:w-107"
              />
            </div>
          </form>
        </div>

        {/* Right: actions */}
        <div className="flex w-full items-center justify-between gap-4 px-5 py-4 lg:w-auto lg:justify-end lg:px-0">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label="Toggle dark mode"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* User menu - reuse the shared component (handles logout internally) */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
