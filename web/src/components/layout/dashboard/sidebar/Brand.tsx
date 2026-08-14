"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ROUTES } from "@/constants/routes";

interface BrandProps {
  showText: boolean;
}

export function Brand({ showText }: BrandProps) {
  return (
    <Link
      href={ROUTES.HOME}
      className="flex shrink-0 items-center gap-2"
      aria-label="EduClass dashboard"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </span>
      {showText && (
        <span className="font-heading text-lg font-semibold text-sidebar-foreground">
          EduClass
        </span>
      )}
    </Link>
  );
}
