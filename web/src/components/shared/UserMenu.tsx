"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { fadeSlideMotion } from "@/lib/motion";
import { clearSessionMarker } from "@/lib/cookie";
import { toast } from "sonner";

export default function UserMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);

  const logoutMutation = useLogout();

  // Observe the mutation state. We clear local auth INSIDE this effect (after
  // showing the toast + navigating) so the component stays mounted until the
  // feedback has run — otherwise the header unmounting UserMenu would swallow it.
  useEffect(() => {
    const succeeded = logoutMutation.isSuccess;
    const failed = logoutMutation.isError;

    if (!succeeded && !failed) {
      return;
    }

    if (succeeded) {
      toast.success("Đăng xuất thành công!");
    } else {
      toast.error("Đăng xuất không thành công. Vui lòng thử lại.");
    }

    // Server-side revoke is best-effort; always reset local auth afterwards.
    clearSessionMarker();
    clearAuth();
    router.push(ROUTES.HOME);
  }, [logoutMutation.isSuccess, logoutMutation.isError, clearAuth, router]);

  // Get initials from fullName for a compact avatar
  const fullName = user?.fullName ?? "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logoutMutation.mutate(undefined);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        >
          {initials || "U"}
        </span>

        <span className="hidden max-w-32 truncate font-medium text-foreground sm:inline">
          {fullName}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-foreground/60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...fadeSlideMotion}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-background p-1 shadow-lg"
          >
            <div className="border-b border-border px-3 py-2 sm:hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              onClick={() => handleNavigate(ROUTES.DASHBOARD)}
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </button>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
