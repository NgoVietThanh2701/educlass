"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Container from "@/components/layout/public/Container";
import Logo from "@/components/shared/Logo";
import { publicNavItems } from "@/constants/navigation";
import { collapseMotion, fadeSlideMotion } from "@/lib/motion";
import { Menu, X } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative w-full border-b border-border bg-background/85 backdrop-blur">
      <Container className="py-3 sm:py-4 md:py-4 lg:py-4">
        <div className="flex h-12 items-center justify-between gap-3 sm:h-14 sm:gap-4 md:h-12 lg:h-12">
          <Logo />

          <nav className="hidden md:flex md:items-center md:gap-6">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item relative inline-block text-sm font-medium text-foreground/90"
              >
                <span className="block transform transition-transform duration-200">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="hidden text-sm text-foreground/90 hover:text-primary sm:inline-flex"
            >
              Đăng nhập
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-95"
            >
              Đăng ký
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-foreground transition hover:border-primary hover:text-primary md:hidden"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5 pointer-events-none" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              {...collapseMotion}
              className="absolute inset-x-0 top-full z-50 overflow-hidden border-b border-border bg-background/95 shadow-lg backdrop-blur md:hidden"
            >
              <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-4 sm:justify-start sm:px-6 sm:py-5 md:px-8 lg:px-8">
                <motion.nav
                  {...fadeSlideMotion}
                  className="flex flex-col items-center gap-3 sm:items-start"
                >
                  {publicNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-foreground/90 transition hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-foreground/90 transition hover:text-primary sm:hidden"
                    onClick={() => setIsOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                </motion.nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
